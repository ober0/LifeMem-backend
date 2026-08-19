import type { PrismaClient } from '@prisma/client';

const BASE_SERVICE_SETTINGS = {
    appVersion: 1
};

export async function seedServiceSettings(prisma: PrismaClient): Promise<void> {
    const existing = await prisma.serviceSettings.findFirst();

    if (existing) {
        console.log('[seed:service-settings] настройки уже есть');
        return;
    }

    await prisma.serviceSettings.create({
        data: {
            json: BASE_SERVICE_SETTINGS
        }
    });

    console.log('[seed:service-settings] созданы настройки приложения');
}
