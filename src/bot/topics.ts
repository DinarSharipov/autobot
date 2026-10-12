import { InlineKeyboard, type Bot, type Context } from 'grammy';

import type { BackendClient, Topic } from '../backend/client.js';
import { backendErrorMessage, resolveUser, telegramUserId } from './common.js';
import { mainMenuKeyboard } from './menu.js';
import { renderMenu } from './ui.js';

type TopicDraft = {
  name: string;
  phase: 'name' | 'prompt';
  startedAt: number;
};

const draftByTelegramUserId = new Map<string, TopicDraft>();
const editDraftByTelegramUserId = new Map<
  string,
  { topicId: string; version: number }
>();
const DRAFT_TTL_MS = 15 * 60 * 1000;

export function clearTopicDrafts(userId: string): void {
  draftByTelegramUserId.delete(userId);
  editDraftByTelegramUserId.delete(userId);
}

function topicsKeyboard(topics: Topic[] = []): InlineKeyboard {
  const keyboard = new InlineKeyboard().text('Создать тему', 'topics:create');
  for (const topic of topics) {
    keyboard
      .row()
      .text(
        `Изменить: ${topic.name}`,
        `topics:edit:${topic.id}:${topic.version}`,
      )
      .text('Архив', `topics:archive:${topic.id}:${topic.version}`);
  }
  return keyboard.row().text('В меню', 'menu:home');
}

export function registerTopicHandlers(
  bot: Bot<Context>,
  backend: BackendClient,
): void {
  bot.command('topics', async (context) => {
    await showTopics(context, backend);
  });

  bot.callbackQuery('menu:topics', async (context) => {
    await context.answerCallbackQuery();
    await showTopics(context, backend);
  });

  bot.callbackQuery('topics:create', async (context) => {
    await context.answerCallbackQuery();
    const userId = telegramUserId(context);
    if (!userId) {
      await renderMenu(context, 'Не удалось определить пользователя Telegram.');
      return;
    }

    draftByTelegramUserId.set(userId, {
      name: '',
      phase: 'name',
      startedAt: Date.now(),
    });
    await renderMenu(
      context,
      'Введите название темы. Чтобы отменить создание, используйте /cancel.',
    );
  });

  bot.callbackQuery(/^topics:edit:([^:]+):(\d+)$/, async (context) => {
    await context.answerCallbackQuery();
    const userId = telegramUserId(context);
    const topicId = context.match[1];
    const version = Number(context.match[2]);
    if (!userId || !topicId || !Number.isSafeInteger(version)) return;
    editDraftByTelegramUserId.set(userId, { topicId, version });
    await renderMenu(
      context,
      'Отправьте новую инструкцию темы (до 20 000 символов).',
    );
  });

  bot.callbackQuery(/^topics:archive:([^:]+):(\d+)$/, async (context) => {
    await context.answerCallbackQuery();
    const topicId = context.match[1];
    const version = Number(context.match[2]);
    if (!topicId || !Number.isSafeInteger(version)) return;
    try {
      const userId = await resolveUser(context, backend);
      await backend.archiveTopic(userId, topicId, version);
      await renderMenu(context, 'Тема отправлена в архив.', {
        reply_markup: mainMenuKeyboard(),
      });
    } catch (error) {
      await renderMenu(context, backendErrorMessage(error), {
        reply_markup: mainMenuKeyboard(),
      });
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
        await renderMenu(
          context,
          'Инструкция должна содержать от 1 до 20 000 символов.',
        );
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
        await renderMenu(
          context,
          `Инструкция темы «${topic.name}» обновлена.`,
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

    const draft = draftByTelegramUserId.get(userId);
    if (!draft) {
      await next();
      return;
    }
    if (Date.now() - draft.startedAt > DRAFT_TTL_MS) {
      draftByTelegramUserId.delete(userId);
      await renderMenu(
        context,
        'Время создания темы истекло. Начните заново через раздел «Темы».',
      );
      return;
    }

    const value = context.message.text.trim();
    if (!value) {
      await renderMenu(context, 'Введите текстовое значение.');
      return;
    }

    if (draft.phase === 'name') {
      if (value.length > 255) {
        await renderMenu(
          context,
          'Название должно содержать не более 255 символов.',
        );
        return;
      }
      draftByTelegramUserId.set(userId, {
        ...draft,
        name: value,
        phase: 'prompt',
      });
      await renderMenu(
        context,
        'Теперь отправьте инструкцию для генерации постов по этой теме.',
      );
      return;
    }

    if (value.length > 20_000) {
      await renderMenu(
        context,
        'Инструкция должна содержать не более 20 000 символов.',
      );
      return;
    }

    try {
      const resolvedUserId = await resolveUser(context, backend);
      const topic = await backend.createTopic(resolvedUserId, {
        name: draft.name,
        promptTemplate: value,
      });
      draftByTelegramUserId.delete(userId);
      await renderMenu(context, `Тема «${topic.name}» создана.`, {
        reply_markup: topicsKeyboard([topic]),
      });
    } catch (error) {
      await renderMenu(context, backendErrorMessage(error), {
        reply_markup: mainMenuKeyboard(),
      });
    }
  });
}

export async function showTopics(
  context: Context,
  backend: BackendClient,
): Promise<void> {
  try {
    const userId = await resolveUser(context, backend);
    const topics = await backend.listTopics(userId);
    const text = topics.length
      ? [
          'Ваши темы:',
          '',
          ...topics.map(
            (topic) =>
              `• ${topic.name.length > 80 ? `${topic.name.slice(0, 79)}…` : topic.name}`,
          ),
        ].join('\n')
      : 'У вас пока нет тем. Создайте первую — она будет содержать инструкцию для генерации постов.';
    await renderMenu(context, text, { reply_markup: topicsKeyboard(topics) });
  } catch (error) {
    await renderMenu(context, backendErrorMessage(error), {
      reply_markup: mainMenuKeyboard(),
    });
  }
}
