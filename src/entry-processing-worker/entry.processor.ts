import { Processor, WorkerHost } from '@nestjs/bullmq';
import { HttpException, Logger } from '@nestjs/common';
import type { Job } from 'bullmq';

import { BullMqQueue } from '../api/bullmq/bullmq.constants';
import {
    type baseEntryJobPayload,
    DelayedJob,
    type DelayedJobPayloads,
    type EntryJobName
} from '../api/delayed-worker/delayed-worker.constants';
import { EntryEmbeddingService } from '../api/entry-embedding/entry-embedding.service';
import { EntryLocationService } from '../api/entry-location/entry-location.service';
import { EntrySlicePreviewService } from '../api/entry-slice-preview/entry-slice-preview.service';
import { EntrySttService } from '../api/entry-stt/entry-stt.service';
import { EntryVisionService } from '../api/entry-vision/entry-vision.service';
import type { ErrorVariables } from '../common/helpers/errors';
import { isJobAbortedError } from '../common/helpers/job-abort';
import { errorTranslations } from '../common/translation/error-translations';
import type { EntryJobExecutionOptions } from '../common/types/entry-job-execution';
import { EntryJobCancelListener } from './entry-job-cancel.listener';
import { EntryProcessingWorkerService } from './entry-processing-worker.service';

@Processor(BullMqQueue.Entry)
export class EntryProcessor extends WorkerHost {
    private readonly logger = new Logger(EntryProcessor.name);

    constructor(
        private readonly entryLocationService: EntryLocationService,
        private readonly entryEmbeddingService: EntryEmbeddingService,
        private readonly entryProcessingWorkerService: EntryProcessingWorkerService,
        private readonly entryVisionService: EntryVisionService,
        private readonly entrySttService: EntrySttService,
        private readonly entrySlicePreviewService: EntrySlicePreviewService,
        private readonly entryJobCancelListener: EntryJobCancelListener
    ) {
        super();
    }

    async process(job: Job): Promise<void> {
        const data = job.data as baseEntryJobPayload;

        const started = await this.entryProcessingWorkerService.tryMarkJobRunning(data.jobId);
        if (!started) {
            this.logger.log(`skip job ${job.name} (${data.jobId}): cancelled or already handled`);
            return;
        }

        const abortController = this.entryJobCancelListener.register(data.jobId);

        try {
            await this.runJob(job, { signal: abortController.signal });
            this.logger.log(`end job ${job.name} for entry`);
            await this.entryProcessingWorkerService.onJobFinished(job.name as EntryJobName, data);
        } catch (error) {
            if (isJobAbortedError(error)) {
                this.logger.warn(`job aborted ${job.name} jobId=${data.jobId}`);
                return;
            }

            const message = this.resolveErrorMessage(error);
            this.logger.error(`Job end with error ${message}`, error instanceof Error ? error.stack : undefined);

            const errorMessages = await this.entryProcessingWorkerService.appendJobError(data.jobId, message);

            if (errorMessages.length < this.entryProcessingWorkerService.maxJobErrorAttempts) {
                await this.entryProcessingWorkerService.requeueJob(
                    job.name as EntryJobName,
                    job.data as DelayedJobPayloads[EntryJobName]
                );
                return;
            }

            await this.entryProcessingWorkerService.markJobFailed(data.jobId);
            throw error;
        } finally {
            this.entryJobCancelListener.unregister(data.jobId);
        }
    }

    private async runJob(job: Job, options: EntryJobExecutionOptions): Promise<void> {
        switch (job.name) {
            case DelayedJob.EntryLocation:
                await this.entryLocationService.processEntryLocation(
                    job.data as DelayedJobPayloads[typeof DelayedJob.EntryLocation],
                    options
                );
                return;
            case DelayedJob.EntryLocationAndPeopleDetect:
                await this.entryLocationService.processEntryLocationAndPeopleDetect(
                    job.data as DelayedJobPayloads[typeof DelayedJob.EntryLocationAndPeopleDetect],
                    options
                );
                return;
            case DelayedJob.EntryEmbedTitle:
                await this.entryEmbeddingService.processEntryEmbedTitle(
                    job.data as DelayedJobPayloads[typeof DelayedJob.EntryEmbedTitle],
                    options
                );
                return;
            case DelayedJob.EntryEmbedText:
                await this.entryEmbeddingService.processEntryEmbedText(
                    job.data as DelayedJobPayloads[typeof DelayedJob.EntryEmbedText],
                    options
                );
                return;
            case DelayedJob.EntryEmbedImage:
                await this.entryEmbeddingService.processEntryEmbedImage(
                    job.data as DelayedJobPayloads[typeof DelayedJob.EntryEmbedImage],
                    options
                );
                return;
            case DelayedJob.EntryVision:
                await this.entryVisionService.processEntryVision(
                    job.data as DelayedJobPayloads[typeof DelayedJob.EntryVision],
                    options
                );
                return;
            case DelayedJob.EntryStt:
                await this.entrySttService.processEntryStt(
                    job.data as DelayedJobPayloads[typeof DelayedJob.EntryStt],
                    options
                );
                return;
            case DelayedJob.EntrySlicePreview:
                await this.entrySlicePreviewService.processEntrySlicePreview(
                    job.data as DelayedJobPayloads[typeof DelayedJob.EntrySlicePreview],
                    options
                );
                return;
            default:
                throw new Error(`Unknown job: ${job.name}`);
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
