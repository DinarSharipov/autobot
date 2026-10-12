import type { Bot, Context } from 'grammy';

import type { BackendClient } from '../backend/client.js';
import { backendErrorMessage, resolveUser } from './common.js';
import { mainMenuKeyboard } from './menu.js';
import { renderMenu } from './ui.js';

export function registerStartHandler(
  bot: Bot<Context>,
  backend: BackendClient,
): void {
  bot.command('start', async (context) => {
    try {
      await resolveUser(context, backend);
      await renderMenu(
        context,
        [
          'Добро пожаловать в Autobot!',
          '',
          'Создавайте и планируйте публикации для Telegram-каналов.',
        ].join('\n'),
        { reply_markup: mainMenuKeyboard() },
      );
    } catch (error) {
      await renderMenu(context, backendErrorMessage(error));
    }
  });
}
