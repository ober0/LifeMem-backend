import { Module } from '@nestjs/common';

import { FfmpegModule } from '../ffmpeg/ffmpeg.module';
import { S3Module } from '../s3/s3.module';
import { EntrySlicePreviewRepository } from './entry-slice-preview.repository';
import { EntrySlicePreviewService } from './entry-slice-preview.service';

@Module({
    imports: [S3Module, FfmpegModule],
    providers: [EntrySlicePreviewService, EntrySlicePreviewRepository],
    exports: [EntrySlicePreviewService]
})
export class EntrySlicePreviewModule {}
