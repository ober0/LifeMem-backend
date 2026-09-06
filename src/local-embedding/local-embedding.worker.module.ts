import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { BullMqQueue } from '../api/bullmq/bullmq.constants';
import type { RedisConfig } from '../common/config/env';
import { envConfigs, validateEnv } from '../common/config/env';
import { LocalEmbeddingProcessor } from './local-embedding.processor';
import { LocalEmbeddingRuntimeService } from './local-embedding.runtime.service';
import { LocalEmbeddingSyncService } from './local-embedding.sync.service';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            load: envConfigs,
            validate: validateEnv
        }),
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
        BullModule.registerQueue({ name: BullMqQueue.LocalEmbedding })
    ],
    providers: [LocalEmbeddingRuntimeService, LocalEmbeddingSyncService, LocalEmbeddingProcessor]
})
export class LocalEmbeddingWorkerModule {}
