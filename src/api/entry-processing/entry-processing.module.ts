import { Module } from '@nestjs/common';

import { DelayedWorkerModule } from '../delayed-worker/delayed-worker.module';
import { RedisModule } from '../redis/redis.module';
import { EntryProcessingRepository } from './entry-processing.repository';
import { EntryProcessingService } from './entry-processing.service';

@Module({
    imports: [DelayedWorkerModule, RedisModule],
    providers: [EntryProcessingService, EntryProcessingRepository],
    exports: [EntryProcessingService]
})
export class EntryProcessingModule {}
