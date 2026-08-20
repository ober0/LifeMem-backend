import { HeadBucketCommand, S3Client } from '@aws-sdk/client-s3';
import { Inject, Injectable } from '@nestjs/common';

import type { S3Config} from '../../common/config/env';
import { s3Config } from '../../common/config/env';

@Injectable()
export class S3Service {
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

    async ping(): Promise<void> {
        await this._s3.send(new HeadBucketCommand({ Bucket: this._bucket }));
    }
}
