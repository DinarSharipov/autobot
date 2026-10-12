import { Bot, type Context } from 'grammy';

import { BackendClient } from './backend/client.js';
import {
  clearChannelEditDraft,
  registerChannelHandlers,
} from './bot/channels.js';
import {
  clearModerationDrafts,
  registerModerationHandlers,
} from './bot/moderation.js';
import { clearPostDrafts, registerPostHandlers } from './bot/posts.js';
import { registerScheduleHandlers, showSchedules } from './bot/schedules.js';
import {
  clearTopicDrafts,
  registerTopicHandlers,
  showTopics,
} from './bot/topics.js';
import { registerStartHandler } from './bot/start.js';
import {
  configureTelegramBotUsername,
  mainReplyKeyboard,
  showMainMenu,
} from './bot/menu.js';
import {
  registerSubscriptionHandlers,
  showSubscription,
} from './bot/subscription.js';
import { telegramUserId } from './bot/common.js';
import { renderMenu } from './bot/ui.js';
import { parseEnvironment } from './config/environment.js';
import { showChannels } from './bot/channels.js';
import { showModeration } from './bot/moderation.js';
import { showPosts } from './bot/posts.js';

const environment = parseEnvironment(process.env);
const bot = new Bot(environment.telegramToken);
const backend = new BackendClient({
  baseUrl: environment.backendUrl,
  keyId: environment.botServiceActiveKeyId,
  secret: environment.botServiceActiveSecret,
});

const MAIN_NAVIGATION_TEXTS = new Set([
  'Темы',
  'Каналы',
  'Посты',
  'Модерация',
  'Расписание',
  'Подписка и лимиты',
  'Главное меню',
]);

function clearConversationDrafts(context: Context): void {
  const userId = telegramUserId(context);
  if (!userId) {
    return;
  }

  clearChannelEditDraft(userId);
  clearModerationDrafts(userId);
  clearPostDrafts(userId);
  clearTopicDrafts(userId);
}

registerStartHandler(bot, backend);
bot.on('message:text', async (context, next) => {
  const text = context.message.text.trim();
  if (MAIN_NAVIGATION_TEXTS.has(text)) {
    clearConversationDrafts(context);
  }

  switch (text) {
    case 'Темы':
      await showTopics(context, backend);
      return;
    case 'Каналы':
      await showChannels(context, backend);
      return;
    case 'Посты':
      await showPosts(context, backend);
      return;
    case 'Модерация':
      await showModeration(context, backend);
      return;
    case 'Расписание':
      await showSchedules(context, backend);
      return;
    case 'Подписка и лимиты':
      await showSubscription(context, backend);
      return;
    case 'Главное меню':
      await showMainMenu(context);
      return;
    default:
      await next();
  }
});
registerSubscriptionHandlers(bot, backend);
registerChannelHandlers(bot, backend);
registerPostHandlers(bot, backend);
registerModerationHandlers(bot, backend);
registerScheduleHandlers(bot, backend);
registerTopicHandlers(bot, backend);
bot.command('cancel', async (context) => {
  clearConversationDrafts(context);
  await renderMenu(context, 'Текущий сценарий отменён.', {
    reply_markup: mainReplyKeyboard(),
  });
});
bot.command('menu', showMainMenu);
bot.callbackQuery('menu:home', async (context) => {
  await context.answerCallbackQuery();
  await showMainMenu(context);
});
let isStopping = false;

function log(
  level: 'info' | 'error',
  message: string,
  details: Record<string, unknown> = {},
): void {
  const payload = JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    message,
    service: 'autobot-bot',
    buildSha: environment.buildSha,
    ...details,
  });

  if (level === 'error') {
    console.error(payload);
    return;
  }

  console.log(payload);
}

async function shutdown(signal: NodeJS.Signals): Promise<void> {
  if (isStopping) {
    return;
  }

  isStopping = true;
  log('info', 'Stopping Telegram bot', { signal });
  await bot.stop();
}

process.once('SIGINT', () => {
  void shutdown('SIGINT');
});

process.once('SIGTERM', () => {
  void shutdown('SIGTERM');
});

async function main(): Promise<void> {
  await bot.start({
    onStart: ({ username }) => {
      configureTelegramBotUsername(username);
      log('info', 'Telegram bot started', {
        username,
        backendUrl: environment.backendUrl,
        nodeEnv: environment.nodeEnv,
      });
    },
  });
}

main().catch((error: unknown) => {
  log('error', 'Telegram bot failed', {
    error: error instanceof Error ? error.message : 'Unknown error',
  });
  process.exitCode = 1;
});
