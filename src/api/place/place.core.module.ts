import { Module } from '@nestjs/common';

import { PlaceRepository } from './place.repository';
import { PlaceService } from './place.service';

@Module({
    providers: [PlaceService, PlaceRepository],
    exports: [PlaceService]
})
export class PlaceCoreModule {}
