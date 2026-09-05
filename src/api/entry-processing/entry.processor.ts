import { Processor, WorkerHost } from '@nestjs/bullmq';
import { HttpException, Logger } from '@nestjs/common';
import type { Job } from 'bullmq';

import type { ErrorVariables } from '../../common/helpers/errors';
import { errorTranslations } from '../../common/translation/error-translations';
import {
    type baseEntryJobPayload,
    DelayedJob,
    type DelayedJobPayloads,
    ENTRY_QUEUE,
    type EntryJobName
} from '../delayed-worker/delayed-worker.constants';
import { EntryEmbeddingService } from '../entry-embedding/entry-embedding.service';
import { EntryLocationService } from '../entry-location/entry-location.service';
import { EntryVisionService } from '../entry-vision/entry-vision.service';
import { EntryProcessingService } from './entry-processing.service';

@Processor(ENTRY_QUEUE)
export class EntryProcessor extends WorkerHost {
    private readonly logger = new Logger(EntryProcessor.name);

    constructor(
        private readonly entryLocationService: EntryLocationService,
        private readonly entryEmbeddingService: EntryEmbeddingService,
        private readonly entryProcessingService: EntryProcessingService,
        private readonly entryVisionService: EntryVisionService
    ) {
        super();
    }

    async process(job: Job): Promise<void> {
        const data = job.data as baseEntryJobPayload;

        await this.entryProcessingService.markJobRunning(data.jobId);

        try {
            switch (job.name) {
                case DelayedJob.EntryLocation:
                    await this.entryLocationService.processEntryLocation(
                        job.data as DelayedJobPayloads[typeof DelayedJob.EntryLocation]
                    );
                    break;
                case DelayedJob.EntryLocationAndPeopleDetect:
                    await this.entryLocationService.processEntryLocationAndPeopleDetect(
                        job.data as DelayedJobPayloads[typeof DelayedJob.EntryLocationAndPeopleDetect]
                    );
                    break;
                case DelayedJob.EntryEmbedTitle:
                    await this.entryEmbeddingService.processEntryEmbedTitle(
                        job.data as DelayedJobPayloads[typeof DelayedJob.EntryEmbedTitle]
                    );
                    break;
                case DelayedJob.EntryEmbedText:
                    await this.entryEmbeddingService.processEntryEmbedText(
                        job.data as DelayedJobPayloads[typeof DelayedJob.EntryEmbedText]
                    );
                    break;
                case DelayedJob.EntryEmbedImage:
                    await this.entryEmbeddingService.processEntryEmbedImage(
                        job.data as DelayedJobPayloads[typeof DelayedJob.EntryEmbedImage]
                    );
                    break;
                case DelayedJob.EntryVision:
                    await this.entryVisionService.processEntryVision(
                        job.data as DelayedJobPayloads[typeof DelayedJob.EntryVision]
                    );
                    break;
                default:
                    this.logger.warn(`Unknown delayed job: ${job.name}`);
                    await this.entryProcessingService.markJobFailed(data.jobId, `Unknown job: ${job.name}`);
                    return;
            }

            this.logger.log(`end job ${job.name} for entry`);
            await this.entryProcessingService.onJobFinished(job.name as EntryJobName, data);
        } catch (error: unknown) {
            const message = this.resolveErrorMessage(error);
            this.logger.error(`Job end with error ${message}`, error instanceof Error ? error.stack : undefined);

            await this.entryProcessingService.markJobFailed(data.jobId, message);

            throw error;
        }
    }

    private resolveErrorMessage(error: unknown): string {
        if (error instanceof HttpException) {
            const response = error.getResponse();

            if (
                typeof response === 'object' &&
                response !== null &&
                typeof (response as { code?: unknown }).code === 'string'
            ) {
                const code = (response as { code: string }).code;
                const variables =
                    'variables' in response && typeof response.variables === 'object' && response.variables !== null
                        ? (response.variables as ErrorVariables)
                        : undefined;

                if (errorTranslations.hasKey(code)) {
                    return errorTranslations.byCode({ code, variables });
                }

                return code;
            }

            if (typeof response === 'string') {
                return errorTranslations.hasKey(response) ? errorTranslations.byCode({ code: response }) : response;
            }

            return error.message;
        }

        if (error instanceof Error) {
            return error.message;
        }

        return 'internal error';
    }
}
