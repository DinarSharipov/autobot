import { schedulesKeyboard, formatSchedule } from './views/schedules.js';
import { renderBackendError } from './errors.js';
import type { BotContext } from './context.js';
import { Composer } from 'grammy';

import type { BackendClient } from '../backend/client.js';
import { resolveUser } from './common.js';

import { renderPage } from './ui.js';

export function createScheduleFeature(
  backend: BackendClient,
): Composer<BotContext> {
  const bot = new Composer<BotContext>();
  bot.callbackQuery(
    /^schedules:(pause|resume):([^:]+):(\d+)$/,
    async (context) => {
      await context.answerCallbackQuery();
      const action = context.match[1];
      const scheduleId = context.match[2];
      const version = Number(context.match[3]);
      if (!scheduleId || !Number.isSafeInteger(version)) return;
      try {
        const userId = await resolveUser(context, backend);
        const schedule =
          action === 'pause'
            ? await backend.pauseSchedule(userId, scheduleId, version)
            : await backend.resumeSchedule(userId, scheduleId, version);
        await renderPage(
          context,
          action === 'pause'
            ? context.t('schedules-paused')
            : context.t('schedules-resumed'),
          { reply_markup: schedulesKeyboard(context, [schedule]) },
        );
      } catch (error) {
        await renderBackendError(context, error);
      }
    },
  );

  bot.callbackQuery(/^schedules:cancel:([^:]+):(\d+)$/, async (context) => {
    await context.answerCallbackQuery();
    const scheduleId = context.match[1];
    const version = Number(context.match[2]);
    if (!scheduleId || !Number.isSafeInteger(version)) return;
    try {
      const userId = await resolveUser(context, backend);
      await backend.cancelSchedule(userId, scheduleId, version);
      await renderPage(context, context.t('schedules-cancelled'));
    } catch (error) {
      await renderBackendError(context, error);
    }
  });
  return bot;
}

export async function showSchedules(
  context: BotContext,
  backend: BackendClient,
): Promise<void> {
  try {
    const userId = await resolveUser(context, backend);
    const schedules = await backend.listSchedules(userId);
    const text = schedules.length
      ? [
          context.t('schedules-heading'),
          '',
          ...schedules.map((item) => formatSchedule(context, item)),
        ].join('\n')
      : context.t('schedules-empty');
    await renderPage(context, text, {
      reply_markup: schedulesKeyboard(context, schedules),
    });
  } catch (error) {
    await renderBackendError(context, error);
  }
}
