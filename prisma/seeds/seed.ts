import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';

import { seedRolesPermissions } from './seed-roles-permissions';
import { seedServiceSettings } from './seed-service-settings';
import { seedUser } from './seed-user';

const prisma = new PrismaClient();
const redis = new Redis(process.env.REDIS_URL!);

async function main() {
    await seedServiceSettings(prisma, redis);
    await seedRolesPermissions(prisma);
    await seedUser(prisma);

    console.log('[+] Выполнено.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
        await redis.quit();
    });
