import { BackendApiError } from '../backend/client.js';
import type { BotContext } from './context.js';
import { renderPage } from './ui.js';

const ERROR_KEYS: Readonly<Record<string, string>> = {
  CHECKOUT_DISABLED: 'error-checkout-disabled',
  PAYMENT_PROVIDER_NOT_CONFIGURED: 'error-checkout-disabled',
  CHECKOUT_NOT_ALLOWED: 'error-checkout-not-allowed',
  PAYMENT_PROVIDER_UNAVAILABLE: 'error-payment-provider',
  PAYMENT_PROVIDER_INVALID_RESPONSE: 'error-payment-provider',
  PAYMENT_RECONCILIATION_REQUIRED: 'error-payment-reconciliation',
  PAYMENT_VERIFICATION_FAILED: 'error-payment-verification',
  PAYMENT_NOT_CONFIRMED: 'error-payment-not-confirmed',
  GENERATION_PACK_NOT_FOUND: 'error-pack-unavailable',
  INVALID_GENERATION_PACK: 'error-pack-unavailable',
  PURCHASE_ORDER_NOT_FOUND: 'error-order-not-found',
  PUBLICATION_NOT_FOUND: 'error-generation-unavailable',
  GENERATION_NOT_RESUMABLE: 'error-generation-unavailable',
  PREPAID_NOT_APPLICABLE: 'error-generation-unavailable',
  TELEGRAM_USER_NOT_AVAILABLE: 'error-telegram-user',
  BOT_INTEGRATION_NOT_CONFIGURED: 'error-integration',
  BACKEND_UNAVAILABLE: 'error-unavailable',
  BACKEND_INVALID_RESPONSE: 'error-backend-response',
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
  STALE_COST_CONFIRMATION: 'error-stale-resource',
  COST_CONFIRMATION_REQUIRED: 'error-cost-confirmation-required',
  INSUFFICIENT_TEXT_CREDITS: 'error-insufficient-text-credits',
  INSUFFICIENT_IMAGE_CREDITS: 'error-insufficient-image-credits',
  MEDIA_GENERATION_IN_PROGRESS: 'error-media-generation-in-progress',
  MEDIA_OUTDATED: 'error-media-outdated',
  MEDIA_UNAVAILABLE: 'error-media-unavailable',
  MEDIA_NOT_MUTABLE: 'error-media-not-mutable',
  MEDIA_NOT_FOUND: 'error-media-not-found',
  MEDIA_NOT_RESUMABLE: 'error-media-not-resumable',
  MEDIA_UPLOAD_UNKNOWN: 'error-media-upload-unknown',
  MEDIA_TEXT_NOT_READY: 'error-moderation-pending',
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
