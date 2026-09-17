import { Injectable, Logger } from '@nestjs/common';
import { UploadStatus } from '@prisma/client';

import { appConstants } from '../../common/config/app.constants';
import { S3Service } from '../s3/s3.service';
import { FilesRepository } from './files.repository';

@Injectable()
export class FilesUploadCleanupService {
    private readonly logger = new Logger(FilesUploadCleanupService.name);

    constructor(
        private readonly filesRepository: FilesRepository,
        private readonly s3: S3Service
    ) {}

    async expireStaleUploads(): Promise<number> {
        const olderThan = new Date(Date.now() - appConstants.files.orphanedUploadMaxAgeMs);
        const processes = await this.filesRepository.findExpiredProcesses(olderThan);
        let expired = 0;

        for (const process of processes) {
            try {
                if (process.isMultipart && process.multipartUploadId) {
                    await this.s3.abortMultipartUpload({
                        key: process.key,
                        uploadId: process.multipartUploadId
                    });
                } else if (!process.isMultipart && (await this.s3.objectExists(process.key))) {
                    await this.s3.deleteObject(process.key);
                }

                await this.filesRepository.updateStatus(process.id, UploadStatus.EXPIRED);
                expired += 1;
            } catch (error) {
                this.logger.error(`Failed to expire upload process ${process.id}`, error);
            }
        }

        return expired;
    }
}
