import { Module } from '@nestjs/common';

import { DelayedWorkerModule } from '../delayed-worker/delayed-worker.module';
import { EntryProcessingRepository } from './entry-processing.repository';
import { EntryProcessingService } from './entry-processing.service';

@Module({
    imports: [DelayedWorkerModule],
    providers: [EntryProcessingService, EntryProcessingRepository],
    exports: [EntryProcessingService]
})
export class EntryProcessingModule {}
