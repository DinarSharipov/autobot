import { InlineKeyboard } from 'grammy';
import type { Topic } from '../../backend/client.js';
import type { BotContext } from '../context.js';

export function topicsKeyboard(
  context: BotContext,
  topics: Topic[] = [],
): InlineKeyboard {
  const keyboard = new InlineKeyboard().text(
    context.t('action-create-topic'),
    'topics:create',
  );
  for (const topic of topics) {
    keyboard
      .row()
      .text(
        context.t('action-edit-named', { name: topic.name }),
        `topics:edit:${topic.id}:${topic.version}`,
      )
      .text(
        context.t('action-archive'),
        `topics:archive:${topic.id}:${topic.version}`,
      );
  }
  return keyboard.row().text(context.t('action-home'), 'menu:home');
}
