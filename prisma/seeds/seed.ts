import { S3Client } from '@aws-sdk/client-s3';
import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';

import { seedAiModels } from './seed-ai-models';
import { seedRolesPermissions } from './seed-roles-permissions';
import { seedS3TestImage } from './seed-s3-test-image';
import { seedS3TestVideo } from './seed-s3-test-video';
import { seedServiceSettings } from './seed-service-settings';
import { seedUser } from './seed-user';

const prisma = new PrismaClient();
const redis = new Redis(process.env.REDIS_URL!);
const s3 =
    process.env.S3_BUCKET && process.env.S3_ENDPOINT
        ? new S3Client({
              region: process.env.S3_REGION!,
              endpoint: process.env.S3_ENDPOINT!,
              forcePathStyle: true,
              credentials: {
                  accessKeyId: process.env.S3_ACCESS_KEY_ID!,
                  secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!
              }
          })
        : null;

async function main() {
    await seedServiceSettings(prisma, redis);
    await seedRolesPermissions(prisma);
    await seedUser(prisma);
    await seedAiModels(prisma, redis);
    if (s3 && process.env.NODE_ENV === 'development') {
        await seedS3TestImage(s3);
        await seedS3TestVideo(s3);
    } else {
        console.log('[seed:s3-test-media] пропущен');
    }

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
        s3?.destroy();
    });
