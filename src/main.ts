import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
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
        .addGlobalParameters({
            name: 'x-client-type',
            in: 'header',
            required: false,
            description: 'Тип клиента',
            schema: {
                type: 'string',
                enum: ['web', 'mobile'],
                default: 'web'
            }
        })
        .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, document);

    await app.listen(port);
}

bootstrap();
