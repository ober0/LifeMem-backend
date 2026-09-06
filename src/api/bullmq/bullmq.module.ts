import { BullModule } from '@nestjs/bullmq';
import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type { RedisConfig } from '../../common/config/env';
import { BULLMQ_QUEUE_NAMES } from './bullmq.constants';
import { BullMqService } from './bullmq.service';

@Global()
@Module({
    imports: [
        BullModule.forRootAsync({
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => {
                const redis = configService.getOrThrow<RedisConfig>('redis');

                return {
                    connection: {
                        url: redis.url,
                        maxRetriesPerRequest: 3
                    }
                };
            }
        }),
        BullModule.registerQueue(...BULLMQ_QUEUE_NAMES.map((name) => ({ name })))
    ],
    providers: [BullMqService],
    exports: [BullMqService, BullModule]
})
export class BullMqModule {}
