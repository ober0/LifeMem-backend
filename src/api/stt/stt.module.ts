import { Module } from '@nestjs/common';

import { AiModule } from '../ai/ai.module';
import { AiModelModule } from '../ai-model/ai-model.module';
import { ServiceSettingsModule } from '../service-settings/service-settings.module';
import { SttService } from './stt.service';

@Module({
    imports: [AiModule, AiModelModule, ServiceSettingsModule],
    providers: [SttService],
    exports: [SttService]
})
export class SttModule {}
