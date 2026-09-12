import { Module } from '@nestjs/common';

import { PlaceController } from './place.controller';
import { PlaceRepository } from './place.repository';
import { PlaceService } from './place.service';

@Module({
    controllers: [PlaceController],
    providers: [PlaceService, PlaceRepository]
})
export class PlaceModule {}
