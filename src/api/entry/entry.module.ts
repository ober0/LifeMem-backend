import { Module } from '@nestjs/common';

import { S3Module } from '../s3/s3.module';
import { EntryController } from './entry.controller';
import { EntryRepository } from './entry.repository';
import { EntryService } from './entry.service';

@Module({
    imports: [S3Module],
    controllers: [EntryController],
    providers: [EntryService, EntryRepository]
})
export class EntryModule {}
