import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { apiReference } from '@scalar/nestjs-api-reference';
import cookieParser from 'cookie-parser';
import basicAuth from 'express-basic-auth';
import { AppModule } from './modules/app/app.module';

async function bootstrap() {
    const app = await NestFactory.create<NestExpressApplication>(AppModule);

    app.set('trust proxy', true);
    app.setGlobalPrefix('api', {
        exclude: ['health']
    });
    app.use(cookieParser());

    app.enableVersioning({
        type: VersioningType.URI,
        defaultVersion: '1'
    });

    app.useGlobalPipes(
        new ValidationPipe({
            transform: true,
            whitelist: true
        })
    );

    app.enableShutdownHooks();

    if (process.env.NODE_ENV === 'production') {
        app.use(
            ['/docs'],
            basicAuth({
                users: { [process.env.SWAGGER_USER!]: process.env.SWAGGER_PASS! },
                challenge: true
            })
        );
    }

    if (process.env.NODE_ENV !== 'production') {
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

    const port = process.env.PORT || 3000;

    const config = new DocumentBuilder()
        .setTitle(`Api документация`)
        .setVersion('0.0.1')
        .addBearerAuth()
        .addGlobalParameters(
            {
                name: 'x-client-type',
                in: 'header',
                required: false,
                description: 'Тип клиента',
                schema: {
                    type: 'string',
                    enum: ['web', 'mobile'],
                    default: 'web'
                }
            },
            {
                name: 'accept-language',
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

    await app.listen(port);
}

bootstrap();
