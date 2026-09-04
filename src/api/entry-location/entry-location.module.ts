import { Module } from '@nestjs/common';

import { AiModule } from '../ai/ai.module';
import { OpenstreetmapModule } from '../openstreetmap/openstreetmap.module';
import { ServiceSettingsModule } from '../service-settings/service-settings.module';
import { EntryLocationRepository } from './entry-location.repository';
import { EntryLocationService } from './entry-location.service';

@Module({
    imports: [AiModule, OpenstreetmapModule, ServiceSettingsModule],
    providers: [EntryLocationService, EntryLocationRepository],
    exports: [EntryLocationService]
})
export class EntryLocationModule {}
