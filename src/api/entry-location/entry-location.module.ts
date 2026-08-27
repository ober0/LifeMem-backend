import { Module } from '@nestjs/common';

import { OpenstreetmapModule } from '../openstreetmap/openstreetmap.module';
import { UserModule } from '../user/user.module';
import { EntryLocationRepository } from './entry-location.repository';
import { EntryLocationService } from './entry-location.service';

@Module({
    imports: [EntryLocationModule, UserModule, OpenstreetmapModule],
    providers: [EntryLocationService, EntryLocationRepository],
    exports: [EntryLocationService]
})
export class EntryLocationModule {}
