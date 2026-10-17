import { postsKeyboard, askTopic, formatPost } from './views/posts.js';
import { renderBackendError } from './errors.js';
import type { BotContext } from './context.js';
import { InlineKeyboard, Composer } from 'grammy';

import type { BackendClient, Post } from '../backend/client.js';
import { resolveUser, telegramUserId } from './common.js';
import { renderPage } from './ui.js';
import {
  formatDate,
  statusLabel,
  truncate,
  PUBLICATION_TIMEZONE,
} from './format.js';
import { createDraftStore } from './drafts.js';

type PostTarget = { channelId: string; topicId: string | null };
type PostContent = PostTarget & { prompt: string };
type PostDraft =
  | { phase: 'channel' }
  | { phase: 'topic'; channelId: string }
  | ({ phase: 'prompt' } & PostTarget)
  | ({ phase: 'mode' } & PostContent)
  | ({ phase: 'image'; publicationMode: Post['publicationMode'] } & PostContent)
  | { phase: 'schedule-kind'; postId: string }
  | { phase: 'schedule-once'; postId: string }
  | { phase: 'schedule-frequency'; postId: string }
  | {
      phase: 'schedule-recurring';
      postId: string;
      frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY';
    };

const drafts = createDraftStore<PostDraft>();
const postEditDrafts = createDraftStore<{ postId: string; version: number }>();

const RECURRENCE_WEEKDAYS = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'] as const;

type RecurringFrequency = 'DAILY' | 'WEEKLY' | 'MONTHLY';

function nextRecurringSchedule(
  frequency: RecurringFrequency,
  time: string,
  now = new Date(),
): { runAt: string; rrule: string } {
  const local = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      timeZone: PUBLICATION_TIMEZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    })
      .formatToParts(now)
      .filter(({ type }) => type !== 'literal')
      .map(({ type, value }) => [type, Number(value)]),
  ) as Record<'year' | 'month' | 'day' | 'hour' | 'minute', number>;
  const hour = Number(time.slice(0, 2));
  const minute = Number(time.slice(3, 5));
  const target = new Date(Date.UTC(local.year, local.month - 1, local.day));
  if (hour < local.hour || (hour === local.hour && minute <= local.minute)) {
    target.setUTCDate(target.getUTCDate() + 1);
  }
  const date = target.toISOString().slice(0, 10);
  const weekday = RECURRENCE_WEEKDAYS[target.getUTCDay()];
  const rrule =
    frequency === 'WEEKLY'
      ? `FREQ=WEEKLY;BYDAY=${weekday}`
      : frequency === 'MONTHLY'
        ? `FREQ=MONTHLY;BYMONTHDAY=${target.getUTCDate()}`
        : 'FREQ=DAILY';

  return { runAt: `${date}T${time}:00+03:00`, rrule };
}

async function listActiveChannels(
  backend: BackendClient,
  telegramUserId: string,
): Promise<Awaited<ReturnType<BackendClient['listChannels']>>> {
  const channels = await backend.listChannels(telegramUserId);
  const activeChannels = channels.filter(
    (channel) => channel.status === 'ACTIVE',
  );
  if (activeChannels.length > 0) return activeChannels;

  // A channel connection can become visible shortly after the write commits.
  // Re-read once before showing a potentially misleading empty state.
  await new Promise<void>((resolve) => setTimeout(resolve, 250));
  return (await backend.listChannels(telegramUserId)).filter(
    (channel) => channel.status === 'ACTIVE',
  );
}

