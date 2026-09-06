import { Module } from '@nestjs/common';

import { AiModule } from '../ai/ai.module';
import { AiModelModule } from '../ai-model/ai-model.module';
import { EntryEmbeddingRepository } from './entry-embedding.repository';
import { EntryEmbeddingService } from './entry-embedding.service';

@Module({
    imports: [AiModule, AiModelModule],
    providers: [EntryEmbeddingService, EntryEmbeddingRepository],
    exports: [EntryEmbeddingService]
})
export class EntryEmbeddingModule {}
