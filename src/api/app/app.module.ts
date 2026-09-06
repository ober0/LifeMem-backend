import { ThrottlerStorageRedisService } from '@nest-lab/throttler-storage-redis';
import type { MiddlewareConsumer, NestModule } from '@nestjs/common';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule } from '@nestjs/throttler';
import Redis from 'ioredis';

import { ActorMiddleware } from '../../common/classes/actor';
import { ServerSettingsMiddleware } from '../../common/classes/server-settings';
import { appConstants } from '../../common/config/app.constants';
import { envConfigs, validateEnv } from '../../common/config/env';
import {
    AppThrottlerGuard,
    getIpTracker,
    getUserTracker,
    shouldSkipIpThrottler,
    shouldSkipUserThrottler,
    THROTTLER_NAME_IP,
    THROTTLER_NAME_USER
} from '../../common/guards/app-throttler.guard';
import { LoggerMiddleware } from '../../common/middleware/logger.middleware';
import { AiModule } from '../ai/ai.module';
import { AiModelModule } from '../ai-model/ai-model.module';
import { AuthModule } from '../auth/auth.module';
import { AuthLogModule } from '../auth-log/auth-log.module';
import { CacheModule } from '../cache/cache.module';
import { DelayedWorkerModule } from '../delayed-worker/delayed-worker.module';
import { EntryModule } from '../entry/entry.module';
import { EntryLocationModule } from '../entry-location/entry-location.module';
import { EntrySttModule } from '../entry-stt/entry-stt.module';
import { EntryVisionModule } from '../entry-vision/entry-vision.module';
import { HealthModule } from '../health/health.module';
import { LogsModule } from '../logs/logs.module';
import { MobileSmsModule } from '../mobile-sms/mobile-sms.module';
import { OpenstreetmapModule } from '../openstreetmap/openstreetmap.module';
import { PrismaModule } from '../prisma/prisma.module';
import { REDIS_CLIENT } from '../redis/redis.constants';
import { RedisModule } from '../redis/redis.module';
import { RoleModule } from '../role/role.module';
import { S3Module } from '../s3/s3.module';
import { ServiceSettingsModule } from '../service-settings/service-settings.module';
import { SmtpModule } from '../smtp/smtp.module';
import { UserModule } from '../user/user.module';
import { UserSettingsModule } from '../user-settings/user-settings.module';

@Module({
    imports: [
        ThrottlerModule.forRootAsync({
            imports: [RedisModule],
            inject: [REDIS_CLIENT],
            useFactory: (redisClient: Redis) => ({
                storage: new ThrottlerStorageRedisService(redisClient),
                throttlers: [
                    {
                        name: THROTTLER_NAME_IP,
                        ttl: appConstants.throttle.ip.ttlMs,
                        limit: appConstants.throttle.ip.limit,
                        skipIf: shouldSkipIpThrottler,
                        getTracker: (req) => getIpTracker(req as never)
                    },
                    {
                        name: THROTTLER_NAME_USER,
                        ttl: appConstants.throttle.user.ttlMs,
                        limit: appConstants.throttle.user.limit,
                        skipIf: shouldSkipUserThrottler,
                        getTracker: (req) => getUserTracker(req as never)
                    }
                ]
            })
        }),
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
        AiModelModule,
        AiModule,
        MobileSmsModule,
        CacheModule,
        EntryModule,
        DelayedWorkerModule,
        EntryLocationModule,
        OpenstreetmapModule,
        EntryVisionModule,
        EntrySttModule
    ],
    providers: [
        {
            provide: APP_GUARD,
            useClass: AppThrottlerGuard
        }
    ]
})
export class AppModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer.apply(ActorMiddleware, ServerSettingsMiddleware, LoggerMiddleware).forRoutes('*path');
    }
}
