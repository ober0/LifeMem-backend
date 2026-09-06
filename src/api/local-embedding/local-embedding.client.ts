import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue, QueueEvents } from 'bullmq';

import { appConstants } from '../../common/config/app.constants';
import type { RedisConfig } from '../../common/config/env';
import { apiError } from '../../common/helpers/errors';
import {
    DelayedJob,
    LOCAL_EMBEDDING_QUEUE,
    type LocalEmbedJobPayload,
    type LocalEmbedJobResult,
    type LocalLoadModelJobPayload
} from '../delayed-worker/delayed-worker.constants';

@Injectable()
export class LocalEmbeddingClient implements OnModuleDestroy {
    private readonly queueEvents: QueueEvents;

    constructor(
        @InjectQueue(LOCAL_EMBEDDING_QUEUE) private readonly queue: Queue,
        configService: ConfigService
    ) {
        const redis = configService.getOrThrow<RedisConfig>('redis');
        this.queueEvents = new QueueEvents(LOCAL_EMBEDDING_QUEUE, {
            connection: {
                url: redis.url,
                maxRetriesPerRequest: null
            }
        });
    }

    async onModuleDestroy(): Promise<void> {
        await this.queueEvents.close();
    }

    async embed(payload: LocalEmbedJobPayload): Promise<LocalEmbedJobResult> {
        const job = await this.queue.add(DelayedJob.LocalEmbed, payload, {
            removeOnComplete: 100,
            removeOnFail: 50
        });

        const timeoutMs = appConstants.ai.resultWaitTimeoutSec * 1000;

        try {
            return (await job.waitUntilFinished(this.queueEvents, timeoutMs)) as LocalEmbedJobResult;
        } catch (error) {
            const message = error instanceof Error ? error.message : 'local embed failed';
            throw apiError.internal('ai.request_failed', { error: message });
        }
    }

    async loadModel(payload: LocalLoadModelJobPayload): Promise<void> {
        const job = await this.queue.add(DelayedJob.LocalLoadModel, payload, {
            removeOnComplete: 20,
            removeOnFail: 20
        });

        const timeoutMs = appConstants.ai.resultWaitTimeoutSec * 1000;

        try {
            await job.waitUntilFinished(this.queueEvents, timeoutMs);
        } catch (error) {
            const message = error instanceof Error ? error.message : 'local load model failed';
            throw apiError.internal('ai.request_failed', { error: message });
        }
    }
}
