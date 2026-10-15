import { topicsKeyboard } from './views/topics.js';
import { renderBackendError } from './errors.js';
import type { BotContext } from './context.js';
import { Composer } from 'grammy';

import type { BackendClient } from '../backend/client.js';
import { resolveUser, telegramUserId } from './common.js';
import { renderPage } from './ui.js';
import { truncate } from './format.js';
import { createDraftStore } from './drafts.js';

type TopicDraft = {
  name: string;
  phase: 'name' | 'prompt';
};

const draftByTelegramUserId = createDraftStore<TopicDraft>();
const editDraftByTelegramUserId = createDraftStore<{
  topicId: string;
  version: number;
}>();

export function createTopicFeature(
  backend: BackendClient,
): Composer<BotContext> {
  const bot = new Composer<BotContext>();
  bot.callbackQuery('topics:create', async (context) => {
    await context.answerCallbackQuery();
    const userId = telegramUserId(context);
    if (!userId) {
      await renderPage(context, context.t('error-telegram-user'));
      return;
    }

    draftByTelegramUserId.set(userId, {
      name: '',
      phase: 'name',
    });
    await renderPage(context, context.t('topics-ask-name'));
  });

  bot.callbackQuery(/^topics:edit:([^:]+):(\d+)$/, async (context) => {
    await context.answerCallbackQuery();
    const userId = telegramUserId(context);
    const topicId = context.match[1];
    const version = Number(context.match[2]);
    if (!userId || !topicId || !Number.isSafeInteger(version)) return;
    editDraftByTelegramUserId.set(userId, { topicId, version });
    await renderPage(context, context.t('topics-ask-edit-prompt'));
  });

  bot.callbackQuery(/^topics:archive:([^:]+):(\d+)$/, async (context) => {
    await context.answerCallbackQuery();
    const topicId = context.match[1];
    const version = Number(context.match[2]);
    if (!topicId || !Number.isSafeInteger(version)) return;
    try {
      const userId = await resolveUser(context, backend);
      await backend.archiveTopic(userId, topicId, version);
      await renderPage(context, context.t('topics-archived'));
    } catch (error) {
      await renderBackendError(context, error);
    }
  });

  bot.on('message:text', async (context, next) => {
    const userId = telegramUserId(context);
    if (!userId) {
      await next();
      return;
    }

    const editDraft = editDraftByTelegramUserId.get(userId);
    if (editDraft) {
      const promptTemplate = context.message.text.trim();
      if (!promptTemplate || promptTemplate.length > 20_000) {
        await renderPage(context, context.t('validation-topic-prompt'));
        return;
      }
      try {
        const resolvedUserId = await resolveUser(context, backend);
        const topic = await backend.updateTopic(
          resolvedUserId,
          editDraft.topicId,
          editDraft.version,
          promptTemplate,
        );
        editDraftByTelegramUserId.delete(userId);
        await renderPage(
          context,
          context.t('topics-updated', { name: topic.name }),
        );
      } catch (error) {
        await renderBackendError(context, error);
      }
      return;
    }

    const draft = draftByTelegramUserId.get(userId);
    if (!draft) {
      await next();
      return;
    }

    const value = context.message.text.trim();
    if (!value) {
      await renderPage(context, context.t('validation-text'));
      return;
    }

    if (draft.phase === 'name') {
      if (value.length > 255) {
        await renderPage(context, context.t('validation-name-length'));
        return;
      }
      draftByTelegramUserId.set(userId, {
        ...draft,
        name: value,
        phase: 'prompt',
      });
      await renderPage(context, context.t('topics-ask-prompt'));
      return;
    }

    if (value.length > 20_000) {
      await renderPage(context, context.t('validation-instructions-length'));
      return;
    }

    try {
      const resolvedUserId = await resolveUser(context, backend);
      const topic = await backend.createTopic(resolvedUserId, {
        name: draft.name,
        promptTemplate: value,
      });
      draftByTelegramUserId.delete(userId);
      await renderPage(
        context,
        context.t('topics-created', { name: topic.name }),
        {
          reply_markup: topicsKeyboard(context, [topic]),
        },
      );
    } catch (error) {
      await renderBackendError(context, error);
    }
  });
  return bot;
}

export async function showTopics(
  context: BotContext,
  backend: BackendClient,
): Promise<void> {
  try {
    const userId = await resolveUser(context, backend);
    const topics = await backend.listTopics(userId);
    const text = topics.length
      ? [
          context.t('topics-heading'),
          '',
          ...topics.map((topic) =>
            context.t('topics-item', { name: truncate(topic.name, 80) }),
          ),
        ].join('\n')
      : context.t('topics-empty');
    await renderPage(context, text, {
      reply_markup: topicsKeyboard(context, topics),
    });
  } catch (error) {
    await renderBackendError(context, error);
  }
}
