import { InlineKeyboard, type Bot, type Context } from 'grammy';

import type { BackendClient } from '../backend/client.js';
import { backendErrorMessage, resolveUser, telegramUserId } from './common.js';
import { mainMenuKeyboard } from './menu.js';

type TopicDraft = {
  name: string;
  phase: 'name' | 'prompt';
  startedAt: number;
};

const draftByTelegramUserId = new Map<string, TopicDraft>();
const DRAFT_TTL_MS = 15 * 60 * 1000;

function topicsKeyboard(): InlineKeyboard {
  return new InlineKeyboard()
    .text('Создать тему', 'topics:create')
    .row()
    .text('В меню', 'menu:home');
}

export function registerTopicHandlers(
  bot: Bot<Context>,
  backend: BackendClient,
): void {
  bot.command('topics', async (context) => {
    await showTopics(context, backend);
  });

  bot.command('cancel', async (context) => {
    const userId = telegramUserId(context);
    if (userId) draftByTelegramUserId.delete(userId);
    await context.reply('Создание темы отменено.', {
      reply_markup: mainMenuKeyboard(),
    });
  });

  bot.callbackQuery('menu:topics', async (context) => {
    await context.answerCallbackQuery();
    await showTopics(context, backend);
  });

  bot.callbackQuery('topics:create', async (context) => {
    await context.answerCallbackQuery();
    const userId = telegramUserId(context);
    if (!userId) {
      await context.reply('Не удалось определить пользователя Telegram.');
      return;
    }

    draftByTelegramUserId.set(userId, {
      name: '',
      phase: 'name',
      startedAt: Date.now(),
    });
    await context.reply(
      'Введите название темы. Чтобы отменить создание, используйте /cancel.',
    );
  });

  bot.on('message:text', async (context) => {
    const userId = telegramUserId(context);
    if (!userId) return;

    const draft = draftByTelegramUserId.get(userId);
    if (!draft) return;
    if (Date.now() - draft.startedAt > DRAFT_TTL_MS) {
      draftByTelegramUserId.delete(userId);
      await context.reply(
        'Время создания темы истекло. Начните заново через раздел «Темы».',
      );
      return;
    }

    const value = context.message.text.trim();
    if (!value) {
      await context.reply('Введите текстовое значение.');
      return;
    }

    if (draft.phase === 'name') {
      if (value.length > 255) {
        await context.reply('Название должно содержать не более 255 символов.');
        return;
      }
      draftByTelegramUserId.set(userId, {
        ...draft,
        name: value,
        phase: 'prompt',
      });
      await context.reply(
        'Теперь отправьте инструкцию для генерации постов по этой теме.',
      );
      return;
    }

    if (value.length > 20_000) {
      await context.reply(
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
      await context.reply(`Тема «${topic.name}» создана.`, {
        reply_markup: topicsKeyboard(),
      });
    } catch (error) {
      await context.reply(backendErrorMessage(error));
    }
  });
}

async function showTopics(
  context: Context,
  backend: BackendClient,
): Promise<void> {
  try {
    const userId = await resolveUser(context, backend);
    const topics = await backend.listTopics(userId);
    const text = topics.length
      ? ['Ваши темы:', '', ...topics.map((topic) => `• ${topic.name}`)].join(
          '\n',
        )
      : 'У вас пока нет тем. Создайте первую — она будет содержать инструкцию для генерации постов.';
    await context.reply(text, { reply_markup: topicsKeyboard() });
  } catch (error) {
    await context.reply(backendErrorMessage(error), {
      reply_markup: mainMenuKeyboard(),
    });
  }
}
