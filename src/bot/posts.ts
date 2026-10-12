import { InlineKeyboard, type Bot, type Context } from 'grammy';

import type { BackendClient, Post, Topic } from '../backend/client.js';
import { backendErrorMessage, resolveUser, telegramUserId } from './common.js';
import { mainMenuKeyboard } from './menu.js';
import { renderMenu } from './ui.js';

type PostDraft = {
  channelId: string;
  phase: 'image' | 'mode' | 'prompt' | 'schedule' | 'topic';
  postId?: string;
  prompt?: string;
  publicationMode?: Post['publicationMode'];
  topicId?: string | null;
};

const drafts = new Map<string, PostDraft>();
const postEditDrafts = new Map<string, { postId: string; version: number }>();

export function clearPostDrafts(userId: string): void {
  drafts.delete(userId);
  postEditDrafts.delete(userId);
}

function postsKeyboard(posts: Post[]): InlineKeyboard {
  const keyboard = new InlineKeyboard().text('Создать пост', 'posts:create');
  for (const post of posts) {
    keyboard
      .row()
      .text('Опубликовать', `posts:publish:${post.id}:${post.version}`)
      .text('Версии', `posts:versions:${post.id}`)
      .row()
      .text('Изменить prompt', `posts:edit:${post.id}:${post.version}`)
      .text('Архив', `posts:archive:${post.id}:${post.version}`);
  }
  return keyboard.row().text('В меню', 'menu:home');
}

