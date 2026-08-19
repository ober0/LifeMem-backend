import type { MiddlewareConsumer, NestModule } from '@nestjs/common';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';

import { ActorMiddleware } from '../../common/classes/actor';
import { ServerSettingsMiddleware } from '../../common/classes/server-settings';
import { envConfigs, validateEnv } from '../../common/config/env';
import { LoggerMiddleware } from '../../common/middleware/logger.middleware';
import { AuthModule } from '../auth/auth.module';
import { AuthLogModule } from '../auth-log/auth-log.module';
import { HealthModule } from '../health/health.module';
import { LogsModule } from '../logs/logs.module';
import { MobileSmsModule } from '../mobile-sms/mobile-sms.module';
import { PrismaModule } from '../prisma/prisma.module';
import { RedisModule } from '../redis/redis.module';
import { RoleModule } from '../role/role.module';
import { S3Module } from '../s3/s3.module';
import { ServiceSettingsModule } from '../service-settings/service-settings.module';
import { SmtpModule } from '../smtp/smtp.module';
import { UserModule } from '../user/user.module';
import { UserSettingsModule } from '../user-settings/user-settings.module';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            load: envConfigs,
            validate: validateEnv
        }),
        ScheduleModule.forRoot(),
        PrismaModule,
        RedisModule,
        SmtpModule,
        S3Module,
        HealthModule,
        UserModule,
        AuthModule,
        UserSettingsModule,
        ServiceSettingsModule,
        RoleModule,
        LogsModule,
        AuthLogModule,
        MobileSmsModule
    ]
})
export class AppModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer.apply(ActorMiddleware, ServerSettingsMiddleware, LoggerMiddleware).forRoutes('*path');
    }
}
