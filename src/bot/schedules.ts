import { type Bot, type Context } from 'grammy';

import type { BackendClient, Schedule } from '../backend/client.js';
import { backendErrorMessage, resolveUser } from './common.js';
import { mainMenuKeyboard } from './menu.js';
import { renderMenu } from './ui.js';

function schedulesKeyboard(
  schedules: Schedule[],
): ReturnType<typeof mainMenuKeyboard> {
  const keyboard = mainMenuKeyboard();
  for (const schedule of schedules) {
    if (schedule.status === 'ACTIVE') {
      keyboard
        .row()
        .text('Пауза', `schedules:pause:${schedule.id}:${schedule.version}`)
        .text(
          'Отменить',
          `schedules:cancel:${schedule.id}:${schedule.version}`,
        );
    } else if (schedule.status === 'PAUSED') {
      keyboard
        .row()
        .text(
          'Возобновить',
          `schedules:resume:${schedule.id}:${schedule.version}`,
        )
        .text(
          'Отменить',
          `schedules:cancel:${schedule.id}:${schedule.version}`,
        );
    }
  }
  return keyboard;
}

export function registerScheduleHandlers(
  bot: Bot<Context>,
  backend: BackendClient,
): void {
  bot.command('schedules', async (context) => {
    await showSchedules(context, backend);
  });

  bot.callbackQuery('menu:schedules', async (context) => {
    await context.answerCallbackQuery();
    await showSchedules(context, backend);
  });

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
        await renderMenu(
          context,
          action === 'pause'
            ? 'Расписание приостановлено.'
            : 'Расписание возобновлено.',
          { reply_markup: schedulesKeyboard([schedule]) },
        );
      } catch (error) {
        await renderMenu(context, backendErrorMessage(error), {
          reply_markup: mainMenuKeyboard(),
        });
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
      await renderMenu(context, 'Расписание отменено.', {
        reply_markup: mainMenuKeyboard(),
      });
    } catch (error) {
      await renderMenu(context, backendErrorMessage(error), {
        reply_markup: mainMenuKeyboard(),
      });
    }
  });
}

async function showSchedules(
  context: Context,
  backend: BackendClient,
): Promise<void> {
  try {
    const userId = await resolveUser(context, backend);
    const schedules = await backend.listSchedules(userId);
    const text = schedules.length
      ? ['Ваше расписание:', '', ...schedules.map(formatSchedule)].join('\n')
      : 'Запланированных публикаций нет.';
    await renderMenu(context, text, {
      reply_markup: schedulesKeyboard(schedules),
    });
  } catch (error) {
    await renderMenu(context, backendErrorMessage(error), {
      reply_markup: mainMenuKeyboard(),
    });
  }
}

function formatSchedule(schedule: Schedule): string {
  return `• ${schedule.nextRunAt ?? schedule.runAt ?? 'без даты'} — ${schedule.status} (пост ${schedule.postId})`;
}
