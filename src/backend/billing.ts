import { z } from 'zod';

export type CreditType = 'TEXT' | 'IMAGE';

export type GenerationPack = {
  code: string;
  creditType: CreditType;
  units: number;
  priceMinor: number;
  currency: string;
  version: number;
};

export type PurchaseOrder = {
  id: string;
  packCode: string;
  creditType: CreditType;
  units: number;
  priceMinor: number;
  currency: string;
  packVersion: number;
  status:
    | 'PENDING'
    | 'AWAITING_PAYMENT'
    | 'PAID'
    | 'CANCELLED'
    | 'EXPIRED'
    | 'FAILED';
  paymentStatus:
    | 'NOT_CREATED'
    | 'PENDING'
    | 'SUCCEEDED'
    | 'CANCELLED'
    | 'EXPIRED'
    | 'FAILED';
  fulfillmentStatus: 'PENDING' | 'FULFILLED';
  refundStatus: 'NONE' | 'PARTIAL' | 'FULL';
  refundedMinor: number;
  refundedUnits: number;
  fulfilledAt: string | null;
  providerPaymentId: string | null;
  confirmationUrl: string | null;
  paymentUrl: string | null;
  expiresAt: string | null;
  paidAt: string | null;
  createdAt: string;
};

export type GenerationWallet = {
  creditType: CreditType;
  available: number;
  reserved: number;
  debt: number;
  version: number;
};

export type CreditLedgerEntry = {
  kind:
    | 'GIFT'
    | 'PURCHASE'
    | 'RESERVE'
    | 'COMMIT'
    | 'RELEASE'
    | 'REFUND'
    | 'ADJUSTMENT';
  units: number;
  operationKey: string;
  publicationId?: string | null | undefined;
  purchaseOrderId?: string | null | undefined;
  createdAt: string;
  wallet: { creditType: CreditType };
};

const creditTypeSchema = z.enum(['TEXT', 'IMAGE']);
const countSchema = z.number().int().nonnegative();
const dateSchema = z.iso.datetime({ offset: true });
const currencySchema = z.string().regex(/^[A-Z]{3}$/);
const packSchema: z.ZodType<GenerationPack> = z.object({
  code: z.string().min(1),
  creditType: creditTypeSchema,
  units: countSchema.positive(),
  priceMinor: countSchema.positive(),
  currency: currencySchema,
  version: countSchema,
});
const orderSchema: z.ZodType<PurchaseOrder> = z.object({
  id: z.uuid(),
  packCode: z.string().min(1),
  creditType: creditTypeSchema,
  units: countSchema.positive(),
  priceMinor: countSchema.positive(),
  currency: currencySchema,
  packVersion: countSchema,
  status: z.enum([
    'PENDING',
    'AWAITING_PAYMENT',
    'PAID',
    'CANCELLED',
    'EXPIRED',
    'FAILED',
  ]),
  paymentStatus: z.enum([
    'NOT_CREATED',
    'PENDING',
    'SUCCEEDED',
    'CANCELLED',
    'EXPIRED',
    'FAILED',
  ]),
  fulfillmentStatus: z.enum(['PENDING', 'FULFILLED']),
  refundStatus: z.enum(['NONE', 'PARTIAL', 'FULL']),
  refundedMinor: countSchema,
  refundedUnits: countSchema,
  fulfilledAt: dateSchema.nullable(),
  providerPaymentId: z.uuid().nullable(),
  // A malformed link must not hide the order or its payment status.
  confirmationUrl: z.string().nullable(),
  paymentUrl: z.string().nullable(),
  expiresAt: dateSchema.nullable(),
  paidAt: dateSchema.nullable(),
  createdAt: dateSchema,
});
const walletSchema: z.ZodType<GenerationWallet> = z.object({
  creditType: creditTypeSchema,
  available: countSchema,
  reserved: countSchema,
  debt: countSchema,
  version: countSchema,
});
const ledgerEntrySchema: z.ZodType<CreditLedgerEntry> = z.object({
  kind: z.enum([
    'GIFT',
    'PURCHASE',
    'RESERVE',
    'COMMIT',
    'RELEASE',
    'REFUND',
    'ADJUSTMENT',
  ]),
  units: countSchema.positive(),
  operationKey: z.string(),
  publicationId: z.uuid().nullable().optional(),
  purchaseOrderId: z.uuid().nullable().optional(),
  createdAt: dateSchema,
  wallet: z.object({ creditType: creditTypeSchema }),
});

export const packsResponseSchema = z.object({ data: z.array(packSchema) });
export const ordersResponseSchema = z.object({ data: z.array(orderSchema) });
export const orderResponseSchema = z.object({ data: orderSchema });
export const walletsResponseSchema = z.object({ data: z.array(walletSchema) });
export const ledgerResponseSchema = z.object({
  data: z.array(ledgerEntrySchema),
});
