import { InlineKeyboard, type Bot, type Context } from 'grammy';

import type { BackendClient, Channel } from '../backend/client.js';
import { backendErrorMessage, resolveUser, telegramUserId } from './common.js';
import {
  CHANNEL_PICKER_REQUEST_ID,
  mainMenuKeyboard,
  mainReplyKeyboard,
} from './menu.js';
import { renderMenu } from './ui.js';

const channelDrafts = new Set<string>();
const channelEditDrafts = new Map<
  string,
  { channelId: string; version: number }
>();
export function clearChannelDrafts(userId: string): void {
  channelDrafts.delete(userId);
  channelEditDrafts.delete(userId);
}

function channelsKeyboard(channels: Channel[]): InlineKeyboard {
  const keyboard = new InlineKeyboard().text('Добавить канал', 'channels:add');
  for (const channel of channels) {
    keyboard
      .row()
      .text(
        `Изменить: ${channel.title}`,
        `channels:edit:${channel.id}:${channel.version}`,
      )
      .text('Архив', `channels:archive:${channel.id}:${channel.version}`);
    if (channel.status !== 'ACTIVE') {
      keyboard
        .row()
        .text(`Проверить: ${channel.title}`, `channels:verify:${channel.id}`);
    }
  }
  return keyboard.row().text('В меню', 'menu:home');
}

export function registerChannelHandlers(
  bot: Bot<Context>,
  backend: BackendClient,
): void {
  bot.command('channels', async (context) => {
    await showChannels(context, backend);
  });

  bot.callbackQuery('menu:channels', async (context) => {
    await context.answerCallbackQuery();
    await showChannels(context, backend);
  });

  bot.callbackQuery('channels:add', async (context) => {
    await context.answerCallbackQuery();
    const userId = telegramUserId(context);
    if (!userId) {
      await renderMenu(context, 'Не удалось определить пользователя Telegram.');
      return;
    }
    channelDrafts.add(userId);
    await renderMenu(
      context,
      'Нажмите «Добавить канал» и выберите канал, где вы администратор и Autobot уже добавлен администратором. Для отмены используйте /cancel.',
      {
        reply_markup: mainReplyKeyboard(),
      },
    );
  });

  bot.callbackQuery(/^channels:verify:(.+)$/, async (context) => {
    await context.answerCallbackQuery();
    const channelId = context.match[1];
    if (!channelId) return;
    try {
      const userId = await resolveUser(context, backend);
      const channel = await backend.verifyChannel(userId, channelId);
      await renderMenu(
        context,
        `Канал «${channel.title}» проверен: ${channel.status}.`,
        {
          reply_markup: channelsKeyboard([channel]),
        },
      );
    } catch (error) {
      await renderMenu(context, backendErrorMessage(error), {
        reply_markup: mainMenuKeyboard(),
      });
    }
  });

  bot.callbackQuery(/^channels:edit:([^:]+):(\d+)$/, async (context) => {
    await context.answerCallbackQuery();
    const userId = telegramUserId(context);
    const channelId = context.match[1];
    const version = Number(context.match[2]);
    if (!userId || !channelId || !Number.isSafeInteger(version)) return;
    channelEditDrafts.set(userId, { channelId, version });
    await renderMenu(
      context,
      'Отправьте новое название канала (до 255 символов).',
    );
  });

  bot.callbackQuery(/^channels:archive:([^:]+):(\d+)$/, async (context) => {
    await context.answerCallbackQuery();
    const channelId = context.match[1];
    const version = Number(context.match[2]);
    if (!channelId || !Number.isSafeInteger(version)) return;
    try {
      const userId = await resolveUser(context, backend);
      await backend.archiveChannel(userId, channelId, version);
      await renderMenu(context, 'Канал отправлен в архив.', {
        reply_markup: mainMenuKeyboard(),
      });
    } catch (error) {
      await renderMenu(context, backendErrorMessage(error), {
        reply_markup: mainMenuKeyboard(),
      });
    }
  });

  bot.on('message:chat_shared', async (context) => {
    const userId = telegramUserId(context);
    const shared = context.message.chat_shared;
    if (!userId || shared.request_id !== CHANNEL_PICKER_REQUEST_ID) return;
    channelDrafts.add(userId);

    try {
      const resolvedUserId = await resolveUser(context, backend);
      const channel = await backend.createChannel(
        resolvedUserId,
        String(shared.chat_id),
      );
      channelDrafts.delete(userId);
      await renderMenu(
        context,
        `Канал «${channel.title}» добавлен со статусом ${channel.status}.`,
        { reply_markup: channelsKeyboard([channel]) },
      );
    } catch (error) {
      await renderMenu(context, backendErrorMessage(error), {
        reply_markup: mainMenuKeyboard(),
      });
    }
  });

  bot.on('message:text', async (context, next) => {
    const userId = telegramUserId(context);
    const editDraft = userId ? channelEditDrafts.get(userId) : undefined;
    if (userId && editDraft) {
      const title = context.message.text.trim();
      if (!title || title.length > 255) {
        await renderMenu(
          context,
          'Название должно содержать от 1 до 255 символов.',
        );
        return;
      }
      try {
        const resolvedUserId = await resolveUser(context, backend);
        const channel = await backend.updateChannel(
          resolvedUserId,
          editDraft.channelId,
          editDraft.version,
          title,
        );
        channelEditDrafts.delete(userId);
        await renderMenu(
          context,
          `Название канала изменено на «${channel.title}».`,
          {
            reply_markup: mainMenuKeyboard(),
          },
        );
      } catch (error) {
        await renderMenu(context, backendErrorMessage(error), {
          reply_markup: mainMenuKeyboard(),
        });
      }
      return;
    }
    if (!userId || !channelDrafts.has(userId)) {
      await next();
      return;
    }

    const telegramChatId = context.message.text.trim();
    if (!/^-?[1-9]\d*$/.test(telegramChatId)) {
      await renderMenu(
        context,
        'Выберите канал кнопкой «Добавить канал». Для старых клиентов можно отправить числовой ID вида -1001234567890.',
      );
      return;
    }

    try {
      const resolvedUserId = await resolveUser(context, backend);
      const channel = await backend.createChannel(
        resolvedUserId,
        telegramChatId,
      );
      channelDrafts.delete(userId);
      await renderMenu(
        context,
        `Канал «${channel.title}» добавлен со статусом ${channel.status}.`,
        {
          reply_markup: channelsKeyboard([channel]),
        },
      );
    } catch (error) {
      await renderMenu(context, backendErrorMessage(error), {
        reply_markup: mainMenuKeyboard(),
      });
    }
  });
}

export async function showChannels(
  context: Context,
  backend: BackendClient,
): Promise<void> {
  try {
    const userId = await resolveUser(context, backend);
    const channels = await backend.listChannels(userId);
    const text = channels.length
      ? ['Ваши каналы:', '', ...channels.map(formatChannel)].join('\n')
      : 'Каналов пока нет. Добавьте канал, где бот является администратором.';
    await renderMenu(context, text, {
      reply_markup: channelsKeyboard(channels),
    });
  } catch (error) {
    await renderMenu(context, backendErrorMessage(error), {
      reply_markup: mainMenuKeyboard(),
    });
  }
}

function formatChannel(channel: Channel): string {
  const username = channel.username ? ` @${channel.username}` : '';
  const title =
    channel.title.length > 80
      ? `${channel.title.slice(0, 79)}…`
      : channel.title;
  return `• ${title}${username} — ${channel.status}`;
}
