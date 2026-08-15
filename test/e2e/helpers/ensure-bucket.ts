import {
    CreateBucketCommand,
    HeadBucketCommand,
    S3Client
} from '@aws-sdk/client-s3';

export async function ensureE2eBucket(): Promise<void> {
    const bucket = process.env.S3_BUCKET;
    if (!bucket) {
        throw new Error('S3_BUCKET is not set');
    }

    const client = new S3Client({
        region: process.env.S3_REGION || 'us-east-1',
        endpoint: process.env.S3_ENDPOINT,
        forcePathStyle: true,
        credentials: {
            accessKeyId: process.env.S3_ACCESS_KEY_ID!,
            secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!
        }
    });

    try {
        await client.send(new HeadBucketCommand({ Bucket: bucket }));
        return;
    } catch {
        // bucket missing — create below
    }

    await client.send(new CreateBucketCommand({ Bucket: bucket }));
}
