import type { Context } from 'grammy';

import {
  BackendApiError,
  type BackendClient,
  type TelegramProfileInput,
} from '../backend/client.js';

export function telegramUserId(context: Context): string | null {
  return context.from ? String(context.from.id) : null;
}

export function telegramProfile(context: Context): TelegramProfileInput | null {
  if (!context.from) return null;

  return {
    firstName: context.from.first_name || null,
    languageCode: context.from.language_code || null,
    lastName: context.from.last_name || null,
    username: context.from.username || null,
  };
}

export async function resolveUser(
  context: Context,
  backend: BackendClient,
): Promise<string> {
  const userId = telegramUserId(context);
  const profile = telegramProfile(context);
  if (!userId || !profile) {
    throw new BackendApiError('TELEGRAM_USER_NOT_AVAILABLE', 400);
  }

  await backend.resolveTelegramUser(userId, profile);
  return userId;
}

export function backendErrorMessage(error: unknown): string {
  if (!(error instanceof BackendApiError)) {
    return 'Не удалось обработать запрос. Попробуйте ещё раз.';
  }

  switch (error.code) {
    case 'BOT_INTEGRATION_NOT_CONFIGURED':
      return 'Интеграция с сервисом настраивается. Попробуйте позднее.';
    case 'BACKEND_UNAVAILABLE':
    case 'BOT_AUTH_DEPENDENCY_UNAVAILABLE':
      return 'Сервис временно недоступен. Попробуйте позднее.';
    case 'ENTITLEMENT_LIMIT_EXCEEDED':
      return 'Достигнут лимит вашего тарифа.';
    case 'USAGE_LIMIT_REACHED':
      return 'Лимит этой операции по вашему тарифу исчерпан.';
    case 'VALIDATION_FAILED':
      return 'Проверьте введённые данные и попробуйте ещё раз.';
    case 'CHANNEL_NOT_ACTIVE':
      return 'Канал не активен. Проверьте, что бот добавлен администратором канала.';
    case 'TELEGRAM_CHANNEL_UNAVAILABLE':
      return 'Telegram не смог получить этот канал. Проверьте, что бот добавлен в канал и имеет права администратора.';
    case 'TELEGRAM_BOT_CANNOT_POST':
      return 'Бот добавлен в канал, но не может публиковать сообщения. Выдайте ему право «Публикация сообщений» и повторите попытку.';
    case 'TELEGRAM_CHAT_NOT_CHANNEL':
      return 'Выбранный чат не является каналом. Выберите канал Telegram.';
    case 'POST_NOT_ACTIVE':
      return 'Пост больше не активен и не может быть запланирован.';
    case 'RUN_AT_OFFSET_REQUIRED':
      return 'Дата должна содержать часовой пояс, например +03:00.';
    case 'INVALID_TIMEZONE':
      return 'Неизвестный часовой пояс.';
    case 'MODERATION_NOT_READY':
      return 'Текст ещё не готов к модерации. Попробуйте обновить список позже.';
    case 'STALE_RESOURCE_VERSION':
      return 'Данные уже изменились. Откройте раздел заново и повторите действие.';
    case 'SCHEDULE_NOT_EDITABLE':
      return 'Это расписание уже нельзя изменить в текущем состоянии.';
    case 'SCHEDULE_NOT_FOUND':
      return 'Расписание больше не найдено. Обновите список.';
    case 'POST_NOT_PUBLISHABLE':
      return 'Пост сейчас нельзя опубликовать.';
    case 'MODERATION_ALREADY_DECIDED':
      return 'Эта заявка на модерацию уже обработана.';
    default:
      return 'Не удалось обработать запрос. Попробуйте ещё раз.';
  }
}