export function createPostFeature(
  backend: BackendClient,
): Composer<BotContext> {
  const bot = new Composer<BotContext>();
  bot.callbackQuery('posts:create', async (context) => {
    await context.answerCallbackQuery();
    await showCreatePost(context, backend);
  });

  bot.callbackQuery(/^posts:channel:(.+)$/, async (context) => {
    await context.answerCallbackQuery();
    const userId = telegramUserId(context);
    const channelId = context.match[1];
    if (!userId || !channelId) return;
    const draft = drafts.get(userId);
    if (draft?.phase !== 'channel') {
      await renderPage(context, context.t('posts-flow-expired'));
      return;
    }
    try {
      const resolvedUserId = await resolveUser(context, backend);
      const topics = await backend.listTopics(resolvedUserId);
      drafts.set(userId, { phase: 'topic', channelId });
      await askTopic(context, topics);
    } catch (error) {
      await renderBackendError(context, error);
    }
  });

  bot.callbackQuery(/^posts:topic:(.+)$/, async (context) => {
    await context.answerCallbackQuery();
    const userId = telegramUserId(context);
    const topicId = context.match[1];
    if (!userId || !topicId) return;
    const draft = drafts.get(userId);
    if (draft?.phase !== 'topic') {
      await renderPage(context, context.t('posts-flow-expired'));
      return;
    }
    drafts.set(userId, {
      phase: 'prompt',
      channelId: draft.channelId,
      topicId: topicId === 'none' ? null : topicId,
    });
    await renderPage(context, context.t('posts-ask-prompt'));
  });

  bot.callbackQuery(/^posts:mode:(AUTO|MODERATION)$/, async (context) => {
    await context.answerCallbackQuery();
    const userId = telegramUserId(context);
    if (!userId) return;
    const draft = drafts.get(userId);
    if (draft?.phase !== 'mode') {
      await renderPage(context, context.t('posts-flow-expired'));
      return;
    }
    drafts.set(userId, {
      ...draft,
      phase: 'image',
      publicationMode: context.match[1] === 'AUTO' ? 'AUTO' : 'MODERATION',
    });
    await renderPage(context, context.t('posts-ask-image'), {
      reply_markup: new InlineKeyboard()
        .text(context.t('action-yes'), 'posts:image:yes')
        .text(context.t('action-no'), 'posts:image:no'),
    });
  });

  bot.callbackQuery(/^posts:image:(yes|no)$/, async (context) => {
    await context.answerCallbackQuery();
    const userId = telegramUserId(context);
    if (!userId) return;
    const draft = drafts.get(userId);
    if (draft?.phase !== 'image') {
      await renderPage(context, context.t('posts-flow-expired'));
      return;
    }
    try {
      const resolvedUserId = await resolveUser(context, backend);
      const post = await backend.createPost(resolvedUserId, {
        channelId: draft.channelId,
        topicId: draft.topicId ?? null,
        prompt: draft.prompt,
        generateImage: context.match[1] === 'yes',
        publicationMode: draft.publicationMode,
      });
      drafts.delete(userId);
      await renderPage(
        context,
        context.t('posts-created', { version: post.version }),
        {
          reply_markup: new InlineKeyboard()
            .text(
              context.t('action-publish-now'),
              `posts:publish:${post.id}:${post.version}`,
            )
            .row()
            .text(context.t('action-schedule'), `posts:schedule:${post.id}`)
            .row()
            .text(context.t('action-home'), 'menu:home'),
        },
      );
    } catch (error) {
      await renderBackendError(context, error);
    }
  });

  bot.callbackQuery(/^posts:publish:([^:]+):(\d+)$/, async (context) => {
    await context.answerCallbackQuery();
    const postId = context.match[1];
    const version = Number(context.match[2]);
    if (!postId || !Number.isSafeInteger(version)) return;
    try {
      const userId = await resolveUser(context, backend);
      const publication = await backend.publishPost(userId, postId, version);
      await renderPage(
        context,
        context.t('posts-publication-started', {
          status: statusLabel(context, publication.status),
        }),
      );
    } catch (error) {
      await renderBackendError(context, error);
    }
  });

  bot.callbackQuery(/^posts:versions:(.+)$/, async (context) => {
    await context.answerCallbackQuery();
    const postId = context.match[1];
    if (!postId) return;
    try {
      const userId = await resolveUser(context, backend);
      const versions = await backend.listPostVersions(userId, postId);
      const details = versions.map((version) => {
        const content = version.text || context.t('posts-text-pending');
        return context.t('posts-version-item', {
          version: version.sequence,
          status: statusLabel(context, version.status),
          text: truncate(content, 500),
        });
      });
      const text = versions.length
        ? context
            .t('posts-versions-heading', { versions: details.join('\n\n') })
            .slice(0, 3900)
        : context.t('posts-versions-empty');
      await renderPage(context, text);
    } catch (error) {
      await renderBackendError(context, error);
    }
  });

  bot.callbackQuery(/^posts:edit:([^:]+):(\d+)$/, async (context) => {
    await context.answerCallbackQuery();
    const userId = telegramUserId(context);
    const postId = context.match[1];
    const version = Number(context.match[2]);
    if (!userId || !postId || !Number.isSafeInteger(version)) return;
    postEditDrafts.set(userId, { postId, version });
    await renderPage(context, context.t('posts-ask-edit-prompt'));
  });

  bot.callbackQuery(/^posts:archive:([^:]+):(\d+)$/, async (context) => {
    await context.answerCallbackQuery();
    const postId = context.match[1];
    const version = Number(context.match[2]);
    if (!postId || !Number.isSafeInteger(version)) return;
    try {
      const userId = await resolveUser(context, backend);
      await backend.archivePost(userId, postId, version);
      await renderPage(context, context.t('posts-archived'));
    } catch (error) {
      await renderBackendError(context, error);
    }
  });

  bot.callbackQuery(/^posts:schedule:(.+)$/, async (context) => {
    await context.answerCallbackQuery();
    const userId = telegramUserId(context);
    const postId = context.match[1];
    if (!userId || !postId) return;
    drafts.set(userId, { phase: 'schedule-kind', postId });
    await renderPage(context, context.t('posts-ask-schedule-kind'), {
      reply_markup: new InlineKeyboard()
        .text(context.t('action-schedule-once'), 'posts:schedule-kind:once')
        .row()
        .text(
          context.t('action-schedule-recurring'),
          'posts:schedule-kind:recurring',
        ),
    });
  });

  bot.callbackQuery(
    /^posts:schedule-kind:(once|recurring)$/,
    async (context) => {
      await context.answerCallbackQuery();
      const userId = telegramUserId(context);
      if (!userId) return;
      const draft = drafts.get(userId);
      if (draft?.phase !== 'schedule-kind') {
        await renderPage(context, context.t('posts-flow-expired'));
        return;
      }
      const isRecurring = context.match[1] === 'recurring';
      if (!isRecurring) {
        drafts.set(userId, { phase: 'schedule-once', postId: draft.postId });
        await renderPage(context, context.t('posts-ask-date'));
        return;
      }
      drafts.set(userId, { phase: 'schedule-frequency', postId: draft.postId });
      await renderPage(context, context.t('posts-ask-frequency'), {
        reply_markup: new InlineKeyboard()
          .text(context.t('frequency-daily'), 'posts:frequency:DAILY')
          .row()
          .text(context.t('frequency-weekly'), 'posts:frequency:WEEKLY')
          .row()
          .text(context.t('frequency-monthly'), 'posts:frequency:MONTHLY'),
      });
    },
  );

  bot.callbackQuery(
    /^posts:frequency:(DAILY|WEEKLY|MONTHLY)$/,
    async (context) => {
      await context.answerCallbackQuery();
      const userId = telegramUserId(context);
      if (!userId) return;
      const draft = drafts.get(userId);
      if (draft?.phase !== 'schedule-frequency') {
        await renderPage(context, context.t('posts-flow-expired'));
        return;
      }
      drafts.set(userId, {
        phase: 'schedule-recurring',
        postId: draft.postId,
        frequency: context.match[1] as 'DAILY' | 'WEEKLY' | 'MONTHLY',
      });
      await renderPage(context, context.t('posts-ask-time'));
    },
  );

  bot.on('message:text', async (context, next) => {
    const userId = telegramUserId(context);
    const draft = userId ? drafts.get(userId) : undefined;
    const editDraft = userId ? postEditDrafts.get(userId) : undefined;
    if (userId && editDraft) {
      const prompt = context.message.text.trim();
      if (!prompt || prompt.length > 20_000) {
        await renderPage(context, context.t('validation-prompt'));
        return;
      }
      try {
        const resolvedUserId = await resolveUser(context, backend);
        await backend.updatePost(
          resolvedUserId,
          editDraft.postId,
          editDraft.version,
          { prompt },
        );
        postEditDrafts.delete(userId);
        await renderPage(context, context.t('posts-prompt-updated'));
      } catch (error) {
        await renderBackendError(context, error);
      }
      return;
    }
    if (!userId || !draft) {
      await next();
      return;
    }

    const value = context.message.text.trim();
    if (draft.phase === 'prompt') {
      if (!value || value.length > 20_000) {
        await renderPage(context, context.t('validation-post-request'));
        return;
      }
      drafts.set(userId, { ...draft, prompt: value, phase: 'mode' });
      await renderPage(context, context.t('posts-ask-mode'), {
        reply_markup: new InlineKeyboard()
          .text(context.t('mode-auto'), 'posts:mode:AUTO')
          .row()
          .text(context.t('mode-moderation'), 'posts:mode:MODERATION'),
      });
      return;
    }

    if (draft.phase === 'schedule-once') {
      const runAt = new Date(value);
      if (
        Number.isNaN(runAt.getTime()) ||
        !/[zZ]|[+-]\d{2}:?\d{2}$/.test(value)
      ) {
        await renderPage(context, context.t('validation-date'));
        return;
      }
      if (runAt.getTime() <= Date.now()) {
        await renderPage(context, context.t('validation-date-future'));
        return;
      }
      try {
        const resolvedUserId = await resolveUser(context, backend);
        const schedule = await backend.createOneTimeSchedule(resolvedUserId, {
          postId: draft.postId,
          runAt: value,
          timezone: PUBLICATION_TIMEZONE,
        });
        drafts.delete(userId);
        await renderPage(
          context,
          context.t('posts-scheduled', {
            date: formatDate(context, schedule.runAt ?? value),
          }),
        );
      } catch (error) {
        await renderBackendError(context, error);
      }
    }

    if (draft.phase === 'schedule-recurring') {
      const match = /^(?:[01]\d|2[0-3]):[0-5]\d$/.exec(value);
      if (!match) {
        await renderPage(context, context.t('validation-time'));
        return;
      }
      const { runAt, rrule } = nextRecurringSchedule(draft.frequency, value);
      try {
        const resolvedUserId = await resolveUser(context, backend);
        await backend.createRecurringSchedule(resolvedUserId, {
          postId: draft.postId,
          rrule,
          timezone: PUBLICATION_TIMEZONE,
          runAt,
        });
        drafts.delete(userId);
        await renderPage(
          context,
          context.t('posts-recurring-scheduled', {
            frequency: context.t(`frequency-${draft.frequency.toLowerCase()}`),
            time: value,
          }),
        );
      } catch (error) {
        await renderBackendError(context, error);
      }
    }
  });
  return bot;
}

