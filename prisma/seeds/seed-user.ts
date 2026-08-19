import type { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const ADMIN_ROLE_NAME = 'admin';

export async function seedUser(prisma: PrismaClient): Promise<void> {
    const email = process.env.SEED_USER_EMAIL;
    const password = process.env.SEED_USER_PASSWORD;
    const nickname = process.env.SEED_USER_NICKNAME ?? 'admin';

    if (!email || !password) {
        console.error('[seed:user] настройки администратора не заданы');
        throw new Error('SEED_USER_EMAIL / SEED_USER_PASSWORD are required');
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
        console.log(`[seed:user] пользователь ${email} уже есть`);
        return;
    }

    const role = await prisma.role.findUnique({ where: { name: ADMIN_ROLE_NAME } });
    if (!role) {
        throw new Error(`[seed:user] роль ${ADMIN_ROLE_NAME} не найдена — сначала запустите seed RBAC`);
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await prisma.user.create({
        data: {
            nickname,
            email,
            role: {
                connect: { id: role.id }
            },
            password: {
                create: {
                    password: passwordHash
                }
            },
            userSettings: {
                create: {
                    json: {
                        enableNotification: true
                    }
                }
            }
        }
    });

    console.log(`[seed:user] создан пользователь ${email}`);
}
