import { Inject, Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import Redis from 'ioredis';

import { appConstants } from '../common/config/app.constants';
import { type RedisConfig, redisConfig } from '../common/config/env';

@Injectable()
export class EntryJobCancelListener implements OnModuleInit, OnModuleDestroy {
    private readonly abortByJobId = new Map<string, AbortController>();
    private subscriber: Redis | null = null;

    constructor(@Inject(redisConfig.KEY) private readonly redisSettings: RedisConfig) {}

    async onModuleInit() {
        // TODO потом вынести отдельно
        this.subscriber = new Redis(this.redisSettings.url, {
            maxRetriesPerRequest: null
        });

        await this.subscriber.psubscribe(appConstants.entryProcessing.jobCancel.channelPattern);

        this.subscriber.on('pmessage', (_pattern, channel) => {
            const jobId = appConstants.entryProcessing.jobCancel.jobIdFromChannel(channel);
            if (!jobId) {
                return;
            }

            this.abortByJobId.get(jobId)?.abort();
        });
    }

    register(jobId: string): AbortController {
        const controller = new AbortController();
        this.abortByJobId.set(jobId, controller);
        return controller;
    }

    unregister(jobId: string) {
        this.abortByJobId.delete(jobId);
    }

    async onModuleDestroy() {
        if (!this.subscriber) {
            return;
        }

        try {
            await this.subscriber.quit();
        } catch {
            this.subscriber.disconnect();
        }

        this.subscriber = null;
    }
}