export async function showCreatePost(
  context: BotContext,
  backend: BackendClient,
): Promise<void> {
  const userId = telegramUserId(context);
  if (!userId) {
    await renderPage(context, context.t('error-telegram-user'));
    return;
  }
  try {
    const resolvedUserId = await resolveUser(context, backend);
    const channels = await listActiveChannels(backend, resolvedUserId);
    if (!channels.length) {
      await renderPage(context, context.t('posts-channel-required'));
      return;
    }
    drafts.set(userId, { phase: 'channel' });
    const keyboard = new InlineKeyboard();
    for (const channel of channels) {
      keyboard.text(channel.title, `posts:channel:${channel.id}`).row();
    }
    await renderPage(context, context.t('posts-ask-channel'), {
      reply_markup: keyboard,
    });
  } catch (error) {
    await renderBackendError(context, error);
  }
}

export async function showPosts(
  context: BotContext,
  backend: BackendClient,
): Promise<void> {
  try {
    const userId = await resolveUser(context, backend);
    const posts = await backend.listPosts(userId);
    const text = posts.length
      ? [
          context.t('posts-heading'),
          '',
          ...posts.map((item) => formatPost(context, item)),
        ].join('\n')
      : context.t('posts-empty');
    await renderPage(context, text, {
      reply_markup: postsKeyboard(context, posts),
    });
  } catch (error) {
    await renderBackendError(context, error);
  }
}
