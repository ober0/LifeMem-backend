import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { s3Config } from '../../common/config/env';
import { S3Service } from './s3.service';

@Module({
    imports: [ConfigModule.forFeature(s3Config)],
    providers: [S3Service],
    exports: [S3Service]
})
export class S3Module {}
