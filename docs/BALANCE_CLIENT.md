# Balance client — 2026-11-10

This slice adds `/balance`, shared navigation, refresh and the latest 10 ledger operations.
RU/EN display backend-owned available, reserved and debt values for TEXT and IMAGE.
Missing wallets are not interpreted as zero. Legacy subscription stays available until
backend cutover. Purchases remain unavailable. Live verification and deployment are pending.

## Implemented backend contract

Backend `docs/openapi/billing.openapi.json` and controllers supersede the earlier
proposed `/billing/*` routes in IMPLEMENTATION_PLAN.md:

- GET `/api/v1/wallets`: creditType, available, reserved, debt, version.
  This read provisions the onboarding gift idempotently on the backend.
- GET `/api/v1/wallets/ledger?limit=10`: newest owned operations with kind, units,
  operationKey, createdAt, wallet.creditType and optional publication/order references.
  Units are magnitudes; the UI names the operation rather than inventing signs.
- GET `/api/v1/generation-packs`: catalogue; optional creditType.
- POST `/api/v1/purchase-orders`: `{packCode}` with stable Idempotency-Key.
- GET `/api/v1/purchase-orders` and `/api/v1/purchase-orders/{orderId}`: owned orders.
- POST `/api/v1/purchase-orders/{orderId}/payment` and `/payment/check`: test checkout.
- POST `/api/v1/payments/yookassa/webhook`: backend-owned verification.

Wallets, ledger, catalogue, order history and owned order details are integrated through
existing HMAC and GET retry policy. Catalogue and history paginate locally in groups of five;
the backend returns at most 100 recent orders. Order cards show separate payment,
fulfillment and refund states. Refresh only reads the order; it does not query the provider,
create payments or grant credits. Prices come from the catalogue or order snapshot in minor units.
Production payment links and purchase actions are not exposed. Isolated test checkout is a
separate explicit opt-in, disabled by default and rejected in production.
The subsequent isolated, opt-in test flow is documented in
[TEST_CHECKOUT_CLIENT.md](TEST_CHECKOUT_CLIENT.md). Default behavior remains read-only.
No local gifts or grants. Backend prepaid generation remains disabled by default.

## Manual acceptance

1. Open `/balance`, both locale keyboards and `menu:balance`; navigation clears input.
2. Compare both wallets with backend; refresh; check missing data and debt.
3. Compare latest 10 ledger operations, localized kinds/dates and empty state; return to balance.
4. Check backend errors, stale callbacks and the main keyboard.
5. Legacy subscription still opens; checkout actions appear only in the explicitly enabled
   non-production test configuration.
