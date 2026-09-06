import { BullModule } from '@nestjs/bullmq';
import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type { RedisConfig } from '../../common/config/env';
import {
    AI_QUEUE,
    DELAYED_QUEUE,
    ENTRY_QUEUE,
    LOCAL_EMBEDDING_QUEUE
} from './delayed-worker.constants';
import { DelayedWorkerService } from './delayed-worker.service';

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
                        maxRetriesPerRequest: null
                    }
                };
            }
        }),
        BullModule.registerQueue(
            { name: DELAYED_QUEUE },
            { name: ENTRY_QUEUE },
            { name: AI_QUEUE },
            { name: LOCAL_EMBEDDING_QUEUE }
        )
    ],
    providers: [DelayedWorkerService],
    exports: [DelayedWorkerService, BullModule]
})
export class DelayedWorkerModule {}
