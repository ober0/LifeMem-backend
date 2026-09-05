import { Module } from '@nestjs/common';

import { AiModule } from '../ai/ai.module';
import { S3Module } from '../s3/s3.module';
import { ServiceSettingsModule } from '../service-settings/service-settings.module';
import { EntryVisionRepository } from './entry-vision.repository';
import { EntryVisionService } from './entry-vision.service';

@Module({
    imports: [AiModule, S3Module, ServiceSettingsModule],
    providers: [EntryVisionService, EntryVisionRepository],
    exports: [EntryVisionService]
})
export class EntryVisionModule {}