export function registerPostHandlers(
  bot: Bot<Context>,
  backend: BackendClient,
): void {
  bot.command('posts', async (context) => {
    await showPosts(context, backend);
  });

  bot.command('createpost', async (context) => {
    await beginPost(context, backend);
  });

  bot.callbackQuery('menu:posts', async (context) => {
    await context.answerCallbackQuery();
    await showPosts(context, backend);
  });

  bot.callbackQuery('posts:create', async (context) => {
    await context.answerCallbackQuery();
    await beginPost(context, backend);
  });

  bot.callbackQuery(/^posts:channel:(.+)$/, async (context) => {
    await context.answerCallbackQuery();
    const userId = telegramUserId(context);
    const channelId = context.match[1];
    if (!userId || !channelId) return;
    const draft = drafts.get(userId);
    if (!draft) {
      await renderMenu(
        context,
        'Сценарий создания поста устарел. Начните заново через /createpost.',
      );
      return;
    }
    draft.channelId = channelId;
    draft.phase = 'topic';
    try {
      const resolvedUserId = await resolveUser(context, backend);
      const topics = await backend.listTopics(resolvedUserId);
      await askTopic(context, topics);
    } catch (error) {
      await renderMenu(context, backendErrorMessage(error), {
        reply_markup: mainMenuKeyboard(),
      });
    }
  });

  bot.callbackQuery(/^posts:topic:(.+)$/, async (context) => {
    await context.answerCallbackQuery();
    const userId = telegramUserId(context);
    const topicId = context.match[1];
    if (!userId || !topicId) return;
    const draft = drafts.get(userId);
    if (!draft) return;
    draft.topicId = topicId === 'none' ? null : topicId;
    draft.phase = 'prompt';
    await renderMenu(
      context,
      'Опишите, какой текст нужно подготовить для публикации.',
    );
  });

  bot.callbackQuery(/^posts:mode:(AUTO|MODERATION)$/, async (context) => {
    await context.answerCallbackQuery();
    const userId = telegramUserId(context);
    if (!userId) return;
    const draft = drafts.get(userId);
    if (!draft) return;
    draft.publicationMode = context.match[1] as Post['publicationMode'];
    draft.phase = 'image';
    await renderMenu(context, 'Добавлять изображение к публикации?', {
      reply_markup: new InlineKeyboard()
        .text('Да', 'posts:image:yes')
        .text('Нет', 'posts:image:no'),
    });
  });

  bot.callbackQuery(/^posts:image:(yes|no)$/, async (context) => {
    await context.answerCallbackQuery();
    const userId = telegramUserId(context);
    if (!userId) return;
    const draft = drafts.get(userId);
    if (!draft?.prompt || !draft.publicationMode) return;
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
      await renderMenu(
        context,
        `Пост создан (версия ${post.version}). Что сделать дальше?`,
        {
          reply_markup: new InlineKeyboard()
            .text(
              'Опубликовать сейчас',
              `posts:publish:${post.id}:${post.version}`,
            )
            .row()
            .text('Запланировать', `posts:schedule:${post.id}`)
            .row()
            .text('В меню', 'menu:home'),
        },
      );
    } catch (error) {
      await renderMenu(context, backendErrorMessage(error), {
        reply_markup: mainMenuKeyboard(),
      });
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
      await renderMenu(
        context,
        `Публикация запущена. Статус: ${publication.status}.`,
        {
          reply_markup: mainMenuKeyboard(),
        },
      );
    } catch (error) {
      await renderMenu(context, backendErrorMessage(error), {
        reply_markup: mainMenuKeyboard(),
      });
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
        const content = version.text || 'Текст ещё не сгенерирован.';
        return `• #${version.sequence} — ${version.status}\n${content.slice(0, 500)}`;
      });
      const text = versions.length
        ? `История версий:\n\n${details.join('\n\n')}`.slice(0, 3900)
        : 'Версий пока нет.';
      await renderMenu(context, text, { reply_markup: mainMenuKeyboard() });
    } catch (error) {
      await renderMenu(context, backendErrorMessage(error), {
        reply_markup: mainMenuKeyboard(),
      });
    }
  });

  bot.callbackQuery(/^posts:edit:([^:]+):(\d+)$/, async (context) => {
    await context.answerCallbackQuery();
    const userId = telegramUserId(context);
    const postId = context.match[1];
    const version = Number(context.match[2]);
    if (!userId || !postId || !Number.isSafeInteger(version)) return;
    postEditDrafts.set(userId, { postId, version });
    await renderMenu(
      context,
      'Отправьте новый prompt поста (до 20 000 символов).',
    );
  });

  bot.callbackQuery(/^posts:archive:([^:]+):(\d+)$/, async (context) => {
    await context.answerCallbackQuery();
    const postId = context.match[1];
    const version = Number(context.match[2]);
    if (!postId || !Number.isSafeInteger(version)) return;
    try {
      const userId = await resolveUser(context, backend);
      await backend.archivePost(userId, postId, version);
      await renderMenu(context, 'Пост отправлен в архив.', {
        reply_markup: mainMenuKeyboard(),
      });
    } catch (error) {
      await renderMenu(context, backendErrorMessage(error), {
        reply_markup: mainMenuKeyboard(),
      });
    }
  });

  bot.callbackQuery(/^posts:schedule:(.+)$/, async (context) => {
    await context.answerCallbackQuery();
    const userId = telegramUserId(context);
    const postId = context.match[1];
    if (!userId || !postId) return;
    drafts.set(userId, { channelId: '', phase: 'schedule', postId });
    await renderMenu(
      context,
      'Отправьте дату и время в ISO 8601 с часовым поясом, например 2026-10-15T18:00:00+03:00.',
    );
  });

  bot.on('message:text', async (context, next) => {
    const userId = telegramUserId(context);
    const draft = userId ? drafts.get(userId) : undefined;
    const editDraft = userId ? postEditDrafts.get(userId) : undefined;
    if (userId && editDraft) {
      const prompt = context.message.text.trim();
      if (!prompt || prompt.length > 20_000) {
        await renderMenu(
          context,
          'Prompt должен содержать от 1 до 20 000 символов.',
        );
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
        await renderMenu(context, 'Prompt поста обновлён.', {
          reply_markup: mainMenuKeyboard(),
        });
      } catch (error) {
        await renderMenu(context, backendErrorMessage(error), {
          reply_markup: mainMenuKeyboard(),
        });
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
        await renderMenu(
          context,
          'Текст запроса должен содержать от 1 до 20 000 символов.',
        );
        return;
      }
      draft.prompt = value;
      draft.phase = 'mode';
      await renderMenu(context, 'Выберите режим публикации:', {
        reply_markup: new InlineKeyboard()
          .text('Автоматически', 'posts:mode:AUTO')
          .row()
          .text('Через модерацию', 'posts:mode:MODERATION'),
      });
      return;
    }

    if (draft.phase === 'schedule') {
      const runAt = new Date(value);
      if (
        Number.isNaN(runAt.getTime()) ||
        !/[zZ]|[+-]\d{2}:?\d{2}$/.test(value)
      ) {
        await renderMenu(
          context,
          'Укажите корректную дату ISO 8601 с часовым поясом.',
        );
        return;
      }
      if (runAt.getTime() <= Date.now()) {
        await renderMenu(context, 'Дата публикации должна быть в будущем.');
        return;
      }
      try {
        const resolvedUserId = await resolveUser(context, backend);
        const schedule = await backend.createOneTimeSchedule(resolvedUserId, {
          postId: draft.postId!,
          runAt: value,
          timezone: 'Europe/Moscow',
        });
        drafts.delete(userId);
        await renderMenu(
          context,
          `Публикация запланирована на ${schedule.runAt ?? value}.`,
          {
            reply_markup: mainMenuKeyboard(),
          },
        );
      } catch (error) {
        await renderMenu(context, backendErrorMessage(error), {
          reply_markup: mainMenuKeyboard(),
        });
      }
    }
  });
}

