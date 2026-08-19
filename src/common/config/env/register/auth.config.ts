import { registerAs } from '@nestjs/config';

export type AuthConfig = {
    jwtAccessSecret: string;
    jwtRefreshSecret: string;
    saltRounds: number;
};

export default registerAs(
    'auth',
    (): AuthConfig => ({
        jwtAccessSecret: process.env.JWT_ACCESS_SECRET!,
        jwtRefreshSecret: process.env.JWT_REFRESH_SECRET!,
        saltRounds: Number(process.env.SALT_ROUNDS)
    })
);
