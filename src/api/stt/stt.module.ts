import { Module } from '@nestjs/common';

import { AiModule } from '../ai/ai.module';
import { AiModelCoreModule } from '../ai-model/ai-model.core.module';
import { ServiceSettingsCoreModule } from '../service-settings/service-settings.core.module';
import { SttService } from './stt.service';

@Module({
    imports: [AiModule, AiModelCoreModule, ServiceSettingsCoreModule],
    providers: [SttService],
    exports: [SttService]
})
export class SttModule {}
