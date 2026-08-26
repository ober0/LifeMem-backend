import { Module } from '@nestjs/common';

import { EntryLocationModule } from '../entry-location/entry-location.module';
import { EntryProcessor } from './entry.processor';
import { EntryProcessingRepository } from './entry-processing.repository';
import { EntryProcessingService } from './entry-processing.service';

@Module({
    imports: [EntryLocationModule],
    providers: [EntryProcessingService, EntryProcessor, EntryProcessingRepository],
    exports: [EntryProcessingService]
})
export class EntryProcessingModule {}
