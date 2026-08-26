import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import type { Job } from 'bullmq';

import {
    type baseEntryJobPayload,
    DelayedJob,
    type DelayedJobName,
    type DelayedJobPayloads,
    ENTRY_QUEUE
} from '../delayed-worker/delayed-worker.constants';
import { EntryLocationService } from '../entry-location/entry-location.service';
import { EntryProcessingService } from './entry-processing.service';

@Processor(ENTRY_QUEUE)
export class EntryProcessor extends WorkerHost {
    private readonly logger = new Logger(EntryProcessor.name);

    constructor(
        private readonly entryLocationService: EntryLocationService,
        private readonly entryProcessingService: EntryProcessingService
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
                default:
                    this.logger.warn(`Unknown delayed job: ${job.name}`);
                    await this.entryProcessingService.markJobFailed(data.jobId, `Unknown job: ${job.name}`);
                    return;
            }

            this.logger.log(`end job ${job.name} for entry`);
            await this.entryProcessingService.onJobFinished(job.name as DelayedJobName, data);
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';

            await this.entryProcessingService.markJobFailed(data.jobId, message);
            throw error;
        }
    }
}
