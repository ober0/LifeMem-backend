import { Module } from '@nestjs/common';

import { EmbeddingModule } from '../embedding/embedding.module';
import { EntryProcessingModule } from '../entry-processing/entry-processing.module';
import { S3Module } from '../s3/s3.module';
import { EntrySearchRepository } from './entry-search.repository';
import { EntryController } from './entry.controller';
import { EntryRepository } from './entry.repository';
import { EntryService } from './entry.service';

@Module({
    imports: [S3Module, EntryProcessingModule, EmbeddingModule],
    controllers: [EntryController],
    providers: [EntryService, EntryRepository, EntrySearchRepository]
})
export class EntryModule {}
