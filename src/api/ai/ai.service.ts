import {
    AIMessage,
    type BaseMessage,
    HumanMessage,
    SystemMessage,
    ToolMessage
} from '@langchain/core/messages';
import type { StructuredOutputParser } from '@langchain/core/output_parsers';
import { RunnableLambda } from '@langchain/core/runnables';
import { ChatOpenAI, OpenAIEmbeddings } from '@langchain/openai';
import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ModelType } from '@prisma/client';
import { randomUUID } from 'crypto';
import type { z } from 'zod';

import { appConstants } from '../../common/config/app.constants';
import type { AiConfig } from '../../common/config/env';
import { aiConfig } from '../../common/config/env';
import { apiError } from '../../common/helpers/errors';
import { collectUniqueModelsSettingsIds } from '../../common/helpers/models-settings';
import { AiProvider } from '../../common/types/ai/ai-provider.enum';
import { AiModelService } from '../ai-model/ai-model.service';
import { DelayedWorkerService } from '../delayed-worker/delayed-worker.service';
import { ServiceSettingsService } from '../service-settings/service-settings.service';
import type {
    AiInvokeParams,
    AiInvokeResult,
    AiInvokeWithToolsParams,
    AiRequestAccepted,
    AiRequestLookupResult,
    AiTokenUsage
} from './ai.types';
import { AiResponseStore } from './ai-response.store';
import { AiToolsRegistry } from './tools/ai-tools.registry';

export type AiRuntimeModel = ChatOpenAI | OpenAIEmbeddings;

type ProviderClientConfig = {
    apiKey: string;
    configuration: { baseURL: string };
};

type ParsedStructuredOutput<T> = {
    data: T;
    metadata: unknown;
    raw: BaseMessage;
};

@Injectable()
export class AiService implements OnModuleInit {
    private readonly logger = new Logger(AiService.name);
    private readonly models = new Map<string, AiRuntimeModel>();

    private usdRateInRub: number = 80; //default

    constructor(
        @Inject(aiConfig.KEY) private readonly ai: AiConfig,
        private readonly serviceSettingsService: ServiceSettingsService,
        private readonly aiModelService: AiModelService,
        private readonly toolsRegistry: AiToolsRegistry,
        private readonly responseStore: AiResponseStore,
        private readonly delayedWorker: DelayedWorkerService
    ) {}

    async onModuleInit(): Promise<void> {
        await this.refreshModels();
        await this.refreshUsdRate();

        setInterval(async () => {
            await this.refreshUsdRate();
        }, appConstants.ai.refreshUsdMs);
    }

    // TODO можно потом вынести в отдельный модуль если будет переиспользоваться
    private async refreshUsdRate() {
        const response = await fetch('https://api.frankfurter.dev/v2/rate/USD/RUB');

        const { rate } = await response.json();

        if (typeof rate !== 'number' || !Number.isFinite(rate)) {
            return;
        }

        this.usdRateInRub = rate as number;
    }

    async invoke(params: AiInvokeParams): Promise<AiRequestAccepted> {
        return this.enqueueRequest(() => this.executeInvoke(params));
    }

    async invokeWithTools(params: AiInvokeWithToolsParams): Promise<AiRequestAccepted> {
        return this.enqueueRequest(() => this.executeInvokeWithTools(params));
    }

    getResult<T = unknown>(requestId: string): AiRequestLookupResult<T> {
        return this.responseStore.take<T>(requestId);
    }

    async refreshModels(): Promise<void> {
        const settings = await this.serviceSettingsService.getJsonForRequest();
        const providerConfig = this.getProviderClientConfig(settings.models.provider);

        if (!providerConfig.apiKey) {
            this.models.clear();
            this.logger.warn(`AI provider API key is missing for ${settings.models.provider}`);
            return;
        }

        const uniqueIds = collectUniqueModelsSettingsIds(settings.models);
        const dbModels = await this.aiModelService.findByIds(uniqueIds);
        const next = new Map<string, AiRuntimeModel>();

        for (const dbModel of dbModels) {
            if (!dbModel.isActive) {
                continue;
            }

            const runtime = this.createRuntimeModel(dbModel, providerConfig);
            if (runtime) {
                next.set(dbModel.id, runtime);
            }
        }

        this.models.clear();
        for (const [id, model] of next) {
            this.models.set(id, model);
        }

        this.logger.log(`AI models refreshed: ${this.models.size} via ${settings.models.provider}`);
    }

