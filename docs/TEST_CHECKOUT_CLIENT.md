# Test checkout client — 2026-11-10

Implemented against local backend `8299409` controllers, DTOs and
`docs/BILLING_TEST_CHECKOUT.md`. Backend source was inspected; no server, provider,
payment or production flag was changed. Existing uncommitted backend work was preserved.

## Isolation and activation

`BOT_TEST_CHECKOUT_ENABLED=false` is the default. The bot refuses to start with this
flag enabled and `NODE_ENV=production`. The production Compose service and environment
renderer do not forward this flag. Use only a separately configured isolated bot/backend
and database with `NODE_ENV=test` (or development), and set the flag explicitly there.
Do not change the shared production Compose service to enable tests.

Backend additionally requires its test checkout flag, test-user allowlist, test shop and
return URL described in its checkout document. The backend rejects live provider payments.
Provider credentials never belong in bot configuration. Production sales/Stars and global
prepaid activation remain outside this slice.

## Flow and guarantees

1. Select a test pack. A fingerprint binds selection to code, version, quantity, type,
   currency and price; a changed/removed offer requires reopening it.
2. POST `/api/v1/purchase-orders` sends only `{packCode}`. The Idempotency-Key derives
   from authenticated Telegram user, chat and purchase token in the button. Retries,
   process restarts and page recreation preserve it. Reopening the catalogue produces
   fresh tokens for deliberate new purchases.
3. Review the server order snapshot and price. The backend DTO has no catalogue-version
   field, so this confirmation is separate from selection, before payment creation.
4. Explicit confirmation invokes POST `/purchase-orders/{id}/payment`. Backend persists
   and reuses its provider attempt key. No automatic bot retry; explicit recovery targets
   the same order.
5. Open backend HTTPS confirmation URL, then POST `/payment/check`. HTTP success does
   not imply payment success. Pending, succeeded-but-unfulfilled, fulfilled and terminal
   states are distinct. There are no local credit grants.
6. After restart, open the owned order from history and continue. Error pages preserve
   same-callback retry and history. If catalogue changes after an unknown order-create
   result, inspect history before selecting a new offer.
7. Open Balance after fulfillment for current server balances. No automatic purchase,
   generation resume or background payment polling.

Disabled callbacks cannot mutate billing state. Ownership stays backend-authenticated.
Callback data fits Telegram's 64-byte limit. Links require HTTPS without embedded credentials.

## Manual acceptance

Detailed user scenarios and expected backend evidence are maintained in
[PURCHASE_USE_CASES.md](PURCHASE_USE_CASES.md); execution results are tracked in
[E2E_TEST_STATUS.md](E2E_TEST_STATUS.md). The compact checklist below is a summary.

All cases below are **Not verified**; no test-shop payment or live Telegram run was performed.

- CHECKOUT-001: default off; old callbacks blocked; production rejects enabled test flag.
- CHECKOUT-002: isolated allowlisted account; selection creates order only, then price review;
  catalogue change requires reselection, no automatic payment.
- CHECKOUT-003: duplicate clicks, timeout/retry, restart and page recreation reuse the order key;
  reopening catalogue deliberately starts a new purchase.
- CHECKOUT-004: confirm order, create/recover payment; one provider ID; foreign order denied.
- CHECKOUT-005: redirect alone grants nothing; pending/canceled/verification errors/delayed
  fulfillment/fulfilled; exactly one PURCHASE entry after confirmed successful payment.
- CHECKOUT-006: restart, recover through history, recheck fulfilled and open fresh balance.
- CHECKOUT-007: disabled/allowlist/provider/reconciliation errors; unknown create response
  plus changed catalogue; recover through history rather than duplicate order.
- CHECKOUT-008: RU/EN, HTTPS link, separate statuses, stale callbacks and main keyboard.

## Code review fixes — 2026-11-10

- Order creation/replay is followed by an owned GET before rendering: cached creation
  snapshots cannot present an already paid/cancelled order as newly unpaid.
- Separate payment checks remain available for orders with a payment attempt, including
  FULFILLED orders recovered from history. Normal card refresh remains read-only.
- Full/partial refunds take precedence over the original fulfilled message in checkout.
- Invalid/non-HTTPS/credential-bearing links are omitted without losing the order card;
  recovery and payment-check controls remain available.
- Billing envelopes are validated with Zod before use. Body-read failures are handled as
  transport failures; invalid JSON/schema responses become sanitized backend-response errors.
  Automatic retries remain limited to GET and requests carrying an Idempotency-Key.
  Payment create/check POST requests retain explicit user-controlled retry.

Static validation does not constitute live acceptance; all manual cases remain pending.

## Explicit generation resume

Balance now links to owned publications with backend cursor pagination. A publication detail
shows server status and funds block. TEXT resume is offered for a prepaid PENDING occurrence
blocked by insufficient TEXT; IMAGE resume targets the existing BLOCKED_FUNDS media operation.
Both use the implemented backend POST resume routes and stable per-user/operation/version keys.
No new publication, quote, pack purchase or automatic spend is created by the client.
The user explicitly continues previously approved work; backend rechecks eligibility and funds.
After a resume request the publication is reread; queued work is not shown as completed generation.
Transient page tokens expire/clear with navigation; after restart reopen the durable publication
from the list. A fresh server version distinguishes a later explicit retry after a new funds block.

## Remaining work after code review

Manual acceptance and deployment are pending. Durable asynchronous result notifications
require a backend-owned delivery contract; this slice supports user-initiated checks only.
Production Stars, legacy cutover and activation remain pending.
