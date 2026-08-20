import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';

import { AuthRepository } from '../api/auth/repo/auth.repository';
import { PrismaModule } from '../api/prisma/prisma.module';
import { CronWorker } from './cron.worker';
import { DeleteExpiresConfirmCodesJob } from './tasks/delete-expires-confirm-codes';
import { DeleteExpiresJwtJob } from './tasks/delete-expires-jwt';

@Module({
    imports: [
        // ConfigModule.forRoot({
        //     isGlobal: true,
        //     load: envConfigs,
        //     validate: validateEnv
        // }),
        ScheduleModule.forRoot(),
        PrismaModule
    ],
    providers: [CronWorker, DeleteExpiresJwtJob, DeleteExpiresConfirmCodesJob, AuthRepository]
})
export class CronModule {}
