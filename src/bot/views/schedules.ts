import type { Schedule } from '../../backend/client.js';
import type { BotContext } from '../context.js';
import { formatDate, statusLabel } from '../format.js';
import { pageNavigationKeyboard } from '../keyboards.js';

export function schedulesKeyboard(
  context: BotContext,
  schedules: Schedule[],
): ReturnType<typeof pageNavigationKeyboard> {
  const keyboard = pageNavigationKeyboard(context);
  for (const schedule of schedules) {
    if (schedule.status === 'ACTIVE') {
      keyboard
        .row()
        .text(
          context.t('action-pause'),
          `schedules:pause:${schedule.id}:${schedule.version}`,
        )
        .text(
          context.t('action-cancel'),
          `schedules:cancel:${schedule.id}:${schedule.version}`,
        );
    } else if (schedule.status === 'PAUSED') {
      keyboard
        .row()
        .text(
          context.t('action-resume'),
          `schedules:resume:${schedule.id}:${schedule.version}`,
        )
        .text(
          context.t('action-cancel'),
          `schedules:cancel:${schedule.id}:${schedule.version}`,
        );
    }
  }
  return keyboard;
}

export function formatSchedule(
  context: BotContext,
  schedule: Schedule,
): string {
  return context.t('schedules-item', {
    date: formatDate(context, schedule.nextRunAt ?? schedule.runAt),
    status: statusLabel(context, schedule.status),
    postId: schedule.postId,
  });
}
