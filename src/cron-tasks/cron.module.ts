import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';

import { AuthCleanupModule } from '../api/auth/auth-cleanup.module';
import { PrismaModule } from '../api/prisma/prisma.module';
import { envConfigs, validateEnv } from '../common/config/env';
import { CronWorker } from './cron.worker';
import { DeleteExpiresConfirmCodesJob } from './tasks/delete-expires-confirm-codes';
import { DeleteExpiresJwtJob } from './tasks/delete-expires-jwt';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            load: envConfigs,
            validate: validateEnv
        }),
        ScheduleModule.forRoot(),
        PrismaModule,
        AuthCleanupModule
    ],
    providers: [CronWorker, DeleteExpiresJwtJob, DeleteExpiresConfirmCodesJob]
})
export class CronModule {}
