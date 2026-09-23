import { Module } from '@nestjs/common';

import { AiModule } from '../ai/ai.module';
import { EmbeddingModule } from '../embedding/embedding.module';
import { EntryModule } from '../entry/entry.module';
import { ServiceSettingsCoreModule } from '../service-settings/service-settings.core.module';
import { EntryRagController } from './entry-rag.controller';
import { EntryRagRepository } from './entry-rag.repository';
import { EntryRagService } from './entry-rag.service';
import { SearchEntriesFactory } from './tools/search-entries.tool';

@Module({
    imports: [AiModule, EmbeddingModule, EntryModule, ServiceSettingsCoreModule],
    controllers: [EntryRagController],
    providers: [EntryRagService, EntryRagRepository, SearchEntriesFactory]
})
export class EntryRagModule {}
