import { ApiProperty } from '@nestjs/swagger';

export enum HealthStatus {
    OK = 'ok',
    ERROR = 'error'
}

export enum HealthServiceName {
    APP = 'app',
    POSTGRES = 'postgres',
    REDIS = 'redis',
    S3 = 's3'
}

export class HealthServiceStatusDto {
    @ApiProperty({ enum: HealthStatus, example: HealthStatus.OK })
    status: HealthStatus;

    @ApiProperty({ enum: HealthServiceName, example: HealthServiceName.POSTGRES })
    service: HealthServiceName;
}
