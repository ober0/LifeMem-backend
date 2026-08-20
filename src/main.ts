import { ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { apiReference } from '@scalar/nestjs-api-reference';
import cookieParser from 'cookie-parser';
import basicAuth from 'express-basic-auth';

import { AppModule } from './api/app/app.module';
import type { AppConfig } from './common/config/env';
import { ErrorsTranslateFilter } from './common/translation/errors-translate.filter';
import { ValidationException } from './common/translation/validation-exception';

async function bootstrap() {
    const app = await NestFactory.create<NestExpressApplication>(AppModule);
    const configService = app.get(ConfigService);
    const appConfig = configService.getOrThrow<AppConfig>('app');

    app.set('trust proxy', true);
    app.setGlobalPrefix('api', {
        exclude: ['health']
    });
    app.use(cookieParser());

    app.enableVersioning({
        type: VersioningType.URI,
        defaultVersion: '1'
    });

    app.useGlobalFilters(new ErrorsTranslateFilter());

    app.useGlobalPipes(
        new ValidationPipe({
            exceptionFactory: (errors) => {
                return new ValidationException(errors);
            },
            transform: true,
            whitelist: true
        })
    );

    app.enableShutdownHooks();

    if (appConfig.isProduction) {
        app.use(
            ['/docs'],
            basicAuth({
                users: { [appConfig.swaggerUser]: appConfig.swaggerPass },
                challenge: true
            })
        );
    }

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

    const config = new DocumentBuilder()
        .setTitle(`Api документация`)
        .setVersion('0.0.1')
        .addBearerAuth()
        .addGlobalParameters(
            {
                name: 'x-client-type',
                in: 'header',
                required: true,
                description: 'Тип клиента',
                schema: {
                    type: 'string',
                    enum: ['web', 'mobile'],
                    default: 'web'
                }
            },
            {
                name: 'x-accept-language',
                in: 'header',
                required: false,
                description: 'Язык',
                schema: {
                    type: 'string',
                    enum: ['ru', 'en'],
                    default: 'ru'
                }
            }
        )
        .build();

    const document = SwaggerModule.createDocument(app, config);

    app.use(
        '/docs',
        apiReference({
            content: document,
            pageTitle: 'LifeMem API'
        })
    );

    await app.listen(appConfig.port);
}

bootstrap();
