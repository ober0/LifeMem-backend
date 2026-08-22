import type { INestApplication } from '@nestjs/common';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import type { App } from 'supertest/types';

import { AppModule } from '../../../src/api/app/app.module';
import { ErrorsTranslateFilter } from '../../../src/common/translation/errors-translate.filter';
import { ValidationException } from '../../../src/common/translation/validation-exception';

export async function createTestApp(): Promise<INestApplication<App>> {
    const moduleFixture: TestingModule = await Test.createTestingModule({
        imports: [AppModule]
    }).compile();

    const app = moduleFixture.createNestApplication();

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
            exceptionFactory: (errors) => new ValidationException(errors),
            transform: true,
            whitelist: true
        })
    );

    await app.init();
    return app;
}