    async addModels(): Promise<void> {
        const settings = await this.serviceSettingsService.getJsonForRequest();
        const providerConfig = this.getProviderClientConfig(settings.models.provider);

        if (!providerConfig.apiKey) {
            this.logger.error(`AI provider API key is missing for ${settings.models.provider}`);
            return;
        }

        const missingIds = collectUniqueModelsSettingsIds(settings.models).filter((id) => !this.models.has(id));
        if (missingIds.length === 0) {
            return;
        }

        const dbModels = await this.aiModelService.findByIds(missingIds);

        for (const dbModel of dbModels) {
            if (!dbModel.isActive) {
                continue;
            }

            const runtime = this.createRuntimeModel(dbModel, providerConfig);
            if (!runtime) {
                continue;
            }

            this.models.set(dbModel.id, runtime);
        }
    }

    private enqueueRequest(executor: () => Promise<AiInvokeResult<unknown>>): AiRequestAccepted {
        const requestId = randomUUID();
        this.responseStore.createPending(requestId);

        this.delayedWorker.setImmediate(async () => {
            try {
                const payload = await executor();
                this.responseStore.setReady(requestId, payload);
            } catch (error) {
                const message = error instanceof Error ? error.message : 'Unknown AI error';
                this.logger.error(`AI request failed requestId=${requestId}: ${message}`);
                this.responseStore.setFailed(requestId, message);
            }
        });

        return { requestId };
    }

    private async executeInvoke(params: AiInvokeParams): Promise<AiInvokeResult<unknown>> {
        const chat = this.withReasoning(await this.ensureChatModel(params.modelId), params.reasoning);
        const messages: BaseMessage[] = [];

        if ('instruction' in params) {
            messages.push(new SystemMessage(params.instruction));
        }

        messages.push(...this.toMessages(params.input));

        const settingsPromise = this.serviceSettingsService.getJsonForRequest();

        if ('parser' in params) {
            const [parsed, settings] = await Promise.all([
                chat.pipe(this.parseNode(params.parser)).invoke(messages),
                settingsPromise
            ]);

            return {
                result: parsed.data,
                usage: this.extractUsage(parsed.raw, settings.models.provider)
            };
        }

        const [response, settings] = await Promise.all([chat.invoke(messages), settingsPromise]);

        return {
            result: this.extractTextContent(response),
            usage: this.extractUsage(response, settings.models.provider)
        };
    }

    private async executeInvokeWithTools(params: AiInvokeWithToolsParams): Promise<AiInvokeResult<unknown>> {
        const chat = this.withReasoning(await this.ensureChatModel(params.modelId), params.reasoning);

        const tools = this.toolsRegistry.resolve(params.tools, params.toolContext);
        const toolsByName = new Map(tools.map((item) => [item.name, item]));

        const parser = 'parser' in params ? params.parser : null;
        const instruction = 'instruction' in params ? params.instruction : null;

        const model = chat.bindTools(tools);
        const messages: BaseMessage[] = [];

        if (instruction) {
            messages.push(new SystemMessage(instruction));
        }

        messages.push(...this.toMessages(params.input));

        const maxSteps = params.maxSteps ?? appConstants.ai.defaultMaxToolSteps;

        let usage: AiTokenUsage = {
            inputTokens: 0,
            outputTokens: 0,
            totalTokens: 0
        };

        for (let step = 0; step < maxSteps; step++) {
            const [response, settings] = await Promise.all([
                model.invoke(messages),
                this.serviceSettingsService.getJsonForRequest()
            ]);

            usage = this.mergeUsage(usage, this.extractUsage(response, settings.models.provider));
            messages.push(response);

            const toolCalls = response.tool_calls ?? [];
            if (toolCalls.length > 0) {
                for (const call of toolCalls) {
                    const selected = toolsByName.get(call.name);
                    if (!selected) {
                        throw apiError.badRequest('ai.unknown_tool', { tool: call.name });
                    }

                    const toolResult = await selected.invoke(call.args);
                    messages.push(
                        new ToolMessage({
                            content: typeof toolResult === 'string' ? toolResult : JSON.stringify(toolResult),
                            tool_call_id: call.id ?? call.name
                        })
                    );
                }

                continue;
            }

            if (parser) {
                const parsed = await this.parseNode(parser).invoke(response);

                return {
                    result: parsed.data,
                    usage
                };
            }

            return {
                result: this.extractTextContent(response),
                usage
            };
        }

        throw apiError.badRequest('ai.tool_loop_limit');
    }

    private withReasoning(chat: ChatOpenAI, reasoning?: boolean): ChatOpenAI {
        if (reasoning === false) {
            return chat.withConfig({
                reasoning: { effort: 'none' }
            }) as ChatOpenAI;
        }

        if (reasoning === true) {
            return chat.withConfig({
                reasoning: { effort: 'medium' }
            }) as ChatOpenAI;
        }

        return chat;
    }

    private parseNode = <T extends z.ZodObject>(parser: StructuredOutputParser<T>) =>
        new RunnableLambda({
            func: async (message: BaseMessage): Promise<ParsedStructuredOutput<z.infer<T>>> => {
                const toolCalls = 'tool_calls' in message ? message.tool_calls : undefined;
                if (message.content === '' || (Array.isArray(toolCalls) && toolCalls.length !== 0)) {
                    throw new Error('empty content');
                }

                const parsed = (await parser.parse(message.text)) as z.infer<T>;

                return {
                    data: parsed,
                    metadata: message.response_metadata,
                    raw: message
                };
            }
        });

