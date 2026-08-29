import { Bot } from 'grammy';

export function createTelegramBot(token: string): Bot {
    const bot = new Bot(token);

    bot.command('start', async (ctx) => {
        const name = ctx.from?.first_name ?? 'друг';
        await ctx.reply(
            `Привет, ${name}!\n\nВход и регистрация в LifeMem через кнопку авторизации на сайте или в приложении.`
        );
    });

    bot.catch((err) => {
        console.error('error', err.error);
    });

    return bot;
}
