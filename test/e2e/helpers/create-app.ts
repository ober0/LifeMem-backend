import { INestApplication, ValidationPipe, VersioningType } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { App } from 'supertest/types';
import { AppModule } from '../../../src/modules/app/app.module';

export async function createTestApp(): Promise<INestApplication<App>> {
    const moduleFixture: TestingModule = await Test.createTestingModule({
        imports: [AppModule]
    }).compile();

    const app = moduleFixture.createNestApplication();

    app.setGlobalPrefix('api', {
        exclude: ['health']
    });
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

    await app.init();
    return app;
}
