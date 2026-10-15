import { InlineKeyboard } from 'grammy';
import type { Post, Topic } from '../../backend/client.js';
import type { BotContext } from '../context.js';
import { statusLabel, truncate } from '../format.js';
import { renderPage } from '../ui.js';

export function postsKeyboard(
  context: BotContext,
  posts: Post[],
): InlineKeyboard {
  const keyboard = new InlineKeyboard().text(
    context.t('action-create-post'),
    'posts:create',
  );
  for (const post of posts) {
    keyboard
      .row()
      .text(
        context.t('action-publish'),
        `posts:publish:${post.id}:${post.version}`,
      )
      .text(context.t('action-versions'), `posts:versions:${post.id}`)
      .row()
      .text(
        context.t('action-edit-prompt'),
        `posts:edit:${post.id}:${post.version}`,
      )
      .text(
        context.t('action-archive'),
        `posts:archive:${post.id}:${post.version}`,
      );
  }
  return keyboard.row().text(context.t('action-home'), 'menu:home');
}

export async function askTopic(
  context: BotContext,
  topics: Topic[],
): Promise<void> {
  const keyboard = new InlineKeyboard()
    .text(context.t('posts-no-topic'), 'posts:topic:none')
    .row();
  for (const topic of topics) {
    keyboard.text(topic.name, `posts:topic:${topic.id}`).row();
  }
  await renderPage(context, context.t('posts-ask-topic'), {
    reply_markup: keyboard,
  });
}

export function formatPost(context: BotContext, post: Post): string {
  return context.t('posts-item', {
    title: truncate(post.title || post.prompt, 48),
    mode: context.t(
      post.publicationMode === 'AUTO' ? 'mode-auto' : 'mode-moderation',
    ),
    status: statusLabel(context, post.status),
  });
}
