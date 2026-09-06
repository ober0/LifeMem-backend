import { Module } from '@nestjs/common';

import { EmbeddingModule } from '../embedding/embedding.module';
import { EntryEmbeddingRepository } from './entry-embedding.repository';
import { EntryEmbeddingService } from './entry-embedding.service';

@Module({
    imports: [EmbeddingModule],
    providers: [EntryEmbeddingService, EntryEmbeddingRepository],
    exports: [EntryEmbeddingService]
})
export class EntryEmbeddingModule {}
