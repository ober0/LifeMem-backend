import { registerAs } from '@nestjs/config';

export type RedisConfig = {
    url: string;
};

export default registerAs(
    'redis',
    (): RedisConfig => ({
        url: process.env.REDIS_URL ?? 'redis://127.0.0.1:6379'
    })
);
