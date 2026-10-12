import { type Context, type InlineKeyboard } from 'grammy';

type MenuOptions = {
  reply_markup?: InlineKeyboard;
};

const lastMenuByChatId = new Map<string, number>();

export async function renderMenu(
  context: Context,
  text: string,
  options: MenuOptions = {},
): Promise<void> {
  const callbackMessage = context.callbackQuery?.message;
  if (callbackMessage) {
    try {
      await context.editMessageText(text, options);
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
  if (previousMessageId !== undefined) {
    try {
      await context.api.deleteMessage(chatId, previousMessageId);
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
