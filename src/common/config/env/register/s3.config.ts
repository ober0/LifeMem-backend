import { registerAs } from '@nestjs/config';

export type S3Config = {
    bucket: string;
    endpoint: string;
    publicEndpoint: string;
    region: string;
    accessKeyId: string;
    secretAccessKey: string;
};

export default registerAs('s3', (): S3Config => ({
    bucket: process.env.S3_BUCKET!,
    endpoint: process.env.S3_ENDPOINT!,
    publicEndpoint: process.env.S3_PUBLIC_ENDPOINT!,
    region: process.env.S3_REGION!,
    accessKeyId: process.env.S3_ACCESS_KEY_ID!,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!
}));
