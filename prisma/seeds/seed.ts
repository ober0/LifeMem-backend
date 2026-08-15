import { PrismaClient } from '@prisma/client';
import { seedRolesPermissions } from './seed-roles-permissions';
import { seedServiceSettings } from './seed-service-settings';
import { seedUser } from './seed-user';

const prisma = new PrismaClient();

async function main() {
    await seedServiceSettings(prisma);
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
    });