    private async ensureChatModel(modelId: string): Promise<ChatOpenAI> {
        const existing = this.models.get(modelId);
        if (existing instanceof ChatOpenAI) {
            return existing;
        }

        if (existing) {
            throw apiError.badRequest('ai.unexpected_model_type', { name: modelId });
        }

        const settings = await this.serviceSettingsService.getJsonForRequest();
        const providerConfig = this.getProviderClientConfig(settings.models.provider);

        if (!providerConfig.apiKey) {
            throw apiError.badRequest('ai.api_key_missing', { provider: settings.models.provider });
        }

        const [dbModel] = await this.aiModelService.findByIds([modelId]);
        if (!dbModel || !dbModel.isActive) {
            throw apiError.notFound('ai_model.not_found');
        }

        const runtime = this.createRuntimeModel(dbModel, providerConfig);
        if (!(runtime instanceof ChatOpenAI)) {
            throw apiError.badRequest('ai.unexpected_model_type', { name: dbModel.name });
        }

        this.models.set(modelId, runtime);
        return runtime;
    }

    private createRuntimeModel(
        dbModel: { id: string; name: string; type: ModelType; isActive: boolean },
        providerConfig: ProviderClientConfig
    ): AiRuntimeModel | null {
        if (dbModel.type === ModelType.TextToText) {
            return new ChatOpenAI({
                ...providerConfig,
                model: dbModel.name
            });
        }

        if (dbModel.type === ModelType.Embedding) {
            return new OpenAIEmbeddings({
                ...providerConfig,
                model: dbModel.name
            });
        }

        return null;
    }

    private getProviderClientConfig(provider: AiProvider): ProviderClientConfig {
        const baseURL = appConstants.ai.providers[provider].baseURL;

        switch (provider) {
            case AiProvider.Openrouter:
                return {
                    apiKey: this.ai.openrouterApiKey,
                    configuration: { baseURL }
                };
            case AiProvider.Polza:
                return {
                    apiKey: this.ai.polzaAiApiKey,
                    configuration: { baseURL }
                };
        }
    }

    private toMessages(input: AiInvokeParams['input']): BaseMessage[] {
        if (typeof input === 'string') {
            return [new HumanMessage(input)];
        }

        if (Array.isArray(input)) {
            return input.map((item) => {
                if (typeof item === 'string') {
                    return new HumanMessage(item);
                }

                if (item instanceof AIMessage || item instanceof HumanMessage || item instanceof ToolMessage) {
                    return item;
                }

                if (typeof item === 'object' && item !== null && 'role' in item) {
                    const role = String((item as { role: unknown }).role);
                    const content = 'content' in item ? (item as { content: unknown }).content : item;
                    const text = typeof content === 'string' ? content : JSON.stringify(content);

                    if (role === 'assistant') {
                        return new AIMessage(text);
                    }

                    return new HumanMessage(text);
                }

                return new HumanMessage(JSON.stringify(item));
            });
        }

        return [new HumanMessage(String(input))];
    }

    private extractTextContent(message: BaseMessage): string {
        if (typeof message.content === 'string') {
            return message.content;
        }

        return JSON.stringify(message.content);
    }

    private extractUsage(message: BaseMessage, provider: AiProvider): AiTokenUsage {
        const usage = message instanceof AIMessage ? message : undefined;

        let rubCost: number | undefined = undefined;

        const metadataUsage = usage?.response_metadata.usage as { cost?: number };

        if (typeof metadataUsage.cost === 'number') {
            switch (provider) {
                case AiProvider.Openrouter:
                    rubCost = metadataUsage.cost * this.usdRateInRub;
                    break;
                case AiProvider.Polza:
                    rubCost = metadataUsage.cost;
                    break;
            }
        }

        return {
            inputTokens: usage?.usage_metadata?.input_tokens ?? 0,
            outputTokens: usage?.usage_metadata?.output_tokens ?? 0,
            totalTokens: usage?.usage_metadata?.total_tokens ?? 0,
            price: rubCost,
            provider: provider
        };
    }

    private mergeUsage(left: AiTokenUsage, right: AiTokenUsage): AiTokenUsage {
        let price: number | undefined = undefined;

        if (right.price) {
            price = (left.price ?? 0) + right.price;
        }

        return {
            inputTokens: left.inputTokens + right.inputTokens,
            outputTokens: left.outputTokens + right.outputTokens,
            totalTokens: left.totalTokens + right.totalTokens,
            price,
            provider: right.provider ?? left.provider ?? undefined
        };
    }
}
