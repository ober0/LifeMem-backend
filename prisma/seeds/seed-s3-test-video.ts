import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { HeadObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';

import { appConstants } from '../../src/common/config/app.constants';

const S3_OBJECT_KEY = appConstants.files.testVideoPath;
const LOCAL_RELATIVE_PATH = path.join('public', 'test-video.mp4');

async function objectExists(client: S3Client, bucket: string, key: string): Promise<boolean> {
    try {
        await client.send(
            new HeadObjectCommand({
                Bucket: bucket,
                Key: key
            })
        );
        return true;
    } catch (error) {
        const name = (error as { name?: string }).name;
        if (name === 'NotFound' || name === 'NoSuchKey') {
            return false;
        }

        throw error;
    }
}

export async function seedS3TestVideo(s3: S3Client): Promise<void> {
    const bucket = process.env.S3_BUCKET;
    if (!bucket) {
        console.log('[seed:s3-test-video] S3 не настроен, пропуск');
        return;
    }

    if (await objectExists(s3, bucket, S3_OBJECT_KEY)) {
        console.log(`[seed:s3-test-video] ${S3_OBJECT_KEY} уже есть`);
        return;
    }

    const localPath = path.join(process.cwd(), LOCAL_RELATIVE_PATH);
    const body = await readFile(localPath);

    await s3.send(
        new PutObjectCommand({
            Bucket: bucket,
            Key: S3_OBJECT_KEY,
            Body: body,
            ContentType: 'video/mp4'
        })
    );

    console.log(`[seed:s3-test-video] загружен ${S3_OBJECT_KEY}`);
}
