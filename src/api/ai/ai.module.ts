import { Module } from '@nestjs/common';

import { AiModelModule } from '../ai-model/ai-model.module';
import { LocalEmbeddingModule } from '../local-embedding/local-embedding.module';
import { ServiceSettingsModule } from '../service-settings/service-settings.module';
import { AiProcessor } from './ai.processor';
import { AiService } from './ai.service';
import { AiResponseStore } from './ai-response.store';
import { AiInvokeService } from './services/ai-invoke.service';
import { AiModelsService } from './services/ai-models.service';
import { AiUsageService } from './services/ai-usage.service';
import { AiToolsRegistry } from './tools/ai-tools.registry';
import { SearchPeopleFactory } from './tools/items/search-people.tool';
import { SearchPlacesFactory } from './tools/items/search-places.tool';
import { UserEntitiesSearchRepository } from './tools/user-entities-search.repository';

@Module({
    imports: [ServiceSettingsModule, AiModelModule, LocalEmbeddingModule],
    providers: [
        AiService,
        AiModelsService,
        AiUsageService,
        AiInvokeService,
        AiProcessor,
        AiResponseStore,
        AiToolsRegistry,
        UserEntitiesSearchRepository,
        SearchPeopleFactory,
        SearchPlacesFactory
    ],
    exports: [AiService]
})
export class AiModule {}
