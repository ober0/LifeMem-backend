import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { BullMqModule } from '../api/bullmq/bullmq.module';
import { CacheModule } from '../api/cache/cache.module';
import { DelayedWorkerModule } from '../api/delayed-worker/delayed-worker.module';
import { EntryEmbeddingModule } from '../api/entry-embedding/entry-embedding.module';
import { EntryLocationModule } from '../api/entry-location/entry-location.module';
import { EntrySlicePreviewModule } from '../api/entry-slice-preview/entry-slice-preview.module';
import { EntrySttModule } from '../api/entry-stt/entry-stt.module';
import { EntryVisionModule } from '../api/entry-vision/entry-vision.module';
import { PrismaModule } from '../api/prisma/prisma.module';
import { S3Module } from '../api/s3/s3.module';
import { envConfigs, validateEnv } from '../common/config/env';
import { EntryProcessor } from './entry.processor';
import { EntryJobCancelListener } from './entry-job-cancel.listener';
import { EntryProcessingWorkerRepository } from './entry-processing-worker.repository';
import { EntryProcessingWorkerService } from './entry-processing-worker.service';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            load: envConfigs,
            validate: validateEnv
        }),
        PrismaModule,
        CacheModule,
        BullMqModule,
        DelayedWorkerModule,
        S3Module,
        EntryLocationModule,
        EntryEmbeddingModule,
        EntryVisionModule,
        EntrySttModule,
        EntrySlicePreviewModule
    ],
    providers: [
        EntryProcessingWorkerRepository,
        EntryProcessingWorkerService,
        EntryJobCancelListener,
        EntryProcessor
    ]
})
export class EntryProcessingWorkerModule {}
