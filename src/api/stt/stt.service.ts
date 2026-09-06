import { Injectable } from '@nestjs/common';
import { ModelType } from '@prisma/client';

import { appConstants } from '../../common/config/app.constants';
import { apiError } from '../../common/helpers/errors';
import { AiService } from '../ai/ai.service';
import type { AiTokenUsage } from '../ai/ai.types';
import { AiModelService } from '../ai-model/ai-model.service';
import { ServiceSettingsService } from '../service-settings/service-settings.service';

export type SttTranscribeParams = {
    audio: Buffer;
    filename?: string;
    mimeType?: string;
    language?: string;
    modelId?: string;
    tariff?: 'lite' | 'premium';
};

export type SttTranscribeResult = {
    modelId: string;
    result: string;
    usage: AiTokenUsage;
    timeMs?: number;
};

@Injectable()
export class SttService {
    constructor(
        private readonly aiModelService: AiModelService,
        private readonly serviceSettings: ServiceSettingsService,
        private readonly ai: AiService
    ) {}

    async transcribe(params: SttTranscribeParams): Promise<SttTranscribeResult> {
        const modelId = await this.resolveModelId(params);

        const { requestId } = await this.ai.transcribe({
            modelId,
            audio: params.audio,
            filename: params.filename,
            mimeType: params.mimeType,
            language: params.language
        });

        const response = await this.ai.waitResult<string>(requestId);

        return {
            modelId,
            result: response.result?.trim() ?? '',
            usage: {
                ...response.usage,
                timeMs: response.timeMs
            },
            timeMs: response.timeMs
        };
    }

    private async resolveModelId(params: SttTranscribeParams): Promise<string> {
        if (params.modelId) {
            const [model] = await this.aiModelService.findByIds([params.modelId]);

            if (!model || !model.isActive || model.type !== ModelType.SpeechToText) {
                throw apiError.notFound('ai_model.not_found');
            }

            return model.id;
        }

        const tariff = params.tariff ?? appConstants.userSettings.defaultDevTariff;
        const settings = await this.serviceSettings.getJsonForRequest();
        const sttModelId = settings.models.stt[tariff];

        if (!sttModelId) {
            throw apiError.internal('service_settings.model_not_found');
        }

        return sttModelId;
    }
}
