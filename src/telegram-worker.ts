import telegramConfig from './common/config/env/register/telegram.config';
import { createTelegramBot } from './telegram-bot/bot';

const { botToken: token } = telegramConfig();

if (!token) {
    console.error('TELEGRAM_BOT_TOKEN не задан');
    process.exit(1);
}

const bot = createTelegramBot(token);

const shutdown = async () => {
    await bot.stop();
    process.exit(0);
};

process.once('SIGINT', () => void shutdown());
process.once('SIGTERM', () => void shutdown());

void bot.start({
    onStart: (info) => {
        console.log(`@${info.username} запущен (polling)`);
    }
});
