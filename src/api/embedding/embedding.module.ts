import { Module } from '@nestjs/common';

import { AiModule } from '../ai/ai.module';
import { AiModelCoreModule } from '../ai-model/ai-model.core.module';
import { LocalEmbeddingModule } from '../local-embedding/local-embedding.module';
import { EmbeddingService } from './embedding.service';

@Module({
    imports: [AiModule, AiModelCoreModule, LocalEmbeddingModule],
    providers: [EmbeddingService],
    exports: [EmbeddingService]
})
export class EmbeddingModule {}
