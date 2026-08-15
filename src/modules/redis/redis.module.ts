import { Module, Global } from '@nestjs/common';
import Redis from 'ioredis';
import { RedisService } from './redis.service';
import { REDIS_CLIENT } from './redis.constants';

@Global()
@Module({
    providers: [
        {
            provide: REDIS_CLIENT,
            useFactory: () => {
                const redisUrl = process.env.REDIS_URL ?? 'redis://127.0.0.1:6379';

                return new Redis(redisUrl, {
                    maxRetriesPerRequest: 1,
                    connectTimeout: 1000,
                    enableOfflineQueue: false,
                    lazyConnect: true
                });
            }
        },
        RedisService
    ],
    exports: [REDIS_CLIENT, RedisService]
})
export class RedisModule {}
