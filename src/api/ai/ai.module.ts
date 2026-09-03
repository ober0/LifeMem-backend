import { Module } from '@nestjs/common';

import { AiModelModule } from '../ai-model/ai-model.module';
import { ServiceSettingsModule } from '../service-settings/service-settings.module';
import { AiProcessor } from './ai.processor';
import { AiService } from './ai.service';
import { AiResponseStore } from './ai-response.store';
import { AiToolsRegistry } from './tools/ai-tools.registry';
import { TestFactory } from './tools/items/test.tool';

@Module({
    imports: [ServiceSettingsModule, AiModelModule],
    providers: [AiService, AiProcessor, AiResponseStore, AiToolsRegistry, TestFactory],
    exports: [AiService]
})
export class AiModule {}
