import type { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';

import { appConstants } from '../../src/common/config/app.constants';
import { cacheConstants, CacheKey } from '../../src/common/config/constants/cache.constants';

export async function seedServiceSettings(prisma: PrismaClient, redis: Redis): Promise<void> {
    const existing = await prisma.serviceSettings.findFirst();

    if (existing) {
        await prisma.serviceSettings.update({
            where: {
                id: existing.id
            },
            data: {
                json: {
                    ...appConstants.serviceSettings.base,
                    ...((existing?.json as Record<string, unknown>) ?? {})
                }
            }
        });
    } else {
        await prisma.serviceSettings.create({
            data: {
                json: appConstants.serviceSettings.base
            }
        });
    }

    await redis.del(cacheConstants[CacheKey.ServiceSettings]().key);

    console.log('[seed:service-settings] созданы настройки приложения');
}
