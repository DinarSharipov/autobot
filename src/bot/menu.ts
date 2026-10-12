import { InlineKeyboard, type Context } from 'grammy';

import { renderMenu } from './ui.js';

export const MENU_TEXT = 'Выберите раздел:';

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

export async function showMainMenu(context: Context): Promise<void> {
  await renderMenu(context, MENU_TEXT, { reply_markup: mainMenuKeyboard() });
}
