import type { PrismaClient } from '@prisma/client';

import { appConstants } from '../../src/common/config/app.constants';

export async function seedServiceSettings(prisma: PrismaClient): Promise<void> {
    const existing = await prisma.serviceSettings.findFirst();

    if (existing) {
        console.log('[seed:service-settings] настройки уже есть');
        return;
    }

    await prisma.serviceSettings.create({
        data: {
            json: appConstants.serviceSettings.base
        }
    });

    console.log('[seed:service-settings] созданы настройки приложения');
}
