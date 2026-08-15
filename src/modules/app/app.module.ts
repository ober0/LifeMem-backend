import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { TranslateFilter } from '../../common/translation/translate.filter';
import { LoggerMiddleware } from '../../common/middlewares/logger.middleware';
import { PrismaModule } from '../prisma/prisma.module';
import { RedisModule } from '../redis/redis.module';
import { SmtpModule } from '../smtp/smtp.module';
import { S3Module } from '../s3/s3.module';
import { HealthModule } from '../health/health.module';

@Module({
    imports: [ScheduleModule.forRoot(), PrismaModule, RedisModule, SmtpModule, S3Module, HealthModule],
    providers: [
        {
            provide: APP_FILTER,
            useClass: TranslateFilter
        }
    ]
})
export class AppModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer.apply(LoggerMiddleware).forRoutes('*path');
    }
}
