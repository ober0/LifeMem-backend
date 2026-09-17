import { Module } from '@nestjs/common';

import { AiModelCoreModule } from '../ai-model/ai-model.core.module';
import { ServiceSettingsRepository } from './service-settings.repository';
import { ServiceSettingsService } from './service-settings.service';

@Module({
    imports: [AiModelCoreModule],
    providers: [ServiceSettingsService, ServiceSettingsRepository],
    exports: [ServiceSettingsService]
})
export class ServiceSettingsCoreModule {}
