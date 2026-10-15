import type { ModerationRequest } from '../../backend/client.js';
import type { BotContext } from '../context.js';

export function formatRequest(
  context: BotContext,
  request: ModerationRequest,
): string {
  const generatedText =
    request.postVersion.text || context.t('moderation-text-pending');
  const text =
    generatedText.length > 3800
      ? `${generatedText.slice(0, 3800)}…`
      : generatedText;
  return context.t('moderation-item', {
    version: request.postVersion.sequence,
    text: text,
  });
}
