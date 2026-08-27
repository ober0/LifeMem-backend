import { Module } from '@nestjs/common';

import { OpenstreetmapService } from './openstreetmap.service';

@Module({
    providers: [OpenstreetmapService],
    exports: [OpenstreetmapService]
})
export class OpenstreetmapModule {}
