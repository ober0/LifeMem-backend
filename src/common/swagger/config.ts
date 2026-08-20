import type { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { apiReference } from '@scalar/nestjs-api-reference';
import basicAuth from 'express-basic-auth';

import { AppConfig } from '../config/env';

export const initSwagger = (app: NestExpressApplication, config: AppConfig) => {
    if (config.isProduction) {
        app.use(
            ['/docs'],
            basicAuth({
                users: { [config.swaggerUser]: config.swaggerPass },
                challenge: true
            })
        );
    }

    const swagger = new DocumentBuilder()
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

    const document = SwaggerModule.createDocument(app, swagger);

    app.use(
        '/docs',
        apiReference({
            content: document,
            pageTitle: 'LifeMem API'
        })
    );
};
