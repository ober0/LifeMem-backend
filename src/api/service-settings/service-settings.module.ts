import { Module } from '@nestjs/common';

import { ServiceSettingsController } from './service-settings.controller';
import { ServiceSettingsCoreModule } from './service-settings.core.module';

@Module({
    imports: [ServiceSettingsCoreModule],
    controllers: [ServiceSettingsController],
    exports: [ServiceSettingsCoreModule]
})
export class ServiceSettingsModule {}
