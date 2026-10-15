import type { BotContext } from './context.js';
import { InlineKeyboard } from 'grammy';

import { renderPage } from './ui.js';

export async function showMainMenu(
  context: BotContext,
  webAdminUrl: string | undefined,
): Promise<void> {
  const keyboard = new InlineKeyboard().text(
    context.t('action-create-post'),
    'posts:create',
  );
  if (webAdminUrl) {
    keyboard.row().url(context.t('action-open-web-admin'), webAdminUrl);
  }
  await renderPage(context, context.t('home-page'), {
    reply_markup: keyboard,
  });
}
