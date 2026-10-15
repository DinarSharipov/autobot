import type { BotContext } from './context.js';

export const PUBLICATION_TIMEZONE = 'Europe/Moscow';

export function formatDate(context: BotContext, value: string | null): string {
  if (!value) return context.t('date-unspecified');
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return context.t('date-unspecified');
  return new Intl.DateTimeFormat(context.locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
    timeZone: PUBLICATION_TIMEZONE,
  }).format(date);
}

export function formatNumber(context: BotContext, value: number): string {
  return new Intl.NumberFormat(context.locale).format(value);
}

export function truncate(value: string, limit: number): string {
  return value.length > limit ? `${value.slice(0, limit - 1)}…` : value;
}

const STATUS_KEYS: Record<string, string> = {
  ACTIVE: 'status-active',
  ARCHIVED: 'status-archived',
  INVALID: 'status-invalid',
  PENDING: 'status-pending',
  CANCELLED: 'status-cancelled',
  DRAFT: 'status-draft',
  AWAITING_MODERATION: 'status-awaiting-moderation',
  DELIVERY_UNKNOWN: 'status-delivery-unknown',
  FAILED: 'status-failed',
  GENERATING: 'status-generating',
  PUBLISHED: 'status-published',
  PUBLISHING: 'status-publishing',
  READY: 'status-ready',
  RETRY_WAIT: 'status-retry-wait',
  SKIPPED: 'status-skipped',
  APPROVED: 'status-approved',
  GENERATED: 'status-generated',
  GENERATION_PENDING: 'status-generation-pending',
  REJECTED: 'status-rejected',
  SUPERSEDED: 'status-superseded',
  REVISION_REQUESTED: 'status-revision-requested',
  COMPLETED: 'status-completed',
  PAUSED: 'status-paused',
  EXPIRED: 'status-expired',
  PAST_DUE: 'status-past-due',
  TRIALING: 'status-trialing',
};

export function statusLabel(context: BotContext, status: string): string {
  return context.t(STATUS_KEYS[status] ?? 'status-unknown');
}
