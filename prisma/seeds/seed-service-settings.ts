import type { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';

import type { ServiceSettingsJsonDto } from '../../src/api/service-settings/dto/settings-json.dto';
import { appConstants } from '../../src/common/config/app.constants';
import { cacheConstants, CacheKey } from '../../src/common/config/constants/cache.constants';
import { deepMerge } from '../../src/common/helpers/deep-merge';

export async function seedServiceSettings(prisma: PrismaClient, redis: Redis): Promise<void> {
    const existing = await prisma.serviceSettings.findFirst();

    const json = existing
        ? deepMerge(
              { ...appConstants.serviceSettings.base },
              (existing.json as unknown as ServiceSettingsJsonDto) ?? {}
          )
        : { ...appConstants.serviceSettings.base };

    if (existing) {
        await prisma.serviceSettings.update({
            where: {
                id: existing.id
            },
            data: {
                json
            }
        });
    } else {
        await prisma.serviceSettings.create({
            data: {
                json
            }
        });
    }

    await redis.del(cacheConstants[CacheKey.ServiceSettings]().key);

    console.log('[seed:service-settings] созданы настройки приложения');
}
