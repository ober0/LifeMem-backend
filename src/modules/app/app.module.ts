import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ActorMiddleware } from '../../common/classes/actor';
import { LoggerMiddleware } from '../../common/middlewares/logger.middleware';
import { ServerSettingsMiddleware } from '../../common/classes/server-settings';
import { AuthModule } from '../auth/auth.module';
import { HealthModule } from '../health/health.module';
import { PrismaModule } from '../prisma/prisma.module';
import { RedisModule } from '../redis/redis.module';
import { S3Module } from '../s3/s3.module';
import { ServiceSettingsModule } from '../service-settings/service-settings.module';
import { SmtpModule } from '../smtp/smtp.module';
import { UserModule } from '../user/user.module';
import { UserSettingsModule } from '../user-settings/user-settings.module';
import { RoleModule } from '../role/role.module';
import { LogsModule } from '../logs/logs.module';
import { AuthLogModule } from '../auth-log/auth-log.module';
import { MobileSmsModule } from '../mobile-sms/mobile-sms.module';

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
