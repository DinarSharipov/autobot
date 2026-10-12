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
    case 'VALIDATION_FAILED':
      return 'Проверьте введённые данные и попробуйте ещё раз.';
    default:
      return 'Не удалось обработать запрос. Попробуйте ещё раз.';
  }
}
