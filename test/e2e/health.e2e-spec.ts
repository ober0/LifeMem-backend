import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { createTestApp } from './helpers/create-app';

describe('Health (e2e)', () => {
    let app: INestApplication<App>;

    beforeEach(async () => {
        app = await createTestApp();
    }, 15000);

    afterEach(async () => {
        if (app) {
            await app.close();
        }
    }, 15000);

    it('GET /health', async () => {
        const response = await request(app.getHttpServer()).get('/health');

        expect([200]).toContain(response.status);
        expect(response.body).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ service: 'app', status: 'ok' }),
                expect.objectContaining({ service: 'postgres', status: 'ok' }),
                expect.objectContaining({ service: 'redis', status: 'ok' }),
                expect.objectContaining({ service: 's3', status: 'ok' })
            ])
        );
        expect(response.body).toHaveLength(4);
    }, 15000);
});
