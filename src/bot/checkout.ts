import { createHash } from 'node:crypto';
import { Composer, InlineKeyboard } from 'grammy';

import type { BackendClient } from '../backend/client.js';
import type { GenerationPack, PurchaseOrder } from '../backend/billing.js';
import type { BotContext } from './context.js';
import { resolveUser } from './common.js';
import { backendErrorMessage } from './errors.js';
import { formatNumber } from './format.js';
import { renderPage } from './ui.js';

/** Bind selection to the displayed catalogue snapshot, without storing a local price. */
export function packFingerprint(pack: GenerationPack): string {
  return createHash('sha256')
    .update(
      JSON.stringify([
        pack.code,
        pack.version,
        pack.creditType,
        pack.units,
        pack.priceMinor,
        pack.currency,
      ]),
    )
    .digest('hex')
    .slice(0, 24);
}

async function renderCheckoutError(
  context: BotContext,
  error: unknown,
): Promise<void> {
  const keyboard = new InlineKeyboard();
  const data = context.callbackQuery?.data;
  if (data) keyboard.text(context.t('checkout-retry'), data).row();
  keyboard
    .text(context.t('billing-orders'), 'billing:orders:0')
    .row()
    .text(context.t('section-balance'), 'menu:balance');
  await renderPage(context, backendErrorMessage(context, error), {
    reply_markup: keyboard,
  });
}

async function renderCheckout(
  context: BotContext,
  order: PurchaseOrder,
): Promise<void> {
  const keyboard = new InlineKeyboard();
  let message: string;
  if (order.refundStatus !== 'NONE') {
    message = context.t(
      order.refundStatus === 'FULL'
        ? 'checkout-refunded-full'
        : 'checkout-refunded-partial',
      {
        amount: new Intl.NumberFormat(context.locale, {
          style: 'currency',
          currency: order.currency,
          minimumFractionDigits: 2,
        }).format(order.refundedMinor / 100),
        units: formatNumber(context, order.refundedUnits),
      },
    );
  } else if (order.fulfillmentStatus === 'FULFILLED') {
    message = context.t('checkout-fulfilled');
  } else if (order.paymentStatus === 'SUCCEEDED') {
    message = context.t('checkout-awaiting-grant');
  } else if (['CANCELLED', 'EXPIRED', 'FAILED'].includes(order.paymentStatus)) {
    message = context.t('checkout-terminal');
  } else {
    message = context.t(
      order.paymentStatus === 'NOT_CREATED'
        ? 'checkout-review'
        : 'checkout-pending',
    );
    if (order.paymentStatus === 'NOT_CREATED') {
      keyboard
        .text(context.t('checkout-start'), `checkout:pay:${order.id}`)
        .row();
    } else {
      if (order.confirmationUrl) {
        const url = URL.parse(order.confirmationUrl);
        if (url?.protocol === 'https:' && !url.username && !url.password) {
          keyboard.url(context.t('checkout-link'), url.href).row();
        } else {
          message = context.t('checkout-link-unavailable');
        }
      }
      keyboard
        .text(context.t('checkout-recover'), `checkout:pay:${order.id}`)
        .row();
    }
  }
  if (order.paymentStatus !== 'NOT_CREATED') {
    keyboard
      .text(context.t('checkout-check'), `checkout:check:${order.id}`)
      .row();
  }
  keyboard
    .text(
      context.t('billing-open-order', { id: order.id.slice(0, 8) }),
      `billing:order:${order.id}`,
    )
    .row()
    .text(context.t('billing-orders'), 'billing:orders:0')
    .row()
    .text(context.t('section-balance'), 'menu:balance');
  await renderPage(
    context,
    context.t('checkout-order', {
      id: order.id,
      message,
      type: context.t(
        order.creditType === 'TEXT' ? 'balance-text' : 'balance-image',
      ),
      units: formatNumber(context, order.units),
      price: new Intl.NumberFormat(context.locale, {
        style: 'currency',
        currency: order.currency,
        minimumFractionDigits: 2,
      }).format(order.priceMinor / 100),
    }),
    { reply_markup: keyboard },
  );
}

export function createCheckoutFeature(
  backend: BackendClient,
  enabled: boolean,
): Composer<BotContext> {
  const feature = new Composer<BotContext>();
  feature.callbackQuery(
    /^checkout:buy:([0-9a-f]{24}):([0-9a-f]{16})$/,
    async (context) => {
      await context.answerCallbackQuery();
      if (!enabled) {
        await renderPage(context, context.t('checkout-disabled'));
        return;
      }
      try {
        const userId = await resolveUser(context, backend);
        const packs = await backend.getGenerationPacks(userId);
        const pack = packs.find(
          (item) => packFingerprint(item) === context.match[1],
        );
        if (!pack) {
          await renderPage(context, context.t('checkout-stale'), {
            reply_markup: new InlineKeyboard().text(
              context.t('billing-catalogue'),
              'billing:packs:0',
            ),
          });
          return;
        }
        // The purchase token survives restart and page recreation; retries reuse the same order.
        const key = createHash('sha256')
          .update(
            JSON.stringify([
              userId,
              context.chatId,
              context.callbackQuery.data,
            ]),
          )
          .digest('hex');
        const order = await backend.createPurchaseOrder(userId, pack.code, key);
        const currentOrder = await backend.getPurchaseOrder(userId, order.id);
        await renderCheckout(context, currentOrder);
      } catch (error) {
        await renderCheckoutError(context, error);
      }
    },
  );
  feature.callbackQuery(
    /^checkout:(open|pay|check):([0-9a-f-]{36})$/,
    async (context) => {
      await context.answerCallbackQuery();
      if (!enabled) {
        await renderPage(context, context.t('checkout-disabled'));
        return;
      }
      try {
        const userId = await resolveUser(context, backend);
        const orderId = context.match[2] ?? '';
        const action = context.match[1];
        const order =
          action === 'pay'
            ? await backend.createTestPayment(userId, orderId)
            : action === 'check'
              ? await backend.checkTestPayment(userId, orderId)
              : await backend.getPurchaseOrder(userId, orderId);
        await renderCheckout(context, order);
      } catch (error) {
        await renderCheckoutError(context, error);
      }
    },
  );
  return feature;
}
