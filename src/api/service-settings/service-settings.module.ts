import { Module } from '@nestjs/common';

import { AiModelModule } from '../ai-model/ai-model.module';
import { ServiceSettingsController } from './service-settings.controller';
import { ServiceSettingsRepository } from './service-settings.repository';
import { ServiceSettingsService } from './service-settings.service';

@Module({
    imports: [AiModelModule],
    controllers: [ServiceSettingsController],
    providers: [ServiceSettingsService, ServiceSettingsRepository],
    exports: [ServiceSettingsService]
})
export class ServiceSettingsModule {}
