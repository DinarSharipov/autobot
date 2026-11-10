import { Composer, InlineKeyboard } from 'grammy';
import { randomUUID } from 'node:crypto';
import { packFingerprint } from './checkout.js';

import type { BackendClient } from '../backend/client.js';
import type { BotContext } from './context.js';
import { resolveUser } from './common.js';
import { renderBackendError } from './errors.js';
import { formatDate, formatNumber } from './format.js';
import { renderPage } from './ui.js';

const PAGE_SIZE = 5;
const STATE_KEYS: Readonly<Record<string, string>> = {
  PENDING: 'billing-pending',
  AWAITING_PAYMENT: 'billing-awaiting-payment',
  PAID: 'billing-paid',
  CANCELLED: 'status-cancelled',
  EXPIRED: 'status-expired',
  FAILED: 'status-failed',
  NOT_CREATED: 'billing-not-created',
  SUCCEEDED: 'billing-succeeded',
  FULFILLED: 'billing-fulfilled',
  NONE: 'billing-refund-none',
  PARTIAL: 'billing-refund-partial',
  FULL: 'billing-refund-full',
};

function state(context: BotContext, value: string): string {
  return context.t(STATE_KEYS[value] ?? 'status-unknown');
}

function price(context: BotContext, minor: number, currency: string): string {
  return new Intl.NumberFormat(context.locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(minor / 100);
}

function listKeyboard(
  context: BotContext,
  kind: string,
  page: number,
  total: number,
): InlineKeyboard {
  const keyboard = new InlineKeyboard();
  if (page > 0)
    keyboard.text(context.t('billing-previous'), `billing:${kind}:${page - 1}`);
  if ((page + 1) * PAGE_SIZE < total)
    keyboard.text(context.t('billing-next'), `billing:${kind}:${page + 1}`);
  return keyboard.row().text(context.t('section-balance'), 'menu:balance');
}

export function createBillingFeature(
  backend: BackendClient,
  testCheckoutEnabled = false,
): Composer<BotContext> {
  const feature = new Composer<BotContext>();
  feature.callbackQuery(
    /^billing:(packs|orders):(\d{1,3})$/,
    async (context) => {
      await context.answerCallbackQuery();
      try {
        const userId = await resolveUser(context, backend);
        const kind = context.match[1];
        const items =
          kind === 'packs'
            ? await backend.getGenerationPacks(userId)
            : await backend.getPurchaseOrders(userId);
        const page = Math.min(
          Number(context.match[2]),
          Math.max(0, Math.ceil(items.length / PAGE_SIZE) - 1),
        );
        const keyboard = listKeyboard(
          context,
          kind ?? 'packs',
          page,
          items.length,
        );
        const lines = items
          .slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)
          .map((item) => {
            const summary = context.t('billing-pack', {
              type: context.t(
                item.creditType === 'TEXT' ? 'balance-text' : 'balance-image',
              ),
              units: formatNumber(context, item.units),
              price: price(context, item.priceMinor, item.currency),
            });
            if (!('id' in item)) {
              if (testCheckoutEnabled)
                keyboard
                  .row()
                  .text(
                    context.t('checkout-select', { summary }),
                    `checkout:buy:${packFingerprint(item)}:${randomUUID().replaceAll('-', '').slice(0, 16)}`,
                  );
              return summary;
            }
            keyboard
              .row()
              .text(
                context.t('billing-open-order', { id: item.id.slice(0, 8) }),
                `billing:order:${item.id}`,
              );
            return context.t('billing-order-summary', {
              summary,
              date: formatDate(context, item.createdAt),
              payment: state(context, item.paymentStatus),
              fulfillment: state(context, item.fulfillmentStatus),
            });
          });
        await renderPage(
          context,
          context.t(
            kind === 'packs'
              ? testCheckoutEnabled
                ? 'checkout-packs-page'
                : 'billing-packs-page'
              : 'billing-orders-page',
            {
              items: lines.length
                ? lines.join('\n\n')
                : context.t('billing-empty'),
              page: formatNumber(context, page + 1),
            },
          ),
          { reply_markup: keyboard },
        );
      } catch (error) {
        await renderBackendError(context, error);
      }
    },
  );

  feature.callbackQuery(/^billing:order:([0-9a-f-]{36})$/, async (context) => {
    await context.answerCallbackQuery();
    try {
      const userId = await resolveUser(context, backend);
      const order = await backend.getPurchaseOrder(
        userId,
        context.match[1] ?? '',
      );
      const keyboard = new InlineKeyboard();
      if (testCheckoutEnabled && order.fulfillmentStatus !== 'FULFILLED') {
        keyboard
          .text(context.t('checkout-open'), `checkout:open:${order.id}`)
          .row();
      }
      if (testCheckoutEnabled && order.paymentStatus !== 'NOT_CREATED') {
        keyboard
          .text(context.t('checkout-check'), `checkout:check:${order.id}`)
          .row();
      }
      await renderPage(
        context,
        context.t('billing-order-page', {
          id: order.id,
          date: formatDate(context, order.createdAt),
          type: context.t(
            order.creditType === 'TEXT' ? 'balance-text' : 'balance-image',
          ),
          units: formatNumber(context, order.units),
          price: price(context, order.priceMinor, order.currency),
          status: state(context, order.status),
          payment: state(context, order.paymentStatus),
          fulfillment: state(context, order.fulfillmentStatus),
          refund: state(context, order.refundStatus),
          refunded: price(context, order.refundedMinor, order.currency),
          refundedUnits: formatNumber(context, order.refundedUnits),
        }),
        {
          reply_markup: keyboard
            .text(
              context.t('billing-refresh-order'),
              `billing:order:${order.id}`,
            )
            .row()
            .text(context.t('billing-orders'), 'billing:orders:0')
            .row()
            .text(context.t('section-balance'), 'menu:balance'),
        },
      );
    } catch (error) {
      await renderBackendError(context, error);
    }
  });
  return feature;
}
