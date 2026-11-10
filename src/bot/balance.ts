import { Composer, InlineKeyboard } from 'grammy';

import type { BackendClient } from '../backend/client.js';
import type { BotContext } from './context.js';
import { resolveUser } from './common.js';
import { renderBackendError } from './errors.js';
import { formatDate, formatNumber } from './format.js';
import { renderPage } from './ui.js';
import type { CreditLedgerEntry } from '../backend/billing.js';

const LEDGER_KEYS: Record<CreditLedgerEntry['kind'], string> = {
  GIFT: 'balance-kind-gift',
  PURCHASE: 'balance-kind-purchase',
  RESERVE: 'balance-kind-reserve',
  COMMIT: 'balance-kind-commit',
  RELEASE: 'balance-kind-release',
  REFUND: 'balance-kind-refund',
  ADJUSTMENT: 'balance-kind-adjustment',
};

export async function showBalance(
  context: BotContext,
  backend: BackendClient,
): Promise<void> {
  try {
    const userId = await resolveUser(context, backend);
    const wallets = await backend.getWallets(userId);
    const items = (['TEXT', 'IMAGE'] as const).map((creditType) => {
      const wallet = wallets.find((item) => item.creditType === creditType);
      const type = context.t(
        creditType === 'TEXT' ? 'balance-text' : 'balance-image',
      );
      if (!wallet) return context.t('balance-missing', { type });
      return context.t('balance-wallet', {
        type,
        available: formatNumber(context, wallet.available),
        reserved: formatNumber(context, wallet.reserved),
        debt: formatNumber(context, wallet.debt),
      });
    });
    await renderPage(
      context,
      context.t('balance-page', { wallets: items.join('\n\n') }),
      {
        reply_markup: new InlineKeyboard()
          .text(context.t('generation-publications'), 'generation:list')
          .row()
          .text(context.t('billing-catalogue'), 'billing:packs:0')
          .row()
          .text(context.t('billing-orders'), 'billing:orders:0')
          .row()
          .text(context.t('balance-history-action'), 'balance:history')
          .row()
          .text(context.t('balance-refresh'), 'menu:balance'),
      },
    );
  } catch (error) {
    await renderBackendError(context, error);
  }
}

export function createBalanceFeature(
  backend: BackendClient,
): Composer<BotContext> {
  const feature = new Composer<BotContext>();
  feature.callbackQuery('balance:history', async (context) => {
    await context.answerCallbackQuery();
    try {
      const userId = await resolveUser(context, backend);
      const entries = await backend.getWalletLedger(userId);
      const items = entries.map((entry) =>
        context.t('balance-history-item', {
          date: formatDate(context, entry.createdAt),
          kind: context.t(LEDGER_KEYS[entry.kind] ?? 'balance-kind-unknown'),
          type: context.t(
            entry.wallet.creditType === 'TEXT'
              ? 'balance-text'
              : 'balance-image',
          ),
          units: formatNumber(context, entry.units),
        }),
      );
      await renderPage(
        context,
        context.t('balance-history', {
          entries: items.length
            ? items.join('\n\n')
            : context.t('balance-history-empty'),
        }),
        {
          reply_markup: new InlineKeyboard().text(
            context.t('section-balance'),
            'menu:balance',
          ),
        },
      );
    } catch (error) {
      await renderBackendError(context, error);
    }
  });
  return feature;
}
