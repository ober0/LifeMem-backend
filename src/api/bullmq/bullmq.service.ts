import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { type JobsOptions, Queue, QueueEvents } from 'bullmq';

import type { RedisConfig } from '../../common/config/env';
import { BULLMQ_QUEUE_NAMES,BullMqQueue, type BullMqQueueName } from './bullmq.constants';

@Injectable()
export class BullMqService implements OnModuleDestroy {
    private readonly queues: Record<BullMqQueueName, Queue>;
    private readonly queueEvents = new Map<BullMqQueueName, QueueEvents>();

    constructor(
        @InjectQueue(BullMqQueue.Delayed) delayedQueue: Queue,
        @InjectQueue(BullMqQueue.Entry) entryQueue: Queue,
        @InjectQueue(BullMqQueue.Ai) aiQueue: Queue,
        @InjectQueue(BullMqQueue.LocalEmbedding) localEmbeddingQueue: Queue,
        configService: ConfigService
    ) {
        this.queues = {
            [BullMqQueue.Delayed]: delayedQueue,
            [BullMqQueue.Entry]: entryQueue,
            [BullMqQueue.Ai]: aiQueue,
            [BullMqQueue.LocalEmbedding]: localEmbeddingQueue
        };

        const redis = configService.getOrThrow<RedisConfig>('redis');
        const connection = {
            url: redis.url,
            maxRetriesPerRequest: null
        };

        for (const name of BULLMQ_QUEUE_NAMES) {
            this.queueEvents.set(name, new QueueEvents(name, { connection }));
        }
    }

    async onModuleDestroy(): Promise<void> {
        await Promise.all([...this.queueEvents.values()].map((events) => events.close()));
    }

    async add(queue: BullMqQueueName, name: string, data: unknown, opts?: JobsOptions) {
        return this.queues[queue].add(name, data, opts);
    }

    async addAndWait<T>(
        queue: BullMqQueueName,
        name: string,
        data: unknown,
        timeoutMs: number,
        opts?: JobsOptions
    ): Promise<T> {
        const job = await this.add(queue, name, data, opts);
        const events = this.queueEvents.get(queue);
        if (!events) {
            throw new Error(`QueueEvents missing for ${queue}`);
        }

        return (await job.waitUntilFinished(events, timeoutMs)) as T;
    }
}
