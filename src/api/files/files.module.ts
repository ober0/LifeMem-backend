import { Module } from '@nestjs/common';

import { S3Module } from '../s3/s3.module';
import { FilesController } from './files.controller';
import { FilesService } from './files.service';
import { FilesCoreModule } from './files-core.module';

@Module({
    imports: [S3Module, FilesCoreModule],
    providers: [FilesService],
    controllers: [FilesController],
    exports: [FilesService, FilesCoreModule]
})
export class FilesModule {}
