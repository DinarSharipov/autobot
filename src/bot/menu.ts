import { InlineKeyboard, type Context } from 'grammy';

export const MENU_TEXT = 'Выберите раздел:';

export function mainMenuKeyboard(): InlineKeyboard {
  return new InlineKeyboard()
    .text('Темы', 'menu:topics')
    .row()
    .text('Подписка и лимиты', 'menu:subscription')
    .row()
    .text('Каналы', 'menu:channels');
}

export async function showMainMenu(context: Context): Promise<void> {
  await context.reply(MENU_TEXT, { reply_markup: mainMenuKeyboard() });
}
