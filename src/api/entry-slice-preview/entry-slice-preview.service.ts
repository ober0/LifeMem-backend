import { randomUUID } from 'node:crypto';

import { Injectable, Logger } from '@nestjs/common';
import { FileType } from '@prisma/client';

import { assertNotAborted } from '../../common/helpers/job-abort';
import type { EntryJobExecutionOptions } from '../../common/types/entry-job-execution';
import { DelayedJob, type DelayedJobPayloads } from '../delayed-worker/delayed-worker.constants';
import { FfmpegService } from '../ffmpeg/ffmpeg.service';
import { S3Service } from '../s3/s3.service';
import { EntrySlicePreviewRepository } from './entry-slice-preview.repository';

const FIRST_FRAME_MIME = 'image/jpeg';
const FIRST_FRAME_FILENAME = 'first-frame.jpg';

@Injectable()
export class EntrySlicePreviewService {
    private readonly logger = new Logger(EntrySlicePreviewService.name);

    constructor(
        private readonly repository: EntrySlicePreviewRepository,
        private readonly ffmpeg: FfmpegService,
        private readonly s3: S3Service
    ) {}

    async processEntrySlicePreview(
        data: DelayedJobPayloads[typeof DelayedJob.EntrySlicePreview],
        options?: EntryJobExecutionOptions
    ) {
        assertNotAborted(options?.signal);

        const videos = await this.repository.getVideoMedia(data.entryId, data.entryVideoIds);

        if (videos.length === 0) {
            this.logger.warn(`skip slice preview: no videos entryId=${data.entryId}`);
            return true;
        }

        for (const video of videos) {
            assertNotAborted(options?.signal);

            const videoBuffer = await this.s3.getObjectBuffer(video.file.key).catch(() => null);

            if (!videoBuffer) {
                this.logger.warn(`skip slice preview: s3 miss mediaId=${video.id}`);
                continue;
            }

            assertNotAborted(options?.signal);

            const frame = await this.ffmpeg.extractFirstFrame(videoBuffer);

            assertNotAborted(options?.signal);

            const key = `user/${data.userId}/files/${FileType.IMAGE.toLowerCase()}/${randomUUID()}`;

            await this.s3.upload({
                key,
                body: frame,
                contentType: FIRST_FRAME_MIME
            });

            assertNotAborted(options?.signal);

            await this.repository.saveFirstFrame({
                mediaId: video.id,
                userId: data.userId,
                key,
                size: frame.length,
                mimeType: FIRST_FRAME_MIME,
                filename: FIRST_FRAME_FILENAME
            });
        }

        return true;
    }
}
