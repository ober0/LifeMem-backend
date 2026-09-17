import { Module } from '@nestjs/common';

import { S3Module } from '../s3/s3.module';
import { FilesRepository } from './files.repository';
import { FilesUploadCleanupService } from './files-upload-cleanup.service';

@Module({
    imports: [S3Module],
    providers: [FilesRepository, FilesUploadCleanupService],
    exports: [FilesRepository, FilesUploadCleanupService]
})
export class FilesCoreModule {}
