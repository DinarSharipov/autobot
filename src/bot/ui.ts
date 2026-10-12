import { type Context, type InlineKeyboard, type Keyboard } from 'grammy';

type MenuOptions = {
  reply_markup?: InlineKeyboard | Keyboard;
};

const lastMenuByChatId = new Map<string, number>();

export async function renderMenu(
  context: Context,
  text: string,
  options: MenuOptions = {},
): Promise<void> {
  const callbackMessage = context.callbackQuery?.message;
  if (callbackMessage && isInlineKeyboard(options.reply_markup)) {
    try {
      const replyMarkup = options.reply_markup;
      const editOptions =
        replyMarkup === undefined ? {} : { reply_markup: replyMarkup };
      await context.editMessageText(text, editOptions);
      rememberMenu(context);
      return;
    } catch (error) {
      if (isMessageNotModified(error)) return;
    }
  }

  const chatId = context.chatId;
  if (chatId === undefined) {
    await context.reply(text, options);
    return;
  }

  const key = String(chatId);
  const previousMessageId = lastMenuByChatId.get(key);
  const callbackMessageId = callbackMessage?.message_id;
  const messageIds = new Set(
    [previousMessageId, callbackMessageId].filter(
      (messageId): messageId is number => messageId !== undefined,
    ),
  );
  for (const messageId of messageIds) {
    try {
      await context.api.deleteMessage(chatId, messageId);
    } catch {
      // The message may already have been deleted by the user or Telegram.
    }
  }

  const message = await context.reply(text, options);
  lastMenuByChatId.set(key, message.message_id);
}

function rememberMenu(context: Context): void {
  const chatId = context.chatId;
  const messageId = context.msgId;
  if (chatId !== undefined && messageId !== undefined) {
    lastMenuByChatId.set(String(chatId), messageId);
  }
}

function isMessageNotModified(error: unknown): boolean {
  return (
    error instanceof Error && /message is not modified/i.test(error.message)
  );
}

function isInlineKeyboard(
  markup: MenuOptions['reply_markup'],
): markup is InlineKeyboard | undefined {
  return markup === undefined || 'inline_keyboard' in markup;
}
