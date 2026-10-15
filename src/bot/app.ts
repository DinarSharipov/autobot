import { Bot } from 'grammy';

import type { BackendClient } from '../backend/client.js';
import type { Logger } from '../logging.js';
import type { BotContext } from './context.js';
import { createLocalization } from './i18n.js';
import { createNavigation } from './navigation.js';
import { createChannelFeature } from './channels.js';
import { createPostFeature } from './posts.js';
import { createModerationFeature } from './moderation.js';
import { createScheduleFeature } from './schedules.js';
import { createTopicFeature } from './topics.js';
import { renderPage } from './ui.js';

export function createBot(
  token: string,
  backend: BackendClient,
  log: Logger,
  webAdminUrl: string | undefined,
): Bot<BotContext> {
  const bot = new Bot<BotContext>(token);
  // Locale -> global navigation -> feature input -> fallbacks.
  bot.use(createLocalization());
  bot.use(createNavigation(backend, webAdminUrl));
  bot.use(createChannelFeature(backend));
  bot.use(createPostFeature(backend));
  bot.use(createModerationFeature(backend));
  bot.use(createScheduleFeature(backend));
  bot.use(createTopicFeature(backend));
  bot.on('callback_query:data', async (context) => {
    await context.answerCallbackQuery({
      text: context.t('navigation-stale-button'),
    });
  });
  bot.on('message:text', async (context) => {
    await renderPage(context, context.t('navigation-fallback'));
  });
  bot.catch(({ ctx, error }) => {
    log('error', 'Failed to handle Telegram update', {
      updateId: ctx.update.update_id,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  });
  return bot;
}
