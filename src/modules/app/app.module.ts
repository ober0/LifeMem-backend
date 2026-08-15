import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { ActorMiddleware } from '../../common/actor';
import { LoggerMiddleware } from '../../common/middlewares/logger.middleware';
import { ServerSettingsMiddleware } from '../../common/server-settings';
import { TranslateFilter } from '../../common/translation/translate.filter';
import { AuthModule } from '../auth/auth.module';
import { HealthModule } from '../health/health.module';
import { PrismaModule } from '../prisma/prisma.module';
import { RedisModule } from '../redis/redis.module';
import { S3Module } from '../s3/s3.module';
import { ServiceSettingsModule } from '../service-settings/service-settings.module';
import { SmtpModule } from '../smtp/smtp.module';
import { UserModule } from '../user/user.module';
import { UserSettingsModule } from '../user-settings/user-settings.module';

@Module({
    imports: [
        ScheduleModule.forRoot(),
        PrismaModule,
        RedisModule,
        SmtpModule,
        S3Module,
        HealthModule,
        UserModule,
        AuthModule,
        UserSettingsModule,
        ServiceSettingsModule
    ],
    providers: [
        {
            provide: APP_FILTER,
            useClass: TranslateFilter
        }
    ]
})
export class AppModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer.apply(ActorMiddleware, ServerSettingsMiddleware, LoggerMiddleware).forRoutes('*path');
    }
}
