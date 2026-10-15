import type { BotContext } from './context.js';
import { Composer } from 'grammy';

import type { BackendClient } from '../backend/client.js';
import { showChannels } from './channels.js';
import { telegramUserId } from './common.js';
import { clearConversationDrafts } from './drafts.js';
import { showMainMenu } from './menu.js';
import { showModeration } from './moderation.js';
import { showCreatePost, showPosts } from './posts.js';
import { showSchedules } from './schedules.js';
import { HOME_LABEL_KEY, SECTIONS, type SectionId } from './sections.js';
import { showStart } from './start.js';
import { showSubscription } from './subscription.js';
import { showTopics } from './topics.js';
import { translatedLabels } from './i18n.js';
import { ensureMainKeyboard, isStalePageCallback, renderPage } from './ui.js';

type SectionHandler = (
  context: BotContext,
  backend: BackendClient,
) => Promise<void>;

const sectionHandlers: Record<SectionId, SectionHandler> = {
  topics: showTopics,
  channels: showChannels,
  posts: showPosts,
  moderation: showModeration,
  schedules: showSchedules,
  subscription: showSubscription,
};

/** Register before feature composers: navigation always takes priority over input. */
export function createNavigation(
  backend: BackendClient,
  webAdminUrl: string | undefined,
): Composer<BotContext> {
  const navigation = new Composer<BotContext>();
  const leaveFlow = (context: BotContext): void => {
    const userId = telegramUserId(context);
    if (userId) clearConversationDrafts(userId);
  };

  navigation.use(async (context, next) => {
    if (isStalePageCallback(context)) {
      await context.answerCallbackQuery({
        text: context.t('navigation-stale-page'),
      });
      return;
    }
    await next();
  });

  navigation.command('start', async (context) => {
    leaveFlow(context);
    await ensureMainKeyboard(context, true);
    await showStart(context, backend);
  });
  navigation.command('menu', async (context) => {
    leaveFlow(context);
    await ensureMainKeyboard(context, true);
    await showMainMenu(context, webAdminUrl);
  });
  navigation.hears(HOME_LABEL_KEY, async (context) => {
    leaveFlow(context);
    await showMainMenu(context, webAdminUrl);
  });
  navigation.callbackQuery('menu:home', async (context) => {
    await context.answerCallbackQuery();
    leaveFlow(context);
    await showMainMenu(context, webAdminUrl);
  });
  navigation.command('cancel', async (context) => {
    leaveFlow(context);
    await renderPage(context, context.t('navigation-cancelled'));
  });
  navigation.command('createpost', async (context) => {
    leaveFlow(context);
    await showCreatePost(context, backend);
  });

  for (const section of SECTIONS) {
    const open = async (context: BotContext): Promise<void> => {
      leaveFlow(context);
      await sectionHandlers[section.id](context, backend);
    };
    navigation.command(section.command, open);
    navigation.hears(translatedLabels(section.labelKey), open);
    // Preserve callback data from older bot versions and notification messages.
    navigation.callbackQuery(`menu:${section.id}`, async (context) => {
      await context.answerCallbackQuery();
      await open(context);
    });
  }

  // Unknown commands must not accidentally become a prompt or revision request.
  navigation.on('message:entities:bot_command', async (context, next) => {
    if (
      context.message.entities.some(
        (entity) => entity.type === 'bot_command' && entity.offset === 0,
      )
    ) {
      await renderPage(context, context.t('navigation-unknown-command'));
      return;
    }
    await next();
  });
  return navigation;
}
