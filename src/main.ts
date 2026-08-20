import { ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';

import { AppModule } from './api/app/app.module';
import type { AppConfig } from './common/config/env';
import { initSwagger } from './common/swagger/config';
import { ErrorsTranslateFilter } from './common/translation/errors-translate.filter';
import { ValidationException } from './common/translation/validation-exception';

async function bootstrap() {
    const app = await NestFactory.create<NestExpressApplication>(AppModule);
    const configService = app.get(ConfigService);
    const appConfig = configService.getOrThrow<AppConfig>('app');

    // прокидывание ip
    app.set('trust proxy', true);

    // глобальный префикс
    app.setGlobalPrefix('api', {
        exclude: ['health']
    });

    // парсер куки
    app.use(cookieParser());

    // версионирование url /v1 v2
    app.enableVersioning({
        type: VersioningType.URI,
        defaultVersion: '1'
    });

    // фильтр ошибок
    app.useGlobalFilters(new ErrorsTranslateFilter());

    // валидация
    app.useGlobalPipes(
        new ValidationPipe({
            exceptionFactory: (errors) => {
                return new ValidationException(errors);
            },
            transform: true,
            whitelist: true
        })
    );

    // graceful shutdown
    app.enableShutdownHooks();

    // корсы
    if (!appConfig.isProduction) {
        app.enableCors({
            origin: true,
            credentials: true
        });
    } else {
        app.enableCors({
            origin: ['https://lifemem.com'],
            credentials: true
        });
    }

    // scalar + настройки
    initSwagger(app, appConfig);

    await app.listen(appConfig.port);
}

bootstrap();
