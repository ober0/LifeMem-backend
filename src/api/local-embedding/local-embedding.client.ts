import { Injectable } from '@nestjs/common';

import { appConstants } from '../../common/config/app.constants';
import { apiError } from '../../common/helpers/errors';
import { BullMqQueue } from '../bullmq/bullmq.constants';
import { BullMqService } from '../bullmq/bullmq.service';
import {
    DelayedJob,
    type LocalEmbedJobPayload,
    type LocalEmbedJobResult,
    type LocalLoadModelJobPayload
} from '../delayed-worker/delayed-worker.constants';

@Injectable()
export class LocalEmbeddingClient {
    constructor(private readonly bullMq: BullMqService) {}

    async embed(payload: LocalEmbedJobPayload): Promise<LocalEmbedJobResult> {
        const timeoutMs = appConstants.ai.resultWaitTimeoutSec * 1000;

        try {
            return await this.bullMq.addAndWait<LocalEmbedJobResult>(
                BullMqQueue.LocalEmbedding,
                DelayedJob.LocalEmbed,
                payload,
                timeoutMs,
                {
                    // TODO: kind === 'query' priority 1, 'passage' 10 (BullMQ JobsOptions.priority)
                    removeOnComplete: 100,
                    removeOnFail: 50
                }
            );
        } catch (error) {
            const message = error instanceof Error ? error.message : 'local embed failed';
            throw apiError.internal('ai.request_failed', { error: message });
        }
    }

    async loadModel(payload: LocalLoadModelJobPayload): Promise<void> {
        const timeoutMs = appConstants.ai.resultWaitTimeoutSec * 1000;

        try {
            await this.bullMq.addAndWait(BullMqQueue.LocalEmbedding, DelayedJob.LocalLoadModel, payload, timeoutMs, {
                removeOnComplete: 20,
                removeOnFail: 20
            });
        } catch (error) {
            const message = error instanceof Error ? error.message : 'local load model failed';
            throw apiError.internal('ai.request_failed', { error: message });
        }
    }
}
