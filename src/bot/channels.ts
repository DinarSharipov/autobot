import { channelsKeyboard, formatChannel } from './views/channels.js';
import { renderBackendError, backendErrorMessage } from './errors.js';
import type { BotContext } from './context.js';
import { InlineKeyboard, Composer } from 'grammy';

import {
  BackendApiError,
  type BackendClient,
  type Channel,
} from '../backend/client.js';
import { resolveUser, telegramUserId } from './common.js';
import { statusLabel } from './format.js';
import { renderPage } from './ui.js';
import { createDraftStore } from './drafts.js';

const channelEditDrafts = createDraftStore<{
  channelId: string;
  version: number;
}>();

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
  context: BotContext,
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

export function createChannelFeature(
  backend: BackendClient,
): Composer<BotContext> {
  const bot = new Composer<BotContext>();
  bot.callbackQuery(/^channels:verify:(.+)$/, async (context) => {
    await context.answerCallbackQuery();
    const channelId = context.match[1];
    if (!channelId) return;
    try {
      const userId = await resolveUser(context, backend);
      const channel = await backend.verifyChannel(userId, channelId);
      await renderPage(
        context,
        context.t('channels-verified', {
          title: channel.title,
          status: statusLabel(context, channel.status),
        }),
        {
          reply_markup: channelsKeyboard(context, [channel]),
        },
      );
    } catch (error) {
      await renderBackendError(context, error);
    }
  });

  bot.callbackQuery(/^channels:edit:([^:]+):(\d+)$/, async (context) => {
    await context.answerCallbackQuery();
    const userId = telegramUserId(context);
    const channelId = context.match[1];
    const version = Number(context.match[2]);
    if (!userId || !channelId || !Number.isSafeInteger(version)) return;
    channelEditDrafts.set(userId, { channelId, version });
    await renderPage(context, context.t('channels-ask-title'));
  });

  bot.callbackQuery(/^channels:archive:([^:]+):(\d+)$/, async (context) => {
    await context.answerCallbackQuery();
    const channelId = context.match[1];
    const version = Number(context.match[2]);
    if (!channelId || !Number.isSafeInteger(version)) return;
    try {
      const userId = await resolveUser(context, backend);
      await backend.archiveChannel(userId, channelId, version);
      await renderPage(context, context.t('channels-archived'));
    } catch (error) {
      await renderBackendError(context, error);
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
        context.t('channels-connected', {
          title: channel.title,
          status: statusLabel(context, channel.status),
        }),
        new InlineKeyboard().text(context.t('channels-open'), 'menu:channels'),
      );
    } catch (error) {
      await notifyUser(
        context,
        update.from.id,
        backendErrorMessage(context, error),
      );
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
      await renderPage(
        context,
        context.t('channels-connected', {
          title: channel.title,
          status: statusLabel(context, channel.status),
        }),
        { reply_markup: channelsKeyboard(context, [channel]) },
      );
    } catch (error) {
      await renderBackendError(context, error);
    }
  });

  bot.on('message:text', async (context, next) => {
    const userId = telegramUserId(context);
    const editDraft = userId ? channelEditDrafts.get(userId) : undefined;
    if (userId && editDraft) {
      const title = context.message.text.trim();
      if (!title || title.length > 255) {
        await renderPage(context, context.t('validation-title'));
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
        await renderPage(
          context,
          context.t('channels-renamed', { title: channel.title }),
        );
      } catch (error) {
        await renderBackendError(context, error);
      }
      return;
    }

    await next();
  });
  return bot;
}

export async function showChannels(
  context: BotContext,
  backend: BackendClient,
): Promise<void> {
  try {
    const userId = await resolveUser(context, backend);
    const channels = await backend.listChannels(userId);
    const text = channels.length
      ? [
          context.t('channels-heading'),
          '',
          ...channels.map((item) => formatChannel(context, item)),
        ].join('\n')
      : context.t('channels-empty');
    await renderPage(context, text, {
      reply_markup: channelsKeyboard(context, channels),
    });
  } catch (error) {
    await renderBackendError(context, error);
  }
}
