import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';

import { AuthRepository } from '../api/auth/repo/auth.repository';
import { AuthCleanupService } from '../api/auth/services/auth-cleanup.service';
import { PrismaModule } from '../api/prisma/prisma.module';
import { UserRepository } from '../api/user/user.repository';
import { UserCleanupService } from '../api/user/user-cleanup.service';
import { envConfigs, validateEnv } from '../common/config/env';
import { CronWorker } from './cron.worker';
import { DeleteExpiresConfirmCodesJob } from './tasks/delete-expires-confirm-codes';
import { DeleteExpiresJwtJob } from './tasks/delete-expires-jwt';
import { DeleteSoftDeletedUsersJob } from './tasks/delete-soft-deleted-users';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            load: envConfigs,
            validate: validateEnv
        }),
        ScheduleModule.forRoot(),
        PrismaModule
    ],
    providers: [
        CronWorker,
        DeleteExpiresJwtJob,
        DeleteExpiresConfirmCodesJob,
        DeleteSoftDeletedUsersJob,
        UserRepository,
        UserCleanupService,
        AuthCleanupService,
        AuthRepository
    ]
})
export class CronModule {}
