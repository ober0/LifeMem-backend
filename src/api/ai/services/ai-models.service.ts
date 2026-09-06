import { ChatOpenAI } from '@langchain/openai';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { ModelType } from '@prisma/client';
import OpenAI from 'openai';

import { appConstants } from '../../../common/config/app.constants';
import type { AiConfig } from '../../../common/config/env';
import { aiConfig } from '../../../common/config/env';
import { apiError } from '../../../common/helpers/errors';
import { collectUniqueModelsSettingsIds } from '../../../common/helpers/models-settings';
import { AiProvider } from '../../../common/types/ai/ai-provider.enum';
import { AiModelService } from '../../ai-model/ai-model.service';
import { ServiceSettingsService } from '../../service-settings/service-settings.service';

export type AiRuntimeModel = ChatOpenAI;

type ProviderClientConfig = {
    apiKey: string;
    configuration: { baseURL: string };
};

export type SpeechToTextRuntime = {
    name: string;
    client: OpenAI;
    provider: AiProvider;
};

@Injectable()
export class AiModelsService {
    private readonly logger = new Logger(AiModelsService.name);
    private readonly models = new Map<string, AiRuntimeModel>();

    constructor(
        @Inject(aiConfig.KEY) private readonly ai: AiConfig,
        private readonly serviceSettingsService: ServiceSettingsService,
        private readonly aiModelService: AiModelService
    ) {}

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

    async ensureChatModel(modelId: string): Promise<ChatOpenAI> {
        const existing = this.models.get(modelId);
        if (existing instanceof ChatOpenAI) {
            return existing;
        }

        if (existing) {
            throw apiError.badRequest('ai.unexpected_model_type', { name: modelId });
        }

        const runtime = await this.loadRuntimeModel(modelId);
        if (!(runtime instanceof ChatOpenAI)) {
            throw apiError.badRequest('ai.unexpected_model_type', { name: modelId });
        }

        return runtime;
    }

    async resolveSpeechToTextModel(modelId: string): Promise<SpeechToTextRuntime> {
        const settings = await this.serviceSettingsService.getJsonForRequest();
        const provider = settings.models.provider;
        const providerConfig = this.getProviderClientConfig(provider);

        if (!providerConfig.apiKey) {
            throw apiError.badRequest('ai.api_key_missing', { provider });
        }

        const [dbModel] = await this.aiModelService.findByIds([modelId]);
        if (!dbModel || !dbModel.isActive) {
            throw apiError.notFound('ai_model.not_found');
        }

        if (dbModel.type !== ModelType.SpeechToText) {
            throw apiError.badRequest('ai.unexpected_model_type', { name: dbModel.name });
        }

        return {
            name: dbModel.name,
            provider,
            client: new OpenAI({
                apiKey: providerConfig.apiKey,
                baseURL: providerConfig.configuration.baseURL
            })
        };
    }

    private async loadRuntimeModel(modelId: string): Promise<AiRuntimeModel> {
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
        if (!runtime) {
            throw apiError.badRequest('ai.unexpected_model_type', { name: dbModel.name });
        }

        this.models.set(modelId, runtime);
        return runtime;
    }

    private createRuntimeModel(
        dbModel: { id: string; name: string; type: ModelType; isActive: boolean },
        providerConfig: ProviderClientConfig
    ): AiRuntimeModel | null {
        if (dbModel.type === ModelType.TextToText || dbModel.type === ModelType.ImageToText) {
            return new ChatOpenAI({
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
}
