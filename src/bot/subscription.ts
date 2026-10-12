import { InlineKeyboard, type Bot, type Context } from 'grammy';

import type { BackendClient, Usage } from '../backend/client.js';
import { backendErrorMessage, resolveUser } from './common.js';
import { mainMenuKeyboard } from './menu.js';

function formatLimit(value: number | null): string {
  return value === null ? 'без ограничений' : String(value);
}

function usageByMetric(
  usage: Usage,
  metric: Usage['items'][number]['metric'],
): string {
  const item = usage.items.find((candidate) => candidate.metric === metric);
  if (!item) return 'нет данных';
  return `${item.committed + item.reserved} из ${formatLimit(item.limit)}`;
}

export function registerSubscriptionHandlers(
  bot: Bot<Context>,
  backend: BackendClient,
): void {
  bot.command('subscription', async (context) => {
    await showSubscription(context, backend);
  });

  bot.callbackQuery('menu:subscription', async (context) => {
    await context.answerCallbackQuery();
    await showSubscription(context, backend);
  });
}

async function showSubscription(
  context: Context,
  backend: BackendClient,
): Promise<void> {
  try {
    const userId = await resolveUser(context, backend);
    const [subscription, usage] = await Promise.all([
      backend.getSubscription(userId),
      backend.getUsage(userId),
    ]);
    const entitlements = subscription.entitlements;
    const text = [
      `Тариф: ${subscription.planName}`,
      `Статус: ${subscription.status}`,
      '',
      `Каналы: ${formatLimit(entitlements.channelLimit)}`,
      `Темы: ${formatLimit(entitlements.topicLimit)}`,
      `Генерации текста: ${usageByMetric(usage, 'TEXT_GENERATION')}`,
      `Генерации изображений: ${usageByMetric(usage, 'IMAGE_GENERATION')}`,
      `Правки на модерации: ${usageByMetric(usage, 'MODERATION_REVISION')}`,
      '',
      `Изображения: ${entitlements.imageGenerationEnabled ? 'доступны' : 'недоступны'}`,
      `Модерация: ${entitlements.moderationEnabled ? 'доступна' : 'недоступна'}`,
    ].join('\n');

    await context.reply(text, {
      reply_markup: new InlineKeyboard().text('В меню', 'menu:home'),
    });
  } catch (error) {
    await context.reply(backendErrorMessage(error), {
      reply_markup: mainMenuKeyboard(),
    });
  }
}
