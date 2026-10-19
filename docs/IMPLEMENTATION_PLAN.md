# IMPLEMENTATION_PLAN.md

> Product decision (2026-10-19): [Generation packs and prepaid balances](GENERATION_PACKS_PLAN.md) supersedes subscription tiers/monthly quotas and the old exclusion of image preview. The transition is planned, not implemented. Legacy behavior and historical verification below must not be treated as the new billing contract.

## Goal
Build the grammY Telegram client for Autobot while keeping all domain logic in `autobot-backend` and interoperating with the standalone `autobot-web` client.

> **Current product scope:** development and deployment of the Web Admin are postponed. The
> Telegram bot is the only active client. Keep the backend contract ready for a future Web Admin,
> but do not add Web Admin features, deployment work, or browser authentication tasks until the
> product decision is revised.

## Planned implementation

### 1. Bootstrap
- Initialize Node.js + TypeScript application.
- Configure grammY.
- Add environment configuration.
- Add structured logging and error handling.
- Add Dockerfile and Docker Compose service.

### 2. Backend integration
- [x] Create a typed HTTP client with HMAC service authentication.
- Configure `BACKEND_URL=http://autobot-api:3000`.
- [x] Add request timeout/retry policy where safe.
- Map backend validation/domain errors to clear Telegram messages.
- Treat the NestJS API as the single source of business rules shared with Web Admin.

### 3. Telegram flows
Implement UI flows for:
- [x] onboarding
- [x] channels
- [x] list and creation of topics
- [x] posts
- [x] immediate one-time publication
- [x] scheduled one-time publication
- [x] recurring publication
- [x] moderation and approval
- [x] revision requests
- subscription/usage status

### 4. Moderation UX
For MODERATION mode:
1. request generation from backend
2. show generated post
3. allow approve / reject / request changes
4. publish only after backend confirms approval

For AUTO mode:
- submit the request and let the backend continue generation/publication without manual approval

Moderation state must be persisted by the backend so changes made from Web Admin are visible in the bot and vice versa.

### 5. Web Admin coexistence
- Do not implement Telegram Mini App / Web App.
- Do not implement or deploy Web Admin at this stage.
- `DinarSharipov/autobot-web` remains a future separate repository.
- Keep bot flows independent from browser UI.
- Keep the optional Web Admin link disabled until the Web Admin is implemented and deployed.

### 6. Infrastructure
- Run as container `autobot-bot`.
- Attach to external Docker network `autobot-shared`.
- Communicate with backend using Docker DNS name `autobot-api`.
- Bot and backend are deployed to the same server.
- Web Admin is deployed independently to another server.

### 7. CI/CD
GitHub Actions deployment secrets for the current bot server:
- `SERVER_HOST`
- `SERVER_PORT`
- `SERVER_USER`
- `SERVER_SSH_KEY`
- `SERVER_KNOWN_HOSTS`

Pipeline goals:
- format/lint/typecheck/build on push/PR
- build Docker image
- deploy/restart only the bot service
- do not restart backend/PostgreSQL/Redis
- do not manage Web Admin deployment from this repository

## Out of scope for this repository
- Web Admin implementation/deployment
- Telegram authentication for Web Admin
- Prisma/schema/migrations
- PostgreSQL
- Redis/BullMQ
- AI provider integration
- subscription enforcement
- scheduler implementation
- background workers
- direct scheduled publishing from workers

## Priority: generation packs migration (2026-10-19)

## Telegram client delivery plan

- [ ] Replace subscription/tariff screens with Balance, Buy texts, Buy images and purchase history.
- [ ] Show both available balances, reservations, pack quantity/price and payment states from backend.
- [ ] Show "3 included revisions remaining" per generated post occurrence and refresh after each operation.
- [ ] On fourth/later revision show a 1 TEXT confirmation; on every image replacement show 1 IMAGE.
- [ ] Support image preview, replacement and approval before channel publication in MODERATION mode.
- [ ] Handle stale callbacks, version conflicts, depleted balances, top-up and blocked occurrence resume.
- [ ] Do not grant credits on return from checkout; wait for backend-confirmed order/payment status.
- [ ] Update typed API client and RU/EN Fluent catalogs; do not duplicate wallet or payment logic.
- [ ] Update and manually execute docs/E2E_TEST_CASES.md; record new cases as Не проверено until executed.
  Preserve the repository decision not to add automated tests; run locales:check, formatting, lint,
  typecheck and build when implementing client code.