async function beginPost(
  context: Context,
  backend: BackendClient,
): Promise<void> {
  const userId = telegramUserId(context);
  if (!userId) {
    await renderMenu(context, 'Не удалось определить пользователя Telegram.');
    return;
  }
  try {
    const resolvedUserId = await resolveUser(context, backend);
    const channels = (await backend.listChannels(resolvedUserId)).filter(
      (channel) => channel.status === 'ACTIVE',
    );
    if (!channels.length) {
      await renderMenu(
        context,
        'Сначала добавьте активный канал через раздел «Каналы».',
        {
          reply_markup: mainMenuKeyboard(),
        },
      );
      return;
    }
    drafts.set(userId, { channelId: channels[0]!.id, phase: 'topic' });
    const keyboard = new InlineKeyboard();
    for (const channel of channels) {
      keyboard.text(channel.title, `posts:channel:${channel.id}`).row();
    }
    await renderMenu(context, 'Выберите канал:', { reply_markup: keyboard });
  } catch (error) {
    await renderMenu(context, backendErrorMessage(error), {
      reply_markup: mainMenuKeyboard(),
    });
  }
}

async function askTopic(context: Context, topics: Topic[]): Promise<void> {
  const keyboard = new InlineKeyboard()
    .text('Без темы', 'posts:topic:none')
    .row();
  for (const topic of topics) {
    keyboard.text(topic.name, `posts:topic:${topic.id}`).row();
  }
  await renderMenu(context, 'Выберите тему или продолжите без темы:', {
    reply_markup: keyboard,
  });
}

async function showPosts(
  context: Context,
  backend: BackendClient,
): Promise<void> {
  try {
    const userId = await resolveUser(context, backend);
    const posts = await backend.listPosts(userId);
    const text = posts.length
      ? ['Ваши посты:', '', ...posts.map(formatPost)].join('\n')
      : 'Постов пока нет.';
    await renderMenu(context, text, { reply_markup: postsKeyboard(posts) });
  } catch (error) {
    await renderMenu(context, backendErrorMessage(error), {
      reply_markup: mainMenuKeyboard(),
    });
  }
}

function formatPost(post: Post): string {
  const title = post.title || post.prompt.slice(0, 48);
  return `• ${title}${post.prompt.length > 48 ? '…' : ''} — ${post.publicationMode}, ${post.status}`;
}
