import { renderBackendError } from './errors.js';
import type { BotContext } from './context.js';

import type { BackendClient } from '../backend/client.js';
import { resolveUser } from './common.js';
import { renderPage } from './ui.js';

export async function showStart(
  context: BotContext,
  backend: BackendClient,
): Promise<void> {
  try {
    await resolveUser(context, backend);
    await renderPage(context, context.t('start-page'));
  } catch (error) {
    await renderBackendError(context, error);
  }
}
