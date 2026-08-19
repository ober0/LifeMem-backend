import { Global,Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

import type { RedisConfig } from '../../common/config/env';
import { REDIS_CLIENT } from './redis.constants';
import { RedisService } from './redis.service';

@Global()
@Module({
    providers: [
        {
            provide: REDIS_CLIENT,
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => {
                const redis = configService.getOrThrow<RedisConfig>('redis');

                return new Redis(redis.url, {
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
