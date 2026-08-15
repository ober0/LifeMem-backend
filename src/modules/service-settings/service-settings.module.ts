import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ServiceSettingsController } from './service-settings.controller';
import { ServiceSettingsRepository } from './service-settings.repository';
import { ServiceSettingsService } from './service-settings.service';

@Module({
    imports: [AuthModule],
    controllers: [ServiceSettingsController],
    providers: [ServiceSettingsService, ServiceSettingsRepository],
    exports: [ServiceSettingsService]
})
export class ServiceSettingsModule {}
