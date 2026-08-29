import { registerAs } from '@nestjs/config';

export type TelegramConfig = {
    botToken: string;
    botUsername: string;
};

export default registerAs(
    'telegram',
    (): TelegramConfig => ({
        botToken: process.env.TELEGRAM_BOT_TOKEN || '',
        botUsername: process.env.TELEGRAM_BOT_USERNAME || ''
    })
);
