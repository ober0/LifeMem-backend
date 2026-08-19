import { Module } from '@nestjs/common';

import { S3Module } from '../s3/s3.module';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';

@Module({
    imports: [S3Module],
    controllers: [HealthController],
    providers: [HealthService]
})
export class HealthModule {}
