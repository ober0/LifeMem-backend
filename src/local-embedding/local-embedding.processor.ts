import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import type { Job } from 'bullmq';

import { BullMqQueue } from '../api/bullmq/bullmq.constants';
import {
    DelayedJob,
    type DelayedJobPayloads,
    type LocalEmbedJobResult
} from '../api/delayed-worker/delayed-worker.constants';
import { LocalEmbeddingRuntimeService } from './local-embedding.runtime.service';

@Processor(BullMqQueue.LocalEmbedding)
export class LocalEmbeddingProcessor extends WorkerHost {
    private readonly logger = new Logger(LocalEmbeddingProcessor.name);

    constructor(private readonly runtime: LocalEmbeddingRuntimeService) {
        super();
    }

    async process(job: Job): Promise<LocalEmbedJobResult | void> {
        switch (job.name) {
            case DelayedJob.LocalEmbed: {
                const data = job.data as DelayedJobPayloads[typeof DelayedJob.LocalEmbed];
                return this.runtime.embed(data);
            }
            case DelayedJob.LocalLoadModel: {
                const data = job.data as DelayedJobPayloads[typeof DelayedJob.LocalLoadModel];
                await this.runtime.loadModel(data.modelName);
                return;
            }
            default:
                this.logger.warn(`Unknown local-embedding job: ${job.name}`);
        }
    }
}
