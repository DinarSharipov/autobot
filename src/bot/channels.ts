import { InlineKeyboard, type Bot, type Context } from 'grammy';

import {
  BackendApiError,
  type BackendClient,
  type Channel,
} from '../backend/client.js';
import { backendErrorMessage, resolveUser, telegramUserId } from './common.js';
import { channelAddLink, mainMenuKeyboard } from './menu.js';
import { renderMenu } from './ui.js';

const channelEditDrafts = new Map<
  string,
  { channelId: string; version: number }
>();
export function clearChannelEditDraft(userId: string): void {
  channelEditDrafts.delete(userId);
}

export function channelsKeyboard(channels: Channel[]): InlineKeyboard {
  const keyboard = new InlineKeyboard().url(
    'Подключить канал',
    channelAddLink(),
  );
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

async function createOrGetChannel(
  backend: BackendClient,
  userId: string,
  telegramChatId: string,
): Promise<Channel> {
  try {
    return await backend.createChannel(userId, telegramChatId);
  } catch (error) {
    if (
      !(error instanceof BackendApiError) ||
      error.code !== 'CHANNEL_ALREADY_LINKED'
    ) {
      throw error;
    }

    const existing = (await backend.listChannels(userId)).find(
      (channel) => channel.telegramChatId === telegramChatId,
    );
    if (!existing) throw error;
    return existing;
  }
}

async function notifyUser(
  context: Context,
  userId: number,
  text: string,
  replyMarkup?: InlineKeyboard,
): Promise<void> {
  try {
    await context.api.sendMessage(userId, text, {
      ...(replyMarkup ? { reply_markup: replyMarkup } : {}),
    });
  } catch {
    // The user may not have opened a private chat with the bot yet.
  }
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

  bot.on('my_chat_member', async (context) => {
    const update = context.myChatMember;
    if (!update || update.chat.type !== 'channel') return;

    const newMember = update.new_chat_member;
    const canPost =
      newMember.status === 'creator' ||
      (newMember.status === 'administrator' &&
        newMember.can_post_messages === true);
    if (!canPost) return;

    try {
      const userId = await resolveUser(context, backend);
      const channel = await createOrGetChannel(
        backend,
        userId,
        String(update.chat.id),
      );
      await notifyUser(
        context,
        update.from.id,
        `Канал «${channel.title}» подключён со статусом ${channel.status}.`,
        channelsKeyboard([channel]),
      );
    } catch (error) {
      await notifyUser(context, update.from.id, backendErrorMessage(error));
    }
  });

  bot.on('message', async (context, next) => {
    const origin = context.message.forward_origin;
    if (!origin || origin.type !== 'channel' || !context.from) {
      await next();
      return;
    }

    try {
      const userId = await resolveUser(context, backend);
      const channel = await createOrGetChannel(
        backend,
        userId,
        String(origin.chat.id),
      );
      await renderMenu(
        context,
        `Канал «${channel.title}» подключён со статусом ${channel.status}.`,
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

    await next();
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
      : 'Каналов пока нет. Нажмите «Подключить канал» и добавьте бота администратором с правом публикации сообщений.';
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
