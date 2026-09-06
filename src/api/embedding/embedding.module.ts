import { Module } from '@nestjs/common';

import { AiModule } from '../ai/ai.module';
import { AiModelModule } from '../ai-model/ai-model.module';
import { LocalEmbeddingModule } from '../local-embedding/local-embedding.module';
import { EmbeddingService } from './embedding.service';

@Module({
    imports: [AiModule, AiModelModule, LocalEmbeddingModule],
    providers: [EmbeddingService],
    exports: [EmbeddingService]
})
export class EmbeddingModule {}
