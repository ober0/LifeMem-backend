import { Injectable } from '@nestjs/common';

import type { CacheConfig, CacheKey, CacheTypes } from '../../common/config/constants/cache.constants';
import { DelayedWorkerService } from '../delayed-worker/delayed-worker.service';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class CacheService {
    constructor(
        private readonly redis: RedisService,
        private readonly delayedWorker: DelayedWorkerService
    ) {}

    async setInCache<K extends CacheKey>(config: CacheConfig, value: CacheTypes[K]): Promise<void> {
        await this.redis.set<CacheTypes[K]>({
            key: config.key,
            value,
            ttl: config.ttl ? Math.ceil(config.ttl / 1000) : undefined
        });
    }

    async getFromCache<K extends CacheKey>(config: CacheConfig): Promise<CacheTypes[K] | null> {
        return this.redis.get<CacheTypes[K]>(config.key);
    }

    async getOrSet<K extends CacheKey>(
        config: CacheConfig,
        factory: () => Promise<CacheTypes[K] | null> | CacheTypes[K] | null
    ): Promise<CacheTypes[K] | null> {
        const cached = await this.getFromCache<K>(config);
        if (cached !== null) {
            return cached;
        }

        const value = await factory();

        if (!value) {
            return null;
        }

        this.delayedWorker.setImmediate(() => this.setInCache<K>(config, value));

        return value;
    }

    async invalidateCache(config: CacheConfig | CacheConfig[]): Promise<void> {
        const keys = Array.isArray(config) ? config.map((item) => item.key) : config.key;
        await this.redis.del(keys);
    }

    async invalidateByPattern(pattern: string): Promise<number> {
        const keys = await this.redis.scanKeysByPrefix(pattern);
        if (keys.length === 0) {
            return 0;
        }
        await this.redis.del(keys);
        return keys.length;
    }
}
