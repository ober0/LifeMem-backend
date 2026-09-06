import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { Injectable, Logger } from '@nestjs/common';

import { appConstants } from '../../common/config/app.constants';
import { apiError } from '../../common/helpers/errors';
import { AiService } from '../ai/ai.service';
import type { AiTokenUsage } from '../ai/ai.types';
import { DelayedJob, type DelayedJobPayloads } from '../delayed-worker/delayed-worker.constants';
import { S3Service } from '../s3/s3.service';
import { ServiceSettingsService } from '../service-settings/service-settings.service';
import { entrySttPrompts } from './consts/prompts.const';
import { EntrySttRepository } from './entry-stt.repository';

@Injectable()
export class EntrySttService {
    private readonly logger = new Logger(EntrySttService.name);

    constructor(
        private readonly s3: S3Service,
        private readonly repository: EntrySttRepository,
        private readonly serviceSettings: ServiceSettingsService,
        private readonly ai: AiService
    ) {}

    async processEntryStt(data: DelayedJobPayloads[typeof DelayedJob.EntryStt]) {
        const voice = await this.repository.getVoice(data.entryId);

        if (!voice) {
            this.logger.warn(`skip stt: no voice entryId=${data.entryId}`);
            return true;
        }

        const audio = await this.s3.getObjectBuffer(voice.file.key).catch(() => null);

        if (!audio) {
            this.logger.warn(`skip stt: s3 miss entryId=${data.entryId}`);
            return true;
        }

        const serviceSettings = await this.serviceSettings.getJsonForRequest();

        // TODO: брать из тарифа пользователя
        const tariff: 'lite' | 'premium' = appConstants.userSettings.defaultDevTariff;

        const sttModelId = serviceSettings.models.stt[tariff];

        if (!sttModelId) {
            throw apiError.internal('service_settings.model_not_found');
        }

        const { requestId: sttRequestId } = await this.ai.transcribe({
            modelId: sttModelId,
            audio,
            filename: voice.file.filename ?? 'voice.webm',
            mimeType: voice.file.mimeType ?? 'audio/webm'
        });

        const sttResult = await this.ai.waitResult<string>(sttRequestId);
        const text = sttResult.result?.trim() ?? '';
        const usage: AiTokenUsage = {
            ...sttResult.usage,
            timeMs: sttResult.timeMs
        };

        if (!text) {
            this.logger.warn(`skip stt: empty transcript entryId=${data.entryId}`);
            return true;
        }

        // TODO по отдельной кнопке
        // if (tariff === 'premium') {
        //     const refineModelId = serviceSettings.models.sttRefine[tariff];
        //
        //     if (!refineModelId) {
        //         throw apiError.internal('service_settings.model_not_found');
        //     }
        //
        //     const { requestId: refineRequestId } = await this.ai.invoke({
        //         modelId: refineModelId,
        //         reasoning: false,
        //         input: [new SystemMessage(entrySttPrompts.refineTranscript()), new HumanMessage(text)]
        //     });
        //
        //     const refineResult = await this.ai.waitResult<string>(refineRequestId);
        //     const refined = refineResult.result?.trim();
        //
        //     if (refined) {
        //         text = refined;
        //     }
        //
        //     usage = {
        //         inputTokens: usage.inputTokens + refineResult.usage.inputTokens,
        //         outputTokens: usage.outputTokens + refineResult.usage.outputTokens,
        //         totalTokens: usage.totalTokens + refineResult.usage.totalTokens,
        //         price:
        //             usage.price != null || refineResult.usage.price != null
        //                 ? (usage.price ?? 0) + (refineResult.usage.price ?? 0)
        //                 : undefined,
        //         provider: refineResult.usage.provider ?? usage.provider,
        //         timeMs: (usage.timeMs ?? 0) + (refineResult.timeMs ?? 0)
        //     };
        // }

        await Promise.all([
            this.repository.updateEntryText(data.entryId, text),
            this.repository.updateUsage(data.entryId, DelayedJob.EntryStt, {
                aiModelId: sttModelId,
                usage
            })
        ]);

        return true;
    }
}