Use [GENERATION_PACKS_PLAN.md](GENERATION_PACKS_PLAN.md) as the billing contract; supersede conflicting legacy tasks above.

## Purchase integration coordination — 2026-10-19

Status: planned only; this documentation does not activate checkout or deploy billing.
Backend owns prices, orders, payment verification and credit accounting. Clients only display
backend state. Canonical prices and the one-time gift (3 TEXT + 1 IMAGE) are maintained in
[backend PRICING.md](https://github.com/DinarSharipov/autobot-backend/blob/dev/docs/PRICING.md);
do not copy price tables or gift constants into clients.

Delivery order: backend contracts and wallets -> backend test checkout and reconciliation ->
bot purchase UI -> integrated acceptance and legacy cutover -> production payment activation.
Web Admin work remains deferred and is not a prerequisite for bot/backend checkout.
Use hosted YooKassa redirect checkout as the technical MVP scenario; no recurring payments.
Telegram requires Stars for digital services sold inside Telegram; an external redirect does not
remove that requirement. Record the production sales-channel decision before enabling the bot
purchase entry point. Keep payment adapters separate from wallet accounting.
Reference: https://core.telegram.org/bots/payments-stars

Proposed shared contracts (finalize in backend OpenAPI before implementation):
- GET /api/v1/billing/packs: server catalogue, version, credit type, quantity, RUB amount.
- GET /api/v1/billing/balance: available/reserved TEXT and IMAGE.
- POST /api/v1/billing/orders: pack ID, catalogue version and stable idempotency key;
  derive owner from authenticated identity and calculate price server-side.
- GET /api/v1/billing/orders and GET /api/v1/billing/orders/{id}: owned purchase history/status,
  payment status, fulfillment status, confirmation URL when applicable.
- GET /api/v1/billing/ledger: owned credit-operation history.
- POST /api/v1/billing/webhooks/yookassa: provider notification endpoint, independently verified;
  not protected by bot HMAC or browser session middleware.
Routes are proposals, not implemented endpoints. Payment status and credit fulfillment status
must be distinguishable; clients never infer a grant from a redirect or provider status alone.

### Telegram client implementation checklist

- [ ] Replace subscription navigation with Balance, Buy texts, Buy images, Orders/history.
  Obtain prices, quantities, gift information and balances from backend, without local constants.
- [ ] Extend the typed HMAC backend client with catalogue, balances, create-order, owned order
  status/history and ledger contracts. Keep YooKassa credentials/API/webhooks out of this repo.
- [ ] Show pack quantity and exact RUB price before creating an order. Persist/reuse the same
  purchase operation key for retries and duplicate callbacks; a deliberate new purchase is separate.
- [ ] Display hosted confirmation_url returned by backend and a Check payment action for that
  order. Show pending/canceled/verification-delayed/paid-but-not-yet-credited/fulfilled states.
  Returning to the bot or pressing Check payment must never grant credits locally.
- [ ] Recover pending purchases from backend after bot restart; handle stale callbacks, ownership
  errors, changed catalogue versions and already fulfilled orders without creating duplicate orders.
- [ ] Integrate durable payment-result notifications with the backend-owned delivery contract.
  Refresh balances after fulfillment; handle blocked bot/message delivery independently of payment.
- [ ] For insufficient balance show the relevant TEXT/IMAGE top-up and retain the blocked operation
  reference. Resume through backend after confirmed funds; do not silently auto-buy or auto-spend.
- [ ] Show remaining included text revisions and explicitly confirm 1 TEXT for extra revisions
  and 1 IMAGE for every image replacement using backend cost/version checks.
- [ ] Register small billing handlers through shared navigation/section registry, preserve the
  main keyboard and clear transient flows on navigation. Localize all messages in RU/EN Fluent.
- [ ] Update manual E2E checklist/status for successful/canceled/pending payments, repeated clicks,
  redirect without payment, restart, wrong order owner, delayed grant and post-top-up resume.
  Start cases as Не проверено; preserve the rule not to add automated bot tests.
- [ ] Run locales:check, formatting, lint, typecheck and build during implementation.
- [ ] Release only against compatible backend contracts; keep purchase entry disabled until the
  production sales-channel decision and backend payment activation are recorded.
