import { formatRequest } from './views/moderation.js';
import { renderBackendError } from './errors.js';
import type { BotContext } from './context.js';
import { InlineKeyboard, Composer } from 'grammy';
import { randomUUID } from 'node:crypto';

import { BackendApiError, type BackendClient } from '../backend/client.js';
import { resolveUser, telegramUserId } from './common.js';
import { renderPage } from './ui.js';
import { statusLabel } from './format.js';
import { createDraftStore } from './drafts.js';

type RevisionDraft = {
  token: string;
  requestId: string;
  version: number;
  publicationId: string;
  costConfirmationId: string;
  idempotencyKey: string;
};
const revisionDrafts = createDraftStore<RevisionDraft>();
type MediaAction =
  | { kind: 'cost'; publicationId: string; expectedVersion: number }
  | {
      kind: 'confirm';
      publicationId: string;
      version: number;
      costConfirmationId: string;
    }
  | { kind: 'select'; publicationId: string; mediaId: string; version: number };
const mediaDrafts = createDraftStore<Record<string, MediaAction>>();

function mediaToken(): string {
  return randomUUID().replaceAll('-', '').slice(0, 16);
}

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
    try {
      const resolvedUserId = await resolveUser(context, backend);
      const request = (await backend.listModeration(resolvedUserId)).find(
        (item) => item.id === requestId,
      );
      if (!request || request.version !== version) {
        await renderPage(context, context.t('error-stale-resource'));
        return;
      }
      const preview = await backend.previewRevisionCost(
        resolvedUserId,
        request.publicationId,
      );
      if (
        preview.moderationRequestId !== requestId ||
        preview.moderationVersion !== version
      ) {
        await renderPage(context, context.t('error-stale-resource'));
        return;
      }
      const token = mediaToken();
      revisionDrafts.set(userId, {
        token,
        requestId,
        version,
        publicationId: preview.publicationId,
        costConfirmationId: preview.costConfirmationId,
        idempotencyKey: randomUUID(),
      });
      const costMessage = preview.units
        ? context.t('moderation-paid-cost', {
            units: preview.units,
            available: preview.available,
          })
        : context.t('moderation-included-cost', {
            included: preview.includedRemaining,
          });
      await renderPage(context, costMessage, {
        reply_markup: new InlineKeyboard().text(
          context.t('moderation-continue'),
          `moderation:continue:${token}`,
        ),
      });
    } catch (error) {
      await renderBackendError(context, error);
    }
  });

  bot.callbackQuery(/^moderation:continue:([0-9a-f]{16})$/, async (context) => {
    await context.answerCallbackQuery();
    const userId = telegramUserId(context);
    const draft = userId ? revisionDrafts.get(userId) : undefined;
    if (!userId || !draft || draft.token !== context.match[1]) {
      if (userId) revisionDrafts.delete(userId);
      await renderPage(context, context.t('navigation-stale-page'));
      return;
    }
    await renderPage(context, context.t('moderation-ask-feedback'));
  });

  bot.callbackQuery(/^moderation:media:([0-9a-f-]{36})$/, async (context) => {
    await context.answerCallbackQuery();
    try {
      const userId = await resolveUser(context, backend);
      const media = await backend.listPublicationMedia(
        userId,
        context.match[1] ?? '',
      );
      const actions: Record<string, MediaAction> = {};
      const costToken = mediaToken();
      actions[costToken] = {
        kind: 'cost',
        publicationId: media.publicationId,
        expectedVersion: media.publicationVersion,
      };
      const keyboard = new InlineKeyboard().text(
        context.t('moderation-generate-image'),
        `moderation:media-cost:${costToken}`,
      );
      for (const item of media.items) {
        const token = mediaToken();
        actions[token] = {
          kind: 'select',
          publicationId: media.publicationId,
          mediaId: item.id,
          version: media.publicationVersion,
        };
        keyboard.row().text(
          context.t('moderation-select-image', {
            status: context.t(
              item.generationStatus === 'BLOCKED_FUNDS'
                ? 'moderation-image-blocked'
                : item.status === 'SELECTED'
                  ? 'moderation-image-selected'
                  : item.generationStatus === 'READY'
                    ? 'moderation-image-ready'
                    : 'moderation-image-pending',
            ),
          }),
          `moderation:media-select:${token}`,
        );
      }
      mediaDrafts.set(context.from.id.toString(), actions);
      await renderPage(
        context,
        context.t('moderation-media-page', {
          count: media.items.length,
          selected: media.selectedMediaId
            ? context.t('moderation-image-selected')
            : context.t('moderation-no-image'),
        }),
        { reply_markup: keyboard },
      );
    } catch (error) {
      await renderBackendError(context, error);
    }
  });

  bot.callbackQuery(
    /^moderation:media-cost:([0-9a-f]{16})$/,
    async (context) => {
      await context.answerCallbackQuery();
      try {
        const owner = context.from.id.toString();
        const actions = mediaDrafts.get(owner);
        const action = actions?.[context.match[1] ?? ''];
        if (!action || action.kind !== 'cost') {
          await renderPage(context, context.t('navigation-stale-page'));
          return;
        }
        const userId = await resolveUser(context, backend);
        const publicationId = action.publicationId;
        const quote = await backend.previewMediaCost(userId, publicationId);
        if (quote.publicationVersion !== action.expectedVersion) {
          mediaDrafts.delete(owner);
          await renderPage(context, context.t('error-stale-resource'));
          return;
        }
        const token = mediaToken();
        actions[token] = {
          kind: 'confirm',
          publicationId,
          version: quote.publicationVersion,
          costConfirmationId: quote.costConfirmationId,
        };
        mediaDrafts.set(owner, actions);
        const keyboard = new InlineKeyboard().text(
          context.t('moderation-confirm-image'),
          `moderation:media-confirm:${token}`,
        );
        await renderPage(
          context,
          context.t('moderation-image-cost', {
            units: 1,
            available: quote.available,
          }),
          { reply_markup: keyboard },
        );
      } catch (error) {
        await renderBackendError(context, error);
      }
    },
  );

  bot.callbackQuery(
    /^moderation:media-confirm:([0-9a-f]{16})$/,
    async (context) => {
      await context.answerCallbackQuery();
      try {
        const owner = context.from.id.toString();
        const action = mediaDrafts.get(owner)?.[context.match[1] ?? ''];
        if (!action || action.kind !== 'confirm') {
          await renderPage(context, context.t('navigation-stale-page'));
          return;
        }
        const userId = await resolveUser(context, backend);
        await backend.requestPublicationMedia(
          userId,
          action.publicationId,
          action.version,
          action.costConfirmationId,
        );
        mediaDrafts.delete(owner);
        await renderPage(context, context.t('moderation-image-requested'));
      } catch (error) {
        await renderBackendError(context, error);
      }
    },
  );

  bot.callbackQuery(
    /^moderation:media-select:([0-9a-f]{16})$/,
    async (context) => {
      await context.answerCallbackQuery();
      try {
        const owner = context.from.id.toString();
        const action = mediaDrafts.get(owner)?.[context.match[1] ?? ''];
        if (!action || action.kind !== 'select') {
          await renderPage(context, context.t('navigation-stale-page'));
          return;
        }
        const userId = await resolveUser(context, backend);
        await backend.selectPublicationMedia(
          userId,
          action.publicationId,
          action.mediaId,
          action.version,
        );
        mediaDrafts.delete(owner);
        await renderPage(
          context,
          context.t('moderation-image-selected-result'),
        );
      } catch (error) {
        await renderBackendError(context, error);
      }
    },
  );

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
        draft.costConfirmationId,
        draft.idempotencyKey,
      );
      revisionDrafts.delete(userId);
      await renderPage(
        context,
        context.t('moderation-revision-requested', {
          status: statusLabel(context, publication.status),
        }),
      );
    } catch (error) {
      if (
        error instanceof BackendApiError &&
        ['STALE_COST_CONFIRMATION', 'COST_CONFIRMATION_REQUIRED'].includes(
          error.code,
        )
      ) {
        revisionDrafts.delete(userId);
      }
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
        );
      keyboard
        .row()
        .text(
          context.t('moderation-images'),
          `moderation:media:${request.publicationId}`,
        );
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
