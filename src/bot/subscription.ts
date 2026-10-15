import { renderBackendError } from './errors.js';
import type { BotContext } from './context.js';
import type { BackendClient, Usage } from '../backend/client.js';
import { resolveUser } from './common.js';
import { formatNumber, statusLabel } from './format.js';
import { renderPage } from './ui.js';

function formatLimit(context: BotContext, value: number | null): string {
  return value === null
    ? context.t('usage-unlimited')
    : formatNumber(context, value);
}

function usageByMetric(
  context: BotContext,
  usage: Usage,
  metric: Usage['items'][number]['metric'],
): string {
  const item = usage.items.find((candidate) => candidate.metric === metric);
  return item
    ? context.t('usage-ratio', {
        used: formatNumber(context, item.committed + item.reserved),
        limit: formatLimit(context, item.limit),
      })
    : context.t('usage-no-data');
}

export async function showSubscription(
  context: BotContext,
  backend: BackendClient,
): Promise<void> {
  try {
    const userId = await resolveUser(context, backend);
    const [subscription, usage] = await Promise.all([
      backend.getSubscription(userId),
      backend.getUsage(userId),
    ]);
    const entitlements = subscription.entitlements;
    await renderPage(
      context,
      context.t('subscription-page', {
        plan: subscription.planName,
        status: statusLabel(context, subscription.status),
        channels: formatLimit(context, entitlements.channelLimit),
        topics: formatLimit(context, entitlements.topicLimit),
        textUsage: usageByMetric(context, usage, 'TEXT_GENERATION'),
        imageUsage: usageByMetric(context, usage, 'IMAGE_GENERATION'),
        revisionUsage: usageByMetric(context, usage, 'MODERATION_REVISION'),
        images: context.t(
          entitlements.imageGenerationEnabled
            ? 'availability-enabled'
            : 'availability-disabled',
        ),
        moderation: context.t(
          entitlements.moderationEnabled
            ? 'availability-enabled'
            : 'availability-disabled',
        ),
      }),
    );
  } catch (error) {
    await renderBackendError(context, error);
  }
}
