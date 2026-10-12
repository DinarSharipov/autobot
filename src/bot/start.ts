import type { Bot, Context } from 'grammy';

import type { BackendClient } from '../backend/client.js';
import { backendErrorMessage, resolveUser } from './common.js';
import { showMainMenu } from './menu.js';

export function registerStartHandler(
  bot: Bot<Context>,
  backend: BackendClient,
): void {
  bot.command('start', async (context) => {
    try {
      await resolveUser(context, backend);
      await context.reply(
        [
          'Добро пожаловать в Autobot!',
          '',
          'Создавайте и планируйте публикации для Telegram-каналов.',
        ].join('\n'),
      );
      await showMainMenu(context);
    } catch (error) {
      await context.reply(backendErrorMessage(error));
    }
  });
}
