import {
    AbortMultipartUploadCommand,
    CompleteMultipartUploadCommand,
    CreateBucketCommand,
    CreateMultipartUploadCommand,
    DeleteObjectCommand,
    GetObjectCommand,
    HeadBucketCommand,
    HeadObjectCommand,
    ListPartsCommand,
    PutObjectCommand,
    S3Client,
    UploadPartCommand
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Inject, Injectable, OnModuleInit } from '@nestjs/common';

import type { S3Config } from '../../common/config/env';
import { s3Config } from '../../common/config/env';

const DEFAULT_PRESIGN_EXPIRES_IN_SEC = 3600;

export type CreateUploadUrlParams = {
    key: string;
    contentType: string;
    expiresIn?: number;
};

export type CreateMultipartUploadUrlParams = {
    key: string;
    uploadId: string;
    partNumber: number;
    expiresIn?: number;
};

export type S3ObjectHead = {
    contentLength: number;
    contentType: string;
};

export type CompleteMultipartUploadPart = {
    partNumber: number;
    etag: string;
};

@Injectable()
export class S3Service implements OnModuleInit {
    private static ensureBucketPromise: Promise<void> | null = null;

    private readonly _s3: S3Client;
    private readonly _s3Public: S3Client;
    private readonly _bucket: string;

    constructor(@Inject(s3Config.KEY) private readonly s3: S3Config) {
        this._bucket = this.s3.bucket;

        const credentials = {
            accessKeyId: this.s3.accessKeyId,
            secretAccessKey: this.s3.secretAccessKey
        };

        this._s3 = new S3Client({
            region: this.s3.region,
            endpoint: this.s3.endpoint,
            forcePathStyle: true,
            credentials
        });

        this._s3Public =
            this.s3.publicEndpoint === this.s3.endpoint
                ? this._s3
                : new S3Client({
                      region: this.s3.region,
                      endpoint: this.s3.publicEndpoint,
                      forcePathStyle: true,
                      credentials
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
            this._s3Public,
            new GetObjectCommand({
                Bucket: this._bucket,
                Key: params.key
            }),
            {
                expiresIn: params.expiresIn ?? DEFAULT_PRESIGN_EXPIRES_IN_SEC
            }
        );
    }

    async createUploadUrl(params: CreateUploadUrlParams): Promise<string> {
        const expiresIn = params.expiresIn ?? DEFAULT_PRESIGN_EXPIRES_IN_SEC;

        return getSignedUrl(
            this._s3Public,
            new PutObjectCommand({
                Bucket: this._bucket,
                Key: params.key,
                ContentType: params.contentType
            }),
            { expiresIn }
        );
    }

    async createMultipartUpload(params: { key: string; contentType: string }): Promise<string> {
        return this.startMultipartUpload(params);
    }

    async createMultipartUploadUrl(params: CreateMultipartUploadUrlParams): Promise<string> {
        const expiresIn = params.expiresIn ?? DEFAULT_PRESIGN_EXPIRES_IN_SEC;

        return getSignedUrl(
            this._s3Public,
            new UploadPartCommand({
                Bucket: this._bucket,
                Key: params.key,
                UploadId: params.uploadId,
                PartNumber: params.partNumber
            }),
            { expiresIn }
        );
    }

    async completeMultipartUpload(params: {
        key: string;
        uploadId: string;
        parts: CompleteMultipartUploadPart[];
    }): Promise<void> {
        await this._s3.send(
            new CompleteMultipartUploadCommand({
                Bucket: this._bucket,
                Key: params.key,
                UploadId: params.uploadId,
                MultipartUpload: {
                    Parts: [...params.parts]
                        .sort((a, b) => a.partNumber - b.partNumber)
                        .map((part) => ({
                            ETag: part.etag,
                            PartNumber: part.partNumber
                        }))
                }
            })
        );
    }

    async listMultipartParts(params: { key: string; uploadId: string }): Promise<CompleteMultipartUploadPart[]> {
        const parts: CompleteMultipartUploadPart[] = [];
        let partNumberMarker: string | undefined;

        do {
            const response = await this._s3.send(
                new ListPartsCommand({
                    Bucket: this._bucket,
                    Key: params.key,
                    UploadId: params.uploadId,
                    PartNumberMarker: partNumberMarker
                })
            );

            for (const part of response.Parts ?? []) {
                if (part.PartNumber && part.ETag) {
                    parts.push({
                        partNumber: part.PartNumber,
                        etag: part.ETag
                    });
                }
            }

            partNumberMarker = response.IsTruncated ? response.NextPartNumberMarker : undefined;
        } while (partNumberMarker);

        return parts;
    }

    async abortMultipartUpload(params: { key: string; uploadId: string }): Promise<void> {
        await this._s3.send(
            new AbortMultipartUploadCommand({
                Bucket: this._bucket,
                Key: params.key,
                UploadId: params.uploadId
            })
        );
    }

    async deleteObject(key: string): Promise<void> {
        await this._s3.send(
            new DeleteObjectCommand({
                Bucket: this._bucket,
                Key: key
            })
        );
    }

    async headObject(key: string): Promise<S3ObjectHead> {
        const response = await this._s3.send(
            new HeadObjectCommand({
                Bucket: this._bucket,
                Key: key
            })
        );

        return {
            contentLength: response.ContentLength ?? 0,
            contentType: response.ContentType ?? 'application/octet-stream'
        };
    }

    async objectExists(key: string): Promise<boolean> {
        try {
            await this.headObject(key);
            return true;
        } catch (error) {
            const name = (error as { name?: string }).name;
            if (name === 'NotFound' || name === 'NoSuchKey') {
                return false;
            }

            throw error;
        }
    }

    private async startMultipartUpload(params: { key: string; contentType: string }): Promise<string> {
        const response = await this._s3.send(
            new CreateMultipartUploadCommand({
                Bucket: this._bucket,
                Key: params.key,
                ContentType: params.contentType
            })
        );

        if (!response.UploadId) {
            throw new Error(`S3 multipart upload id is empty: ${params.key}`);
        }

        return response.UploadId;
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
