import { Injectable } from '@nestjs/common';
import { HeadBucketCommand, S3Client } from '@aws-sdk/client-s3';

@Injectable()
export class S3Service {
    private readonly _s3: S3Client;
    private readonly _bucket: string;
    private readonly _endpoint: string;

    constructor() {
        this._bucket = process.env.S3_BUCKET!;
        this._endpoint = process.env.S3_ENDPOINT!;

        this._s3 = new S3Client({
            region: process.env.S3_REGION!,
            endpoint: this._endpoint,
            forcePathStyle: true,
            credentials: {
                accessKeyId: process.env.S3_ACCESS_KEY_ID!,
                secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!
            }
        });
    }

    async ping(): Promise<void> {
        await this._s3.send(new HeadBucketCommand({ Bucket: this._bucket }));
    }
}
