import { InlineKeyboard, Keyboard, type Context } from 'grammy';

import { renderMenu } from './ui.js';

export const MENU_TEXT = 'Выберите раздел:';
export const CHANNEL_PICKER_REQUEST_ID = 1001;

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
    .row()
    .requestChat('Добавить канал', CHANNEL_PICKER_REQUEST_ID, {
      chat_is_channel: true,
      bot_is_member: true,
      user_administrator_rights: channelPickerUserRights(),
      request_title: true,
      request_username: true,
    })
    .resized();
}

export async function showMainMenu(context: Context): Promise<void> {
  await renderMenu(context, MENU_TEXT, {
    reply_markup: mainReplyKeyboard(),
  });
}

function channelPickerUserRights() {
  return {
    is_anonymous: false,
    can_manage_chat: true,
    can_delete_messages: false,
    can_manage_video_chats: false,
    can_restrict_members: false,
    can_promote_members: false,
    can_change_info: false,
    can_invite_users: false,
    can_post_stories: false,
    can_edit_stories: false,
    can_delete_stories: false,
    can_post_messages: false,
    can_edit_messages: false,
    can_pin_messages: false,
    can_manage_topics: false,
    can_manage_direct_messages: false,
    can_send_welcome_messages: false,
  } as const;
}
