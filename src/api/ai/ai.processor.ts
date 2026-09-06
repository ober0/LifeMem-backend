import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import type { Job } from 'bullmq';

import { BullMqQueue } from '../bullmq/bullmq.constants';
import { DelayedJob } from '../delayed-worker/delayed-worker.constants';
import { AiService } from './ai.service';

@Processor(BullMqQueue.Ai)
export class AiProcessor extends WorkerHost {
    private readonly logger = new Logger(AiProcessor.name);

    constructor(private readonly aiService: AiService) {
        super();
    }

    async process(job: Job): Promise<void> {
        switch (job.name) {
            case DelayedJob.AiRefreshModels:
                await this.aiService.refreshModels();
                this.logger.log('ai models refreshed');
                break;
            case DelayedJob.AiAddModels:
                await this.aiService.addModels();
                this.logger.log('ai models added');
                break;
            default:
                this.logger.warn(`Unknown job: ${job.name}`);
        }
    }
}
