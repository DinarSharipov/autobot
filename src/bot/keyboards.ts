import type { BotContext } from './context.js';
import { InlineKeyboard, Keyboard } from 'grammy';

import { HOME_LABEL_KEY, SECTIONS } from './sections.js';

/** Never use this markup on a replaceable page message. */
export function mainReplyKeyboard(context: BotContext): Keyboard {
  const keyboard = new Keyboard();
  for (const [index, section] of SECTIONS.entries()) {
    if (index > 0 && index % 2 === 0) keyboard.row();
    keyboard.text(context.t(section.labelKey));
  }
  // Keep the keyboard available, while allowing Telegram's native hide/show icon.
  return keyboard
    .row()
    .text(context.t(HOME_LABEL_KEY))
    .resized()
    .oneTime(false)
    .persistent(false);
}

export function pageNavigationKeyboard(context: BotContext): InlineKeyboard {
  return new InlineKeyboard().text(context.t('action-back-home'), 'menu:home');
}
