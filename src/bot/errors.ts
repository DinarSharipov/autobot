import { BackendApiError } from '../backend/client.js';
import type { BotContext } from './context.js';
import { renderPage } from './ui.js';

const ERROR_KEYS: Readonly<Record<string, string>> = {
  TELEGRAM_USER_NOT_AVAILABLE: 'error-telegram-user',
  BOT_INTEGRATION_NOT_CONFIGURED: 'error-integration',
  BACKEND_UNAVAILABLE: 'error-unavailable',
  BOT_AUTH_DEPENDENCY_UNAVAILABLE: 'error-unavailable',
  ENTITLEMENT_LIMIT_EXCEEDED: 'error-entitlement',
  USAGE_LIMIT_REACHED: 'error-usage',
  IMAGE_GENERATION_NOT_INCLUDED: 'error-image-generation-not-included',
  MODERATION_NOT_INCLUDED: 'error-moderation-not-included',
  VALIDATION_FAILED: 'error-validation',
  CHANNEL_NOT_ACTIVE: 'error-channel-inactive',
  TELEGRAM_CHANNEL_UNAVAILABLE: 'error-channel-unavailable',
  TELEGRAM_BOT_CANNOT_POST: 'error-channel-permissions',
  TELEGRAM_CHAT_NOT_CHANNEL: 'error-not-channel',
  CHANNEL_ALREADY_LINKED: 'error-channel-linked',
  POST_NOT_ACTIVE: 'error-post-inactive',
  RUN_AT_OFFSET_REQUIRED: 'error-date-offset',
  INVALID_TIMEZONE: 'error-timezone',
  MODERATION_NOT_READY: 'error-moderation-pending',
  STALE_RESOURCE_VERSION: 'error-stale-resource',
  SCHEDULE_NOT_EDITABLE: 'error-schedule-not-editable',
  SCHEDULE_NOT_FOUND: 'error-schedule-not-found',
  POST_NOT_PUBLISHABLE: 'error-post-not-publishable',
  MODERATION_ALREADY_DECIDED: 'error-moderation-decided',
};

export function backendErrorMessage(
  context: BotContext,
  error: unknown,
): string {
  const key =
    error instanceof BackendApiError ? ERROR_KEYS[error.code] : undefined;
  return context.t(key ?? 'error-generic');
}

export async function renderBackendError(
  context: BotContext,
  error: unknown,
): Promise<void> {
  await renderPage(context, backendErrorMessage(context, error));
}
