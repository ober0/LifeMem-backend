import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import type { Job } from 'bullmq';

import {
    DelayedJob,
    type DelayedJobPayloads,
    LOCAL_EMBEDDING_QUEUE,
    type LocalEmbedJobResult
} from '../api/delayed-worker/delayed-worker.constants';
import { LocalEmbeddingRuntimeService } from './local-embedding.runtime.service';

@Processor(LOCAL_EMBEDDING_QUEUE)
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
