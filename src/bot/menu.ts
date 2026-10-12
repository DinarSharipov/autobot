import { InlineKeyboard, Keyboard, type Context } from 'grammy';

import { renderMenu } from './ui.js';

export const MENU_TEXT = 'Выберите раздел:';

let telegramBotUsername: string | undefined;

export function configureTelegramBotUsername(username: string): void {
  telegramBotUsername = username;
}

export function channelAddLink(): string {
  if (!telegramBotUsername) {
    throw new Error('Telegram bot username is not configured');
  }

  return `https://t.me/${telegramBotUsername}?startchannel&admin=post_messages`;
}

export function mainMenuKeyboard(): InlineKeyboard {
  return new InlineKeyboard()
    .text('Темы', 'menu:topics')
    .row()
    .text('Каналы', 'menu:channels')
    .row()
    .text('Посты', 'menu:posts')
    .row()
    .text('Модерация', 'menu:moderation')
    .row()
    .text('Расписание', 'menu:schedules')
    .row()
    .text('Подписка и лимиты', 'menu:subscription');
}

export function mainReplyKeyboard(): Keyboard {
  return new Keyboard()
    .text('Темы')
    .text('Каналы')
    .row()
    .text('Посты')
    .text('Модерация')
    .row()
    .text('Расписание')
    .text('Подписка и лимиты')
    .row()
    .text('Главное меню')
    .resized()
    .persistent();
}

export async function showMainMenu(context: Context): Promise<void> {
  await renderMenu(context, MENU_TEXT, {
    reply_markup: mainReplyKeyboard(),
  });
}
