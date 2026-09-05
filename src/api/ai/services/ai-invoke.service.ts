import {
    AIMessage,
    type BaseMessage,
    HumanMessage,
    SystemMessage,
    ToolMessage
} from '@langchain/core/messages';
import type { StructuredOutputParser } from '@langchain/core/output_parsers';
import { RunnableLambda } from '@langchain/core/runnables';
import type { ChatOpenAI } from '@langchain/openai';
import { Injectable } from '@nestjs/common';
import type { z } from 'zod';

import { appConstants } from '../../../common/config/app.constants';
import { apiError } from '../../../common/helpers/errors';
import { ServiceSettingsService } from '../../service-settings/service-settings.service';
import type { AiInvokeParams, AiInvokeResult, AiInvokeWithToolsParams, AiTokenUsage } from '../ai.types';
import { AiToolsRegistry } from '../tools/ai-tools.registry';
import { AiModelsService } from './ai-models.service';
import { AiUsageService } from './ai-usage.service';

type ParsedStructuredOutput<T> = {
    data: T;
    metadata: unknown;
    raw: BaseMessage;
};

@Injectable()
export class AiInvokeService {
    constructor(
        private readonly models: AiModelsService,
        private readonly usage: AiUsageService,
        private readonly toolsRegistry: AiToolsRegistry,
        private readonly serviceSettingsService: ServiceSettingsService
    ) {}

    async execute(params: AiInvokeParams): Promise<AiInvokeResult<unknown>> {
        const chat = this.withReasoning(await this.models.ensureChatModel(params.modelId), params.reasoning);
        const messages: BaseMessage[] = [];

        if ('instruction' in params) {
            messages.push(new SystemMessage(params.instruction));
        }

        messages.push(...this.toMessages(params.input));

        const settingsPromise = this.serviceSettingsService.getJsonForRequest();

        if ('parser' in params) {
            const [response, settings] = await Promise.all([chat.invoke(messages), settingsPromise]);
            const parsed = await this.parseNode(params.parser).invoke(response);

            return {
                result: parsed.data,
                usage: this.usage.extractUsage(parsed.raw, settings.models.provider)
            };
        }

        const [response, settings] = await Promise.all([chat.invoke(messages), settingsPromise]);

        return {
            result: this.extractTextContent(response),
            usage: this.usage.extractUsage(response, settings.models.provider)
        };
    }

    async executeWithTools(params: AiInvokeWithToolsParams): Promise<AiInvokeResult<unknown>> {
        const chat = this.withReasoning(await this.models.ensureChatModel(params.modelId), params.reasoning);

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

            usage = this.usage.mergeUsage(usage, this.usage.extractUsage(response, settings.models.provider));
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
}
