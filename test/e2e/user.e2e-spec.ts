import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types';

import {
    authHeader,
    createVerifiedUser,
    expectErrorCode,
    loginAsSeedAdmin,
    MOBILE_HEADERS
} from './helpers/auth';
import { createTestApp } from './helpers/create-app';
import { ensureE2eBucket } from './helpers/ensure-bucket';

describe('User errors (e2e)', () => {
    let app: INestApplication<App>;
    let adminToken: string;
    let adminUserId: string;

    beforeAll(async () => {
        await ensureE2eBucket();
        app = await createTestApp();

        const admin = await loginAsSeedAdmin(app);
        adminToken = admin.accessToken;
        adminUserId = admin.userId;
    }, 60000);

    afterAll(async () => {
        if (app) {
            await app.close();
        }
    }, 15000);

    describe('POST /user', () => {
        it('400 when no auth method', async () => {
            const response = await request(app.getHttpServer())
                .post('/api/v1/user')
                .set(MOBILE_HEADERS)
                .send({ nickname: 'ab', initSettings: { lang: 'en' } });

            expect(response.status).toBe(400);
            expectErrorCode(response.body, 'auth.no_auth_data');
        });

        it('409 when email already exists', async () => {
            const email = process.env.SEED_USER_EMAIL!;
            const response = await request(app.getHttpServer())
                .post('/api/v1/user')
                .set(MOBILE_HEADERS)
                .send({
                    nickname: 'dup_email',
                    email,
                    password: 'Str0ng!Pass1',
                    initSettings: { lang: 'en' }
                });

            expect(response.status).toBe(409);
            expectErrorCode(response.body, 'user.email_already_exists');
        });
    });

    describe('POST /user/confirm-email', () => {
        it('404 when user missing', async () => {
            const response = await request(app.getHttpServer())
                .post('/api/v1/user/confirm-email')
                .set(MOBILE_HEADERS)
                .send({ email: 'missing_confirm@lifemem.test', code: '123456' });

            expect(response.status).toBe(404);
            expectErrorCode(response.body, 'user.not_found');
        });

        it('400 when code invalid', async () => {
            const email = `confirm_bad_${Date.now()}@lifemem.test`;
            await request(app.getHttpServer())
                .post('/api/v1/user')
                .set(MOBILE_HEADERS)
                .send({
                    nickname: 'confirm_bad',
                    email,
                    password: 'Str0ng!Pass1',
                    initSettings: { lang: 'en' }
                });

            const response = await request(app.getHttpServer())
                .post('/api/v1/user/confirm-email')
                .set(MOBILE_HEADERS)
                .send({ email, code: '000000' });

            expect(response.status).toBe(400);
            expectErrorCode(response.body, 'auth.invalid_code');
        });
    });

    describe('PATCH /user/me add-phone add-email', () => {
        it('401 without token', async () => {
            const response = await request(app.getHttpServer())
                .patch('/api/v1/user/me')
                .set(MOBILE_HEADERS)
                .send({ nickname: 'noauth' });

            expect(response.status).toBe(401);
            expectErrorCode(response.body, 'auth.unauthorized');
        });

        it('409 add-phone when already bound', async () => {
            const user = await createVerifiedUser(app, `phone_${Date.now()}`);
            const phone = `7999${String(Date.now()).slice(-7)}`;

            const first = await request(app.getHttpServer())
                .patch('/api/v1/user/add-phone')
                .set(MOBILE_HEADERS)
                .set(authHeader(user.accessToken))
                .send({ phoneNumber: `+${phone}` });

            expect(first.status).toBe(200);

            const second = await request(app.getHttpServer())
                .patch('/api/v1/user/add-phone')
                .set(MOBILE_HEADERS)
                .set(authHeader(user.accessToken))
                .send({ phoneNumber: `+7${String(Date.now()).slice(-10)}` });

            expect(second.status).toBe(409);
            expectErrorCode(second.body, 'user.phone_already_bound');
        });

        it('409 add-email when already bound', async () => {
            const user = await createVerifiedUser(app, `mail_${Date.now()}`);

            const response = await request(app.getHttpServer())
                .patch('/api/v1/user/add-email')
                .set(MOBILE_HEADERS)
                .set(authHeader(user.accessToken))
                .send({ email: `another_${Date.now()}@lifemem.test`, password: 'Str0ng!Pass1' });

            expect(response.status).toBe(409);
            expectErrorCode(response.body, 'user.email_already_bound');
        });

        it('400 add-phone with invalid phone', async () => {
            const user = await createVerifiedUser(app, `badph_${Date.now()}`);

            const response = await request(app.getHttpServer())
                .patch('/api/v1/user/add-phone')
                .set(MOBILE_HEADERS)
                .set(authHeader(user.accessToken))
                .send({ phoneNumber: 'not-a-phone' });

            expect(response.status).toBe(400);
            expectErrorCode(response.body, 'user.phone_not_correct');
        });
    });

    describe('User Admin', () => {
        it('401 search without auth', async () => {
            const response = await request(app.getHttpServer())
                .post('/api/v1/admin/user/search')
                .set(MOBILE_HEADERS)
                .send({ pagination: { page: 1, count: 10 } });

            expect(response.status).toBe(401);
            expectErrorCode(response.body, 'auth.unauthorized');
        });

        it('403 search without permission', async () => {
            const user = await createVerifiedUser(app, `noperm_${Date.now()}`);

            const response = await request(app.getHttpServer())
                .post('/api/v1/admin/user/search')
                .set(MOBILE_HEADERS)
                .set(authHeader(user.accessToken))
                .send({ pagination: { page: 1, count: 10 } });

            expect(response.status).toBe(403);
            expectErrorCode(response.body, 'auth.forbidden');
        });

        it('404 update missing user', async () => {
            const response = await request(app.getHttpServer())
                .patch('/api/v1/admin/user/00000000-0000-4000-8000-000000000001')
                .set(MOBILE_HEADERS)
                .set(authHeader(adminToken))
                .send({ nickname: 'ghost' });

            expect(response.status).toBe(404);
            expectErrorCode(response.body, 'user.not_found');
        });

        it('400 delete self', async () => {
            const response = await request(app.getHttpServer())
                .delete(`/api/v1/admin/user/${adminUserId}`)
                .set(MOBILE_HEADERS)
                .set(authHeader(adminToken));

            expect(response.status).toBe(400);
            expectErrorCode(response.body, 'user.no_access');
        });

        it('409 update with taken email', async () => {
            const user = await createVerifiedUser(app, `taken_${Date.now()}`);

            const response = await request(app.getHttpServer())
                .patch(`/api/v1/admin/user/${user.userId}`)
                .set(MOBILE_HEADERS)
                .set(authHeader(adminToken))
                .send({ email: process.env.SEED_USER_EMAIL });

            expect(response.status).toBe(409);
            expectErrorCode(response.body, 'user.email_already_exists');
        });
    });
});
