import type { Bot, Context } from 'grammy';

export const START_MESSAGE = [
  'Добро пожаловать в Autobot!',
  '',
  'Я помогу создавать, планировать и публиковать посты в Telegram-каналах.',
  'Остальные функции появятся в следующих обновлениях.',
].join('\n');

export function registerStartHandler(bot: Bot<Context>): void {
  bot.command('start', async (context) => {
    await context.reply(START_MESSAGE);
  });
}
