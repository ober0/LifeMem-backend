import { registerAs } from '@nestjs/config';

export type AppConfig = {
    nodeEnv: 'development' | 'production' | 'test';
    port: number;
    isProduction: boolean;
    swaggerUser: string;
    swaggerPass: string;
};

export default registerAs('app', (): AppConfig => ({
    nodeEnv: (process.env.NODE_ENV as AppConfig['nodeEnv']) || 'development',
    port: Number(process.env.PORT) || 3000,
    isProduction: process.env.NODE_ENV === 'production',
    swaggerUser: process.env.SWAGGER_USER ?? '',
    swaggerPass: process.env.SWAGGER_PASS ?? ''
}));
