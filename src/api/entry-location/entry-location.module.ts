import { Module } from '@nestjs/common';

import { AiModule } from '../ai/ai.module';
import { OpenstreetmapModule } from '../openstreetmap/openstreetmap.module';
import { PlaceCoreModule } from '../place/place.core.module';
import { ServiceSettingsCoreModule } from '../service-settings/service-settings.core.module';
import { EntryLocationRepository } from './entry-location.repository';
import { EntryLocationService } from './entry-location.service';

@Module({
    imports: [AiModule, OpenstreetmapModule, ServiceSettingsCoreModule, PlaceCoreModule],
    providers: [EntryLocationService, EntryLocationRepository],
    exports: [EntryLocationService]
})
export class EntryLocationModule {}
