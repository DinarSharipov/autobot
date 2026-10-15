import { formatRequest } from './views/moderation.js';
import { renderBackendError } from './errors.js';
import type { BotContext } from './context.js';
import { InlineKeyboard, Composer } from 'grammy';

import type { BackendClient } from '../backend/client.js';
import { resolveUser, telegramUserId } from './common.js';
import { renderPage } from './ui.js';
import { statusLabel } from './format.js';
import { createDraftStore } from './drafts.js';

type RevisionDraft = { requestId: string; version: number };
const revisionDrafts = createDraftStore<RevisionDraft>();

export function createModerationFeature(
  backend: BackendClient,
): Composer<BotContext> {
  const bot = new Composer<BotContext>();
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
    await renderPage(context, context.t('moderation-ask-feedback'));
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
      await renderPage(context, context.t('validation-feedback'));
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
      await renderPage(
        context,
        context.t('moderation-revision-requested', {
          status: statusLabel(context, publication.status),
        }),
      );
    } catch (error) {
      await renderBackendError(context, error);
    }
  });
  return bot;
}

export async function showModeration(
  context: BotContext,
  backend: BackendClient,
): Promise<void> {
  try {
    const userId = await resolveUser(context, backend);
    const requests = await backend.listModeration(userId);
    if (!requests.length) {
      await renderPage(context, context.t('moderation-empty'));
      return;
    }
    const keyboard = new InlineKeyboard();
    for (const request of requests) {
      keyboard
        .text(
          context.t('action-publish'),
          `moderation:approve:${request.id}:${request.version}`,
        )
        .text(
          context.t('action-revise'),
          `moderation:revision:${request.id}:${request.version}`,
        )
        .row()
        .text(
          context.t('action-reject'),
          `moderation:reject:${request.id}:${request.version}`,
        )
        .row();
    }
    await renderPage(
      context,
      requests
        .map((item) => formatRequest(context, item))
        .join('\n\n')
        .slice(0, 3900),
      { reply_markup: keyboard },
    );
  } catch (error) {
    await renderBackendError(context, error);
  }
}

async function decide(
  context: BotContext,
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
    await renderPage(
      context,
      action === 'approve'
        ? context.t('moderation-approved', {
            status: statusLabel(context, publication.status),
          })
        : context.t('moderation-rejected'),
    );
  } catch (error) {
    await renderBackendError(context, error);
  }
}
