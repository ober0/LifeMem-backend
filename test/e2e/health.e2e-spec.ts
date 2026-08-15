import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { createTestApp } from './helpers/create-app';
import { ensureE2eBucket } from './helpers/ensure-bucket';

describe('Health (e2e)', () => {
    let app: INestApplication<App>;

    beforeAll(async () => {
        await ensureE2eBucket();
        app = await createTestApp();
    }, 30000);

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
