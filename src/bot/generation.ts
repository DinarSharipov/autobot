import { createHash, randomUUID } from 'node:crypto';
import { Composer, InlineKeyboard } from 'grammy';
import type { BackendClient } from '../backend/client.js';
import type { BotContext } from './context.js';
import { resolveUser } from './common.js';
import { createDraftStore } from './drafts.js';
import { backendErrorMessage } from './errors.js';
import { formatDate, statusLabel } from './format.js';
import { renderPage } from './ui.js';

type Action =
  | { kind: 'next'; cursor: string }
  | {
      kind: 'text' | 'image';
      publicationId: string;
      version: number;
      mediaId?: string;
    };
const actions = createDraftStore<Record<string, Action>>();
const token = (): string => randomUUID().replaceAll('-', '').slice(0, 16);

async function showPublications(
  context: BotContext,
  backend: BackendClient,
  userId: string,
  cursor?: string,
): Promise<void> {
  const page = await backend.listPublications(userId, cursor);
  const keyboard = new InlineKeyboard();
  const lines = page.data.map((publication) => {
    keyboard
      .text(
        context.t('generation-open', { id: publication.id.slice(0, 8) }),
        `generation:open:${publication.id}`,
      )
      .row();
    return context.t('generation-item', {
      id: publication.id.slice(0, 8),
      date: formatDate(context, publication.scheduledFor),
      status: statusLabel(context, publication.status),
    });
  });
  const nextActions: Record<string, Action> = {};
  if (page.page.hasMore && page.page.nextCursor) {
    const next = token();
    nextActions[next] = { kind: 'next', cursor: page.page.nextCursor };
    keyboard.text(context.t('billing-next'), `generation:next:${next}`).row();
  }
  actions.set(userId, nextActions);
  keyboard.text(context.t('section-balance'), 'menu:balance');
  await renderPage(
    context,
    context.t('generation-list', {
      items: lines.length ? lines.join('\n\n') : context.t('billing-empty'),
    }),
    { reply_markup: keyboard },
  );
}

async function showPublication(
  context: BotContext,
  backend: BackendClient,
  userId: string,
  id: string,
): Promise<void> {
  const publication = await backend.getPublication(userId, id);
  const keyboard = new InlineKeyboard();
  const nextActions: Record<string, Action> = {};
  let blocked =
    publication.fundingMode === 'PREPAID' &&
    publication.fundingStatus === 'BLOCKED_FUNDS';
  const addResume = (
    kind: 'text' | 'image',
    mediaId?: string,
    version = publication.version,
  ): void => {
    const value = token();
    nextActions[value] = {
      kind,
      publicationId: id,
      version,
      ...(mediaId ? { mediaId } : {}),
    };
    keyboard
      .text(
        context.t(
          kind === 'text'
            ? 'generation-resume-text'
            : 'generation-resume-image',
        ),
        `generation:resume:${value}`,
      )
      .row();
  };
  if (
    blocked &&
    publication.status === 'PENDING' &&
    publication.errorCode === 'INSUFFICIENT_TEXT_CREDITS'
  )
    addResume('text');
  // A replacement may be blocked while the previously selected image keeps the
  // publication itself funded; inspect operation state rather than only its parent.
  if (
    publication.fundingMode === 'PREPAID' &&
    ['AWAITING_MODERATION', 'AWAITING_MEDIA', 'READY'].includes(
      publication.status,
    )
  ) {
    const media = await backend.listPublicationMedia(userId, id);
    for (const item of media.items) {
      if (item.generationStatus === 'BLOCKED_FUNDS') {
        blocked = true;
        addResume('image', item.id, media.publicationVersion);
      }
    }
  }
  actions.set(userId, nextActions);
  keyboard
    .text(context.t('generation-refresh'), `generation:open:${id}`)
    .row()
    .text(context.t('section-balance'), 'menu:balance')
    .row()
    .text(context.t('generation-publications'), 'generation:list');
  await renderPage(
    context,
    context.t('generation-detail', {
      id,
      status: statusLabel(context, publication.status),
      funding: context.t(
        blocked ? 'generation-blocked' : 'generation-not-blocked',
      ),
    }),
    { reply_markup: keyboard },
  );
}

export function createGenerationFeature(
  backend: BackendClient,
): Composer<BotContext> {
  const feature = new Composer<BotContext>();
  feature.callbackQuery(
    /^generation:(list|open:[0-9a-f-]{36}|next:[0-9a-f]{16}|resume:[0-9a-f]{16})$/,
    async (context) => {
      await context.answerCallbackQuery();
      try {
        const userId = await resolveUser(context, backend);
        const [kind, value] = (context.match[1] ?? '').split(':');
        if (kind === 'list') {
          await showPublications(context, backend, userId);
        } else if (kind === 'open' && value) {
          await showPublication(context, backend, userId, value);
        } else {
          const action = actions.get(userId)?.[value ?? ''];
          if (!action || (kind === 'next') !== (action.kind === 'next')) {
            await renderPage(context, context.t('navigation-stale-page'), {
              reply_markup: new InlineKeyboard().text(
                context.t('generation-publications'),
                'generation:list',
              ),
            });
            return;
          }
          if (action.kind === 'next') {
            await showPublications(context, backend, userId, action.cursor);
            return;
          }
          // Key binds retries to the same approved occurrence/version, never to a new generation.
          const key = createHash('sha256')
            .update(JSON.stringify([userId, action]))
            .digest('hex');
          if (action.kind === 'text') {
            await backend.resumeGeneration(userId, action.publicationId, key);
          } else if (action.mediaId) {
            await backend.resumePublicationMedia(
              userId,
              action.publicationId,
              action.mediaId,
              key,
            );
          }
          await showPublication(context, backend, userId, action.publicationId);
        }
      } catch (error) {
        const keyboard = new InlineKeyboard();
        const data = context.callbackQuery.data;
        if (data) keyboard.text(context.t('checkout-retry'), data).row();
        keyboard
          .text(context.t('generation-publications'), 'generation:list')
          .row()
          .text(context.t('section-balance'), 'menu:balance');
        await renderPage(context, backendErrorMessage(context, error), {
          reply_markup: keyboard,
        });
      }
    },
  );
  return feature;
}
