import {
    CreateBucketCommand,
    GetObjectCommand,
    HeadBucketCommand,
    PutObjectCommand,
    S3Client
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Inject, Injectable, OnModuleInit } from '@nestjs/common';

import type { S3Config } from '../../common/config/env';
import { s3Config } from '../../common/config/env';

@Injectable()
export class S3Service implements OnModuleInit {
    private static ensureBucketPromise: Promise<void> | null = null;

    private readonly _s3: S3Client;
    private readonly _bucket: string;
    private readonly _endpoint: string;

    constructor(@Inject(s3Config.KEY) private readonly s3: S3Config) {
        this._bucket = this.s3.bucket;
        this._endpoint = this.s3.endpoint;

        this._s3 = new S3Client({
            region: this.s3.region,
            endpoint: this._endpoint,
            forcePathStyle: true,
            credentials: {
                accessKeyId: this.s3.accessKeyId,
                secretAccessKey: this.s3.secretAccessKey
            }
        });
    }

    async onModuleInit(): Promise<void> {
        await this.ensureBucket();
    }

    async ensureBucket(): Promise<void> {
        if (!S3Service.ensureBucketPromise) {
            S3Service.ensureBucketPromise = this.createBucketIfMissing();
        }

        await S3Service.ensureBucketPromise;
    }

    async ping(): Promise<void> {
        await this._s3.send(new HeadBucketCommand({ Bucket: this._bucket }));
    }

    async upload(params: { key: string; body: Buffer; contentType?: string }): Promise<void> {
        await this._s3.send(
            new PutObjectCommand({
                Bucket: this._bucket,
                Key: params.key,
                Body: params.body,
                ContentType: params.contentType
            })
        );
    }

    async getSignedUrl(params: { key: string; expiresIn?: number }): Promise<string> {
        return getSignedUrl(
            this._s3,
            new GetObjectCommand({
                Bucket: this._bucket,
                Key: params.key
            }),
            {
                expiresIn: params.expiresIn ?? 3600
            }
        );
    }

    async getObjectBuffer(key: string): Promise<Buffer> {
        const response = await this._s3.send(
            new GetObjectCommand({
                Bucket: this._bucket,
                Key: key
            })
        );

        const body = response.Body;
        if (!body) {
            throw new Error(`S3 object body is empty: ${key}`);
        }

        return Buffer.from(await body.transformToByteArray());
    }

    private async createBucketIfMissing(): Promise<void> {
        try {
            await this._s3.send(new HeadBucketCommand({ Bucket: this._bucket }));
            return;
        } catch {
            // already
        }

        try {
            await this._s3.send(new CreateBucketCommand({ Bucket: this._bucket }));
        } catch (error) {
            const name = (error as { name?: string }).name;
            if (name === 'BucketAlreadyOwnedByYou' || name === 'BucketAlreadyExists') {
                return;
            }

            throw error;
        }
    }
}
