import appConfig from './register/app.config';
import authConfig from './register/auth.config';
import oauthConfig from './register/oauth.config';
import redisConfig from './register/redis.config';
import s3Config from './register/s3.config';
import smtpConfig from './register/smtp.config';
import telegramConfig from './register/telegram.config';

export type { AppConfig } from './register/app.config';
export { default as appConfig } from './register/app.config';
export type { AuthConfig } from './register/auth.config';
export { default as authConfig } from './register/auth.config';
export type { OauthConfig } from './register/oauth.config';
export { default as oauthConfig } from './register/oauth.config';
export type { RedisConfig } from './register/redis.config';
export { default as redisConfig } from './register/redis.config';
export type { S3Config } from './register/s3.config';
export { default as s3Config } from './register/s3.config';
export type { SmtpConfig } from './register/smtp.config';
export { default as smtpConfig } from './register/smtp.config';
export type { TelegramConfig } from './register/telegram.config';
export { default as telegramConfig } from './register/telegram.config';
export { validateEnv } from './validation';

export const envConfigs = [
    appConfig,
    authConfig,
    smtpConfig,
    s3Config,
    redisConfig,
    oauthConfig,
    telegramConfig
];
