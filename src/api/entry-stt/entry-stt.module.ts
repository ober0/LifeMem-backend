import { Module } from '@nestjs/common';

import { AiModule } from '../ai/ai.module';
import { S3Module } from '../s3/s3.module';
import { ServiceSettingsModule } from '../service-settings/service-settings.module';
import { EntrySttRepository } from './entry-stt.repository';
import { EntrySttService } from './entry-stt.service';

@Module({
    imports: [AiModule, S3Module, ServiceSettingsModule],
    providers: [EntrySttService, EntrySttRepository],
    exports: [EntrySttService]
})
export class EntrySttModule {}
