import { Injectable, Logger } from '@nestjs/common';
import { EntryVectorKind } from '@prisma/client';

import { apiError } from '../../common/helpers/errors';
import { DelayedJob, type DelayedJobPayloads } from '../delayed-worker/delayed-worker.constants';
import { EmbeddingService } from '../embedding/embedding.service';
import { EntryEmbeddingRepository } from './entry-embedding.repository';

type EmbedDelayedJob =
    typeof DelayedJob.EntryEmbedTitle | typeof DelayedJob.EntryEmbedText | typeof DelayedJob.EntryEmbedImage;

@Injectable()
export class EntryEmbeddingService {
    private readonly logger = new Logger(EntryEmbeddingService.name);

    constructor(
        private readonly repository: EntryEmbeddingRepository,
        private readonly embeddingService: EmbeddingService
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

    async processEntryEmbedImage(data: DelayedJobPayloads[typeof DelayedJob.EntryEmbedImage]) {
        const images = await this.repository.getEntryImages(data.entryId, data.entryVideoIds);

        if (images.length === 0) {
            this.logger.warn(`skip embed image: no images entryId=${data.entryId}`);
            return true;
        }

        for (const image of images) {
            const text = `image.description \n\n image.aiTranscription`.trim();

            if (!text) {
                this.logger.warn(`skip embed image: empty text imageId=${image.id}`);
                continue;
            }

            await this.embedAndStore({
                entryId: data.entryId,
                text,
                kind: EntryVectorKind.Image,
                delayedJob: DelayedJob.EntryEmbedImage,
                imageId: image.id
            });
        }

        return true;
    }

    private async embedAndStore(data: {
        entryId: string;
        text: string;
        kind: EntryVectorKind;
        delayedJob: EmbedDelayedJob;
        imageId?: string;
    }) {
        const embedData = await this.embeddingService.embedText(data.text, 'passage');

        await Promise.all([
            this.repository.updateUsage(data.entryId, data.delayedJob, {
                aiModelId: embedData.modelId,
                usage: embedData.usage
            }),
            this.repository.createEntryVector({
                entryId: data.entryId,
                kind: data.kind,
                aiModelId: embedData.modelId,
                embedding: embedData.result,
                dimensions: embedData.result.length,
                imageId: data.imageId
            })
        ]);

        return true;
    }
}
