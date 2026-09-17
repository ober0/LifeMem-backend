import { Injectable, Logger } from '@nestjs/common';

import { FilesUploadCleanupService } from '../../api/files/files-upload-cleanup.service';
import type { ICronTask } from '../interfaces/task.interface';

@Injectable()
export class ExpireStaleUploadsJob implements ICronTask {
    private readonly logger = new Logger(ExpireStaleUploadsJob.name);

    constructor(private readonly filesUploadCleanup: FilesUploadCleanupService) {}

    async execute(): Promise<void> {
        const expired = await this.filesUploadCleanup.expireStaleUploads();
        this.logger.log(`Expired stale upload processes: ${expired}`);
    }
}
