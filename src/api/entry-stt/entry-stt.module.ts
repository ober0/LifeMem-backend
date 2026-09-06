import { Module } from '@nestjs/common';

import { S3Module } from '../s3/s3.module';
import { SttModule } from '../stt/stt.module';
import { EntrySttRepository } from './entry-stt.repository';
import { EntrySttService } from './entry-stt.service';

@Module({
    imports: [S3Module, SttModule],
    providers: [EntrySttService, EntrySttRepository],
    exports: [EntrySttService]
})
export class EntrySttModule {}
