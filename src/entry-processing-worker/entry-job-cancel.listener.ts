import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import Redis from 'ioredis';

import { entryJobCancelConstants } from '../common/config/constants/entry-processing.constants';
import { type RedisConfig, redisConfig } from '../common/config/env';

@Injectable()
export class EntryJobCancelListener implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(EntryJobCancelListener.name);
    private readonly abortByJobId = new Map<string, AbortController>();
    private subscriber: Redis | null = null;

    constructor(@Inject(redisConfig.KEY) private readonly redisSettings: RedisConfig) {}

    async onModuleInit() {
        // TODO потом вынести отдельно
        this.subscriber = new Redis(this.redisSettings.url, {
            maxRetriesPerRequest: null
        });

        await this.subscriber.psubscribe(`${entryJobCancelConstants.channelPrefix}:*`);

        this.subscriber.on('pmessage', (_pattern, channel) => {
            const jobId = this.jobIdFromChannel(channel);
            if (!jobId) {
                return;
            }

            this.abortByJobId.get(jobId)?.abort();
        });
    }

    private jobIdFromChannel(channel: string): string | null {
        const prefix = `${entryJobCancelConstants.channelPrefix}:`;
        if (!channel.startsWith(prefix)) {
            return null;
        }

        const jobId = channel.slice(prefix.length);
        return jobId.length > 0 ? jobId : null;
    }

    register(jobId: string): AbortSignal {
        const controller = new AbortController();
        this.abortByJobId.set(jobId, controller);
        return controller.signal;
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
