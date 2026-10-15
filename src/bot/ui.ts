import type { BotContext } from './context.js';
import { GrammyError, type InlineKeyboard } from 'grammy';

import { mainReplyKeyboard, pageNavigationKeyboard } from './keyboards.js';

type PageOptions = { reply_markup?: InlineKeyboard };
type ChatUi = {
  keyboardMessageId?: number;
  keyboardLocale?: string;
  pageMessageId?: number;
};
const uiByChatId = new Map<number, ChatUi>();

function chatUi(chatId: number): ChatUi {
  let ui = uiByChatId.get(chatId);
  if (!ui) {
    ui = {};
    uiByChatId.set(chatId, ui);
  }
  return ui;
}

/** The keyboard carrier is separate from pages and is never replaced by them. */
export async function ensureMainKeyboard(
  context: BotContext,
  refresh = false,
): Promise<void> {
  if (context.chat?.type !== 'private') return;
  const ui = chatUi(context.chat.id);
  if (
    ui.keyboardMessageId !== undefined &&
    ui.keyboardLocale === context.locale &&
    !refresh
  )
    return;
  const message = await context.reply(context.t('navigation-keyboard-hint'), {
    reply_markup: mainReplyKeyboard(context),
  });
  ui.keyboardMessageId = message.message_id;
  ui.keyboardLocale = context.locale;
}

export function isStalePageCallback(context: BotContext): boolean {
  const callback = context.callbackQuery;
  // Global navigation also works from old messages and notifications.
  if (!callback?.data || callback.data.startsWith('menu:')) return false;
  const message = callback.message;
  if (!message) return false;
  const currentPageId = uiByChatId.get(message.chat.id)?.pageMessageId;
  return currentPageId !== undefined && currentPageId !== message.message_id;
}

/** Feature modules render pages; they cannot replace or remove the main keyboard. */
export async function renderPage(
  context: BotContext,
  text: string,
  options: PageOptions = {},
): Promise<void> {
  await ensureMainKeyboard(context);
  const replyMarkup = options.reply_markup ?? pageNavigationKeyboard(context);
  const callbackMessage = context.callbackQuery?.message;
  if (callbackMessage) {
    const ui = chatUi(callbackMessage.chat.id);
    const pageMessageId = ui.pageMessageId ?? callbackMessage.message_id;
    try {
      await context.api.editMessageText(
        callbackMessage.chat.id,
        pageMessageId,
        text,
        { reply_markup: replyMarkup },
      );
      ui.pageMessageId = pageMessageId;
      return;
    } catch (error) {
      if (isTelegramError(error, /message is not modified/i)) {
        ui.pageMessageId = pageMessageId;
        return;
      }
      // Recreate only pages that Telegram can no longer edit. Network, rate limit,
      // and invalid markup errors belong to the application's error boundary.
      if (
        !isTelegramError(
          error,
          /message to edit not found|message can't be edited/i,
        )
      )
        throw error;
    }
  }

  const chatId = context.chatId;
  const previousPageId =
    chatId === undefined ? undefined : chatUi(chatId).pageMessageId;
  // Send first: a failed request must not leave the user without a page.
  const message = await context.reply(text, { reply_markup: replyMarkup });
  if (chatId === undefined) return;
  const ui = chatUi(chatId);
  ui.pageMessageId = message.message_id;
  if (previousPageId !== undefined && previousPageId !== ui.keyboardMessageId) {
    try {
      await context.api.deleteMessage(chatId, previousPageId);
    } catch {
      // Page cleanup is best effort; navigation still works if deletion is unavailable.
    }
  }
}

function isTelegramError(error: unknown, description: RegExp): boolean {
  return (
    error instanceof GrammyError &&
    error.error_code === 400 &&
    description.test(error.description)
  );
}
