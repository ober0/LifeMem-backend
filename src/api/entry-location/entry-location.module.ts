import { Module } from '@nestjs/common';

import { EntryLocationService } from './entry-location.service';

@Module({
    providers: [EntryLocationService],
    exports: [EntryLocationService]
})
export class EntryLocationModule {}
