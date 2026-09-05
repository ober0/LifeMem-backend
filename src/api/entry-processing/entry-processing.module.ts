import { Module } from '@nestjs/common';

import { EntryEmbeddingModule } from '../entry-embedding/entry-embedding.module';
import { EntryLocationModule } from '../entry-location/entry-location.module';
import { EntryProcessor } from './entry.processor';
import { EntryProcessingRepository } from './entry-processing.repository';
import { EntryProcessingService } from './entry-processing.service';

@Module({
    imports: [EntryLocationModule, EntryEmbeddingModule],
    providers: [EntryProcessingService, EntryProcessor, EntryProcessingRepository],
    exports: [EntryProcessingService]
})
export class EntryProcessingModule {}
