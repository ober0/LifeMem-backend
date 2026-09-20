import { Module } from '@nestjs/common';

import { AiModule } from '../ai/ai.module';
import { FfmpegModule } from '../ffmpeg/ffmpeg.module';
import { S3Module } from '../s3/s3.module';
import { ServiceSettingsCoreModule } from '../service-settings/service-settings.core.module';
import { EntryVisionRepository } from './entry-vision.repository';
import { EntryVisionService } from './entry-vision.service';

@Module({
    imports: [AiModule, S3Module, ServiceSettingsCoreModule, FfmpegModule],
    providers: [EntryVisionService, EntryVisionRepository],
    exports: [EntryVisionService]
})
export class EntryVisionModule {}
