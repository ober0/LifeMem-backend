import type { INestApplication } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import request from 'supertest';
import type { App } from 'supertest/types';

import { PrismaService } from '../../../src/api/prisma/prisma.service';

export const MOBILE_HEADERS = {
    'x-client-type': 'mobile',
    'accept-language': 'en'
} as const;

export function expectErrorCode(body: { errors?: Array<{ code: string }> }, code: string): void {
    expect(body.errors?.some((item) => item.code === code)).toBe(true);
}

export async function ensureSeedAdminVerified(app: INestApplication<App>): Promise<void> {
    const email = process.env.SEED_USER_EMAIL;
    if (!email) {
        throw new Error('SEED_USER_EMAIL is required for e2e');
    }

    const prisma = app.get(PrismaService);
    await prisma.user.updateMany({
        where: { email },
        data: { isEmailVerified: true }
    });
}

export async function loginAsSeedAdmin(app: INestApplication<App>): Promise<{
    accessToken: string;
    userId: string;
}> {
    await ensureSeedAdminVerified(app);

    const email = process.env.SEED_USER_EMAIL!;
    const password = process.env.SEED_USER_PASSWORD!;

    const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .set(MOBILE_HEADERS)
        .send({ email, password });

    expect(response.status).toBe(200);
    expect(response.body.accessToken).toBeDefined();
    expect(response.body.user?.id).toBeDefined();

    return {
        accessToken: response.body.accessToken as string,
        userId: response.body.user.id as string
    };
}

export async function createVerifiedUser(
    app: INestApplication<App>,
    suffix: string
): Promise<{ accessToken: string; userId: string; email: string }> {
    const prisma = app.get(PrismaService);
    const email = `user_${suffix}@lifemem.test`;
    const nickname = `u_${suffix}`;

    const role = await prisma.role.findFirst({ where: { isDefault: true } });
    if (!role) {
        throw new Error('default role not found');
    }

    const passwordHash = await bcrypt.hash('Str0ng!Pass1', Number(process.env.SALT_ROUNDS ?? 10));

    const user = await prisma.user.create({
        data: {
            nickname,
            email,
            isEmailVerified: true,
            role: { connect: { id: role.id } },
            password: { create: { password: passwordHash } },
            userSettings: { create: { json: {} } }
        }
    });

    const secret = process.env.JWT_ACCESS_SECRET;
    if (!secret) {
        throw new Error('JWT_ACCESS_SECRET is required for e2e');
    }

    const accessToken = jwt.sign({ id: user.id }, secret, { expiresIn: '1h' });

    return { accessToken, userId: user.id, email };
}

export function authHeader(accessToken: string): { Authorization: string } {
    return { Authorization: `Bearer ${accessToken}` };
}
