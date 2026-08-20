import type { OnModuleDestroy } from '@nestjs/common';
import { Inject, Injectable, Logger } from '@nestjs/common';
import type Redis from 'ioredis';

import { REDIS_CLIENT } from './redis.constants';

@Injectable()
export class RedisService implements OnModuleDestroy {
    private readonly logger = new Logger('RedisService');

    constructor(@Inject(REDIS_CLIENT) private readonly redisClient: Redis) {}

    async onModuleDestroy() {
        try {
            await this.redisClient.quit();
        } catch {
            this.redisClient.disconnect();
        }
    }

    async set<T extends string | number | object>({
        key,
        value,
        ttl
    }: {
        key: string;
        value: T;
        ttl?: number;
    }): Promise<void> {
        let input = String(value);
        if (typeof value === 'object') {
            input = JSON.stringify(value);
        }

        try {
            if (ttl) {
                await this.redisClient.set(key, input, 'EX', ttl);
            } else {
                await this.redisClient.set(key, input);
            }
        } catch (error) {
            this.logger.error(`Ошибка при записи в Redis для ключа: ${key}`, error);
        }
    }

    async get<T extends string | number | object>(key: string): Promise<T | null> {
        try {
            const result = await this.redisClient.get(key);

            if (result === null) {
                return null;
            }

            try {
                return JSON.parse(result) as T;
            } catch {
                return (isNaN(Number(result)) ? result : Number(result)) as T;
            }
        } catch (error) {
            this.logger.error(`Ошибка при получении из Redis для ключа: ${key}`, error);
            return null;
        }
    }

    async del(key: string | string[]) {
        if (typeof key === 'string') {
            await this.redisClient.del(key);
        } else {
            const data: number[] = await Promise.all(key.map(async (item: string) => this.redisClient.del(item)));
            return data;
        }
    }

    async incrementWithTTL(key: string, incrementBy: number = 1, ttl?: number): Promise<number> {
        try {
            const newValue = await this.redisClient.incrby(key, incrementBy);

            if (ttl) {
                await this.redisClient.expire(key, ttl);
            }

            return newValue;
        } catch (error) {
            this.logger.error(`Ошибка при увеличении значения с TTL в Redis для ключа: ${key}`, error);
            throw error;
        }
    }

    async scanKeysByPrefix(prefix: string) {
        let cursor = '0';
        const foundKeys: string[] = [];

        do {
            const [nextCursor, keys] = await this.redisClient.scan(cursor, 'MATCH', prefix, 'COUNT', 100);
            cursor = nextCursor;
            foundKeys.push(...keys);
        } while (cursor !== '0');

        return foundKeys;
    }
}
