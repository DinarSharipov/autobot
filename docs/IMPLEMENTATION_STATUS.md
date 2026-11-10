# IMPLEMENTATION_STATUS.md

> Product decision (2026-10-19): [Generation packs and prepaid balances](GENERATION_PACKS_PLAN.md) supersedes subscription tiers/monthly quotas and the old exclusion of image preview. Backend implementation and bot read-only catalog/order views plus prepaid revision/media controls are in place; payment checkout activation and live client acceptance remain pending. Legacy behavior and historical verification below must not be treated as the new billing contract.

## Current status
Checkout review fixes (2026-11-10): fresh owned read after create/replay, explicit payment
recheck for fulfilled orders, refund-aware checkout, safe invalid-link handling and runtime
billing response validation implemented. Automatic retries preserve existing idempotency policy.
Explicit TEXT/IMAGE generation resume from owned publications is implemented with stable request
keys and fresh server status. Manual acceptance and asynchronous result notifications remain pending.

Test checkout (2026-11-10): order creation with stable keys, explicit snapshot-price confirmation,
test payment create/recovery/check, and restart recovery from order history are implemented.
Default off; production mode rejects the enabled test flag. No deployment or live payment run.
See [TEST_CHECKOUT_CLIENT.md](TEST_CHECKOUT_CLIENT.md). Async result notifications remain pending.

Catalogue/order slice (2026-11-10): catalogue and latest 100 owned orders with local pagination,
order detail/refresh, payment/fulfillment/refund states and server prices implemented in RU/EN.
Isolated test checkout is opt-in; production checkout is unavailable. Live acceptance remains pending.

Balance slice (2026-11-10): `/balance`, TEXT/IMAGE available/reserved/debt values, refresh
and latest 10 ledger operations implemented in RU/EN. See [BALANCE_CLIENT.md](BALANCE_CLIENT.md).
Live verification and deployment pending. Legacy subscription stays available.

The current worktree adds backend HMAC integration, localized Telegram-user onboarding, persistent
navigation, channel/topic/post management, one-time and recurring scheduling, moderation actions,
subscription/usage display, safe backend retry policy, and an optional Web Admin entry point.
These changes have not been deployed yet.

Web Admin development and deployment are postponed. The bot is the only active client; leave
`WEB_ADMIN_URL` unset until a standalone Web Admin is implemented and deployed.

Local quality gates pass. The historical production-deployment statement below has not been
re-verified after the current worktree changes.

## Approved architecture
- [x] Separate repository for Telegram bot
- [x] Backend in `DinarSharipov/autobot-backend`
- [ ] Web Admin implementation and deployment (postponed)
- [ ] Web Admin activation on a separate server (postponed)
- [x] Node.js + TypeScript + grammY
- [x] Bot/backend communication over internal Docker network
- [x] Shared Docker network: `autobot-shared`
- [x] Backend DNS name: `autobot-api`
- [x] No direct PostgreSQL/Redis access
- [x] Business logic belongs to backend
- [x] Telegram Mini App / Web App excluded

## CI/CD
- [x] `SERVER_HOST` copied from local `.env` to the GitHub `production` environment
- [x] `SERVER_PORT` copied from local `.env` to the GitHub `production` environment
- [x] `SERVER_USER` copied from local `.env` to the GitHub `production` environment
- [x] `SERVER_PASSWORD` and `TELEGRAM_TOKEN` copied from local `.env` to GitHub secrets
- [x] HMAC credentials kept server-side and preserved during bot deploy
- [x] Password-based SSH deployment configured; a dedicated key remains a future hardening option
- [x] Verified `SERVER_KNOWN_HOSTS` configured in the GitHub `production` environment
- [x] GitHub Actions workflow implementation
- [x] First deployment validation

## Product decisions captured
- [x] Immediate one-time posts
- [x] Scheduled one-time posts
- [x] Scheduled recurring posts
- [x] AUTO publishing
- [x] MODERATION publishing
- [x] Revision requests during moderation
- [x] Subscription-dependent limits/features
- [x] Shared moderation state across bot and Web Admin

## Implementation progress
- [x] Application scaffold
- [x] grammY bootstrap
- [x] `/start` welcome response
- [x] Backend API client with HMAC authentication
- [x] Onboarding
- [x] Channels UI
- [x] Topics UI: list and creation
- [x] Posts UI and immediate publication request
- [x] One-time and recurring scheduling UI
- [x] Moderation/revision UI
- [x] Subscription/usage UI
- [x] Optional Web Admin entry link (disabled until Web Admin is available)
- [x] Docker runtime
- [x] CI/CD workflow
- [x] No automated tests by project decision

## Generation packs transition — 2026-10-19

- [x] Product direction and cross-repository plan documented.
- [ ] Prepaid TEXT/IMAGE balances, orders and payments implemented.
- [ ] Three included text revisions and paid extra revisions implemented.
- [ ] Image preview, paid replacement and selected-image reuse implemented.
- [ ] Legacy migration, client integration and new acceptance checks completed.

Existing checked subscription/usage items above describe legacy implementation only. New billing is not deployed.

## Purchase integration planning — 2026-10-19

- [x] Repository responsibilities, shared proposed API, dependencies and launch preparation
  recorded in [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md#purchase-integration-coordination--2026-10-19).
- [x] Balance, catalogue, order-history and order-detail read UI with typed backend contracts implemented.
- [x] Cost-confirmation flow for paid text revisions and image replacements; selected image controls implemented.
- [x] Isolated test checkout flow with server payment checks and fulfillment states; disabled by default and rejected in production.
- [ ] Production checkout and payment result notifications remain disabled pending sales-channel decision and backend activation.
- [ ] Payment acceptance and deployment verified for this repository's scope.

This update is documentation only; no checkout activation or runtime verification is claimed.
