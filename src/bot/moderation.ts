import { InlineKeyboard, type Bot, type Context } from 'grammy';

import type { BackendClient, ModerationRequest } from '../backend/client.js';
import { backendErrorMessage, resolveUser, telegramUserId } from './common.js';
import { mainMenuKeyboard } from './menu.js';

type RevisionDraft = { requestId: string; version: number };
const revisionDrafts = new Map<string, RevisionDraft>();

export function clearModerationDrafts(userId: string): void {
  revisionDrafts.delete(userId);
}

export function registerModerationHandlers(
  bot: Bot<Context>,
  backend: BackendClient,
): void {
  bot.command('moderation', async (context) => {
    await showModeration(context, backend);
  });

  bot.callbackQuery('menu:moderation', async (context) => {
    await context.answerCallbackQuery();
    await showModeration(context, backend);
  });

  bot.callbackQuery(/^moderation:approve:([^:]+):(\d+)$/, async (context) => {
    await context.answerCallbackQuery();
    await decide(context, backend, 'approve');
  });

  bot.callbackQuery(/^moderation:reject:([^:]+):(\d+)$/, async (context) => {
    await context.answerCallbackQuery();
    await decide(context, backend, 'reject');
  });

  bot.callbackQuery(/^moderation:revision:([^:]+):(\d+)$/, async (context) => {
    await context.answerCallbackQuery();
    const userId = telegramUserId(context);
    const requestId = context.match[1];
    const version = Number(context.match[2]);
    if (!userId || !requestId || !Number.isSafeInteger(version)) return;
    revisionDrafts.set(userId, { requestId, version });
    await context.reply('Опишите, что изменить в тексте (до 4000 символов).');
  });

  bot.on('message:text', async (context, next) => {
    const userId = telegramUserId(context);
    const draft = userId ? revisionDrafts.get(userId) : undefined;
    if (!userId || !draft) {
      await next();
      return;
    }
    const feedback = context.message.text.trim();
    if (!feedback || feedback.length > 4000) {
      await context.reply(
        'Комментарий должен содержать от 1 до 4000 символов.',
      );
      return;
    }
    try {
      const resolvedUserId = await resolveUser(context, backend);
      const publication = await backend.requestRevision(
        resolvedUserId,
        draft.requestId,
        draft.version,
        feedback,
      );
      revisionDrafts.delete(userId);
      await context.reply(
        `Новая версия запрошена. Статус публикации: ${publication.status}.`,
        {
          reply_markup: mainMenuKeyboard(),
        },
      );
    } catch (error) {
      await context.reply(backendErrorMessage(error));
    }
  });
}

async function showModeration(
  context: Context,
  backend: BackendClient,
): Promise<void> {
  try {
    const userId = await resolveUser(context, backend);
    const requests = await backend.listModeration(userId);
    if (!requests.length) {
      await context.reply('Постов, ожидающих модерации, нет.', {
        reply_markup: mainMenuKeyboard(),
      });
      return;
    }
    for (const request of requests) {
      await context.reply(formatRequest(request), {
        reply_markup: new InlineKeyboard()
          .text(
            'Опубликовать',
            `moderation:approve:${request.id}:${request.version}`,
          )
          .text(
            'Правка',
            `moderation:revision:${request.id}:${request.version}`,
          )
          .row()
          .text(
            'Отклонить',
            `moderation:reject:${request.id}:${request.version}`,
          ),
      });
    }
  } catch (error) {
    await context.reply(backendErrorMessage(error), {
      reply_markup: mainMenuKeyboard(),
    });
  }
}

async function decide(
  context: Context,
  backend: BackendClient,
  action: 'approve' | 'reject',
): Promise<void> {
  const match = context.match;
  if (!match) return;
  const requestId = match[1];
  const version = Number(match[2]);
  if (!requestId || !Number.isSafeInteger(version)) return;
  try {
    const userId = await resolveUser(context, backend);
    const publication =
      action === 'approve'
        ? await backend.approveModeration(userId, requestId, version)
        : await backend.rejectModeration(userId, requestId, version);
    await context.reply(
      action === 'approve'
        ? `Пост одобрен. Статус публикации: ${publication.status}.`
        : 'Пост отклонён и публикация отменена.',
      { reply_markup: mainMenuKeyboard() },
    );
  } catch (error) {
    await context.reply(backendErrorMessage(error));
  }
}

function formatRequest(request: ModerationRequest): string {
  const generatedText = request.postVersion.text || 'Текст ещё не готов.';
  const text =
    generatedText.length > 3800
      ? `${generatedText.slice(0, 3800)}…`
      : generatedText;
  return `Пост на модерации (версия ${request.postVersion.sequence}):\n\n${text}`;
}
