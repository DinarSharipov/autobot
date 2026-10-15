import type { BotContext } from './context.js';

import {
  BackendApiError,
  type BackendClient,
  type TelegramProfileInput,
} from '../backend/client.js';

export function telegramUserId(context: BotContext): string | null {
  return context.from ? String(context.from.id) : null;
}

export function telegramProfile(
  context: BotContext,
): TelegramProfileInput | null {
  if (!context.from) return null;

  return {
    firstName: context.from.first_name || null,
    languageCode: context.from.language_code || null,
    lastName: context.from.last_name || null,
    username: context.from.username || null,
  };
}

export async function resolveUser(
  context: BotContext,
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
