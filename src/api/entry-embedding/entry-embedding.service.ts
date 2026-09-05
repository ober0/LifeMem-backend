import { Injectable, Logger } from '@nestjs/common';
import { EntryVectorKind } from '@prisma/client';

import { appConstants } from '../../common/config/app.constants';
import { apiError } from '../../common/helpers/errors';
import { AiService } from '../ai/ai.service';
import { DelayedJob, type DelayedJobPayloads } from '../delayed-worker/delayed-worker.constants';
import { ServiceSettingsService } from '../service-settings/service-settings.service';
import { EntryEmbeddingRepository } from './entry-embedding.repository';

@Injectable()
export class EntryEmbeddingService {
    private readonly logger = new Logger(EntryEmbeddingService.name);

    constructor(
        private readonly repository: EntryEmbeddingRepository,
        private readonly serviceSettings: ServiceSettingsService,
        private readonly ai: AiService
    ) {}

    async processEntryEmbedTitle(data: DelayedJobPayloads[typeof DelayedJob.EntryEmbedTitle]) {
        const entry = await this.repository.getEntryTitle(data.entryId);
        if (!entry) {
            throw apiError.notFound('entry.not_found');
        }

        const title = entry.title?.trim();
        if (!title) {
            this.logger.warn(`skip embed title: empty title entryId=${data.entryId}`);
            return true;
        }

        return this.embedAndStore({
            entryId: entry.id,
            text: title,
            kind: EntryVectorKind.Title,
            delayedJob: DelayedJob.EntryEmbedTitle
        });
    }

    async processEntryEmbedText(data: DelayedJobPayloads[typeof DelayedJob.EntryEmbedText]) {
        const entry = await this.repository.getEntryText(data.entryId);
        if (!entry) {
            throw apiError.notFound('entry.not_found');
        }

        const text = entry.text?.trim();
        if (!text) {
            this.logger.warn(`skip embed text: empty text entryId=${data.entryId}`);
            return true;
        }

        return this.embedAndStore({
            entryId: entry.id,
            text,
            kind: EntryVectorKind.Text,
            delayedJob: DelayedJob.EntryEmbedText
        });
    }

    private async embedAndStore(data: {
        entryId: string;
        text: string;
        kind: EntryVectorKind;
        delayedJob: typeof DelayedJob.EntryEmbedTitle | typeof DelayedJob.EntryEmbedText;
    }) {
        const serviceSettings = await this.serviceSettings.getJsonForRequest();

        // TODO это надо вытаскивать из тарифа
        const tariff: 'lite' | 'premium' = appConstants.userSettings.defaultDevTariff;

        const modelId = serviceSettings.models.embedding[tariff];

        if (!modelId) {
            throw apiError.internal('service_settings.model_not_found');
        }

        const { requestId } = await this.ai.embed({
            modelId,
            text: data.text
        });

        const { result, usage, timeMs } = await this.ai.waitResult<number[]>(requestId);

        await Promise.all([
            this.repository.updateUsage(data.entryId, data.delayedJob, {
                aiModelId: modelId,
                usage: {
                    ...usage,
                    timeMs
                }
            }),
            this.repository.createEntryVector({
                entryId: data.entryId,
                kind: data.kind,
                aiModelId: modelId,
                embedding: result,
                dimensions: result.length
            })
        ]);

        return true;
    }
}
