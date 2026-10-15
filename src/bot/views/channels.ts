import { InlineKeyboard } from 'grammy';
import type { Channel } from '../../backend/client.js';
import type { BotContext } from '../context.js';
import { statusLabel, truncate } from '../format.js';

export function channelsKeyboard(
  context: BotContext,
  channels: Channel[],
): InlineKeyboard {
  const keyboard = new InlineKeyboard().url(
    context.t('channels-connect'),
    `https://t.me/${context.me.username}?startchannel&admin=post_messages`,
  );
  for (const channel of channels) {
    keyboard
      .row()
      .text(
        context.t('action-edit-named', { name: channel.title }),
        `channels:edit:${channel.id}:${channel.version}`,
      )
      .text(
        context.t('action-archive'),
        `channels:archive:${channel.id}:${channel.version}`,
      );
    if (channel.status !== 'ACTIVE') {
      keyboard
        .row()
        .text(
          context.t('action-verify-named', { name: channel.title }),
          `channels:verify:${channel.id}`,
        );
    }
  }
  return keyboard.row().text(context.t('action-home'), 'menu:home');
}

export function formatChannel(context: BotContext, channel: Channel): string {
  return context.t('channels-item', {
    title: truncate(channel.title, 80),
    username: channel.username ? ` @${channel.username}` : '',
    status: statusLabel(context, channel.status),
  });
}
