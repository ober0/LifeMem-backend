import { Module } from '@nestjs/common';

import { AiModule } from '../ai/ai.module';
import { ServiceSettingsModule } from '../service-settings/service-settings.module';
import { EntryEmbeddingRepository } from './entry-embedding.repository';
import { EntryEmbeddingService } from './entry-embedding.service';

@Module({
    imports: [AiModule, ServiceSettingsModule],
    providers: [EntryEmbeddingService, EntryEmbeddingRepository],
    exports: [EntryEmbeddingService]
})
export class EntryEmbeddingModule {}
