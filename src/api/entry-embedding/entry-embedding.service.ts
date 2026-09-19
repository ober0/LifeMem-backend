import { Injectable, Logger } from '@nestjs/common';
import { EntryVectorKind } from '@prisma/client';

import { apiError } from '../../common/helpers/errors';
import { assertNotAborted } from '../../common/helpers/job-abort';
import type { EntryJobExecutionOptions } from '../../common/types/entry-job-execution';
import { DelayedJob, type DelayedJobPayloads } from '../delayed-worker/delayed-worker.constants';
import { EmbeddingService } from '../embedding/embedding.service';
import { buildEntryImageEmbedText } from '../entry-vision/entry-vision.types';
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

    async processEntryEmbedTitle(
        data: DelayedJobPayloads[typeof DelayedJob.EntryEmbedTitle],
        options?: EntryJobExecutionOptions
    ) {
        assertNotAborted(options?.signal);

        const entry = await this.repository.getEntryTitle(data.entryId);
        if (!entry) {
            throw apiError.notFound('entry.not_found');
        }

        const title = entry.title?.trim();
        if (!title) {
            this.logger.warn(`skip embed title: empty title entryId=${data.entryId}`);
            return true;
        }

        assertNotAborted(options?.signal);

        return this.embedAndStore(
            {
                jobId: data.jobId,
                entryId: entry.id,
                text: title,
                kind: EntryVectorKind.Title,
                delayedJob: DelayedJob.EntryEmbedTitle
            },
            options
        );
    }

    async processEntryEmbedText(
        data: DelayedJobPayloads[typeof DelayedJob.EntryEmbedText],
        options?: EntryJobExecutionOptions
    ) {
        assertNotAborted(options?.signal);

        const entry = await this.repository.getEntryText(data.entryId);
        if (!entry) {
            throw apiError.notFound('entry.not_found');
        }

        const text = entry.text?.trim();
        if (!text) {
            this.logger.warn(`skip embed text: empty text entryId=${data.entryId}`);
            return true;
        }

        assertNotAborted(options?.signal);

        return this.embedAndStore(
            {
                jobId: data.jobId,
                entryId: entry.id,
                text,
                kind: EntryVectorKind.Text,
                delayedJob: DelayedJob.EntryEmbedText
            },
            options
        );
    }

    async processEntryEmbedImage(
        data: DelayedJobPayloads[typeof DelayedJob.EntryEmbedImage],
        options?: EntryJobExecutionOptions
    ) {
        assertNotAborted(options?.signal);

        const mediaItems = await this.repository.getEntryMedia(data.entryId, data.entryMediaIds);

        if (mediaItems.length === 0) {
            this.logger.warn(`skip embed image: no media entryId=${data.entryId}`);
            return true;
        }

        for (const media of mediaItems) {
            const text = buildEntryImageEmbedText({
                description: media.description,
                aiTranscription: media.aiTranscription,
                aiMetadata: media.aiMetadata
            }).trim();

            if (!text) {
                this.logger.warn(`skip embed image: empty text mediaId=${media.id}`);
                continue;
            }

            assertNotAborted(options?.signal);

            await this.embedAndStore(
                {
                    jobId: data.jobId,
                    entryId: data.entryId,
                    text,
                    kind: EntryVectorKind.Media,
                    delayedJob: DelayedJob.EntryEmbedImage,
                    mediaId: media.id
                },
                options
            );
        }

        return true;
    }

    private async embedAndStore(
        data: {
            jobId: string;
            entryId: string;
            text: string;
            kind: EntryVectorKind;
            delayedJob: EmbedDelayedJob;
            mediaId?: string;
        },
        options?: EntryJobExecutionOptions
    ) {
        assertNotAborted(options?.signal);

        const embedData = await this.embeddingService.embedText(data.text, 'passage', {
            signal: options?.signal
        });

        assertNotAborted(options?.signal);

        await Promise.all([
            this.repository.updateUsage(data.jobId, {
                aiModelId: embedData.modelId,
                usage: embedData.usage
            }),
            this.repository.createEntryVector({
                entryId: data.entryId,
                kind: data.kind,
                aiModelId: embedData.modelId,
                embedding: embedData.result,
                dimensions: embedData.result.length,
                mediaId: data.mediaId
            })
        ]);

        return true;
    }
}
