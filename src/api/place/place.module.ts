import { Module } from '@nestjs/common';

import { PlaceController } from './place.controller';
import { PlaceCoreModule } from './place.core.module';

@Module({
    imports: [PlaceCoreModule],
    controllers: [PlaceController],
    exports: [PlaceCoreModule]
})
export class PlaceModule {}
