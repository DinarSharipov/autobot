# IMPLEMENTATION_STATUS.md

## Current status
Repository initialized. Architecture documentation added on branch `docs/architecture-bot`.

## Approved architecture
- [x] Separate repository for Telegram bot
- [x] Node.js + TypeScript
- [x] grammY
- [x] Backend accessed over internal HTTP
- [x] Shared Docker network: `autobot-shared`
- [x] Backend DNS name: `autobot-api`
- [x] No direct PostgreSQL access
- [x] No direct Redis access
- [x] Business logic belongs to backend
- [x] Telegram Mini App deferred beyond MVP

## Product decisions captured
- [x] Immediate one-time posts
- [x] Scheduled one-time posts
- [x] Scheduled recurring posts
- [x] AUTO publishing
- [x] MODERATION publishing
- [x] Revision requests during moderation
- [x] Subscription-dependent limits/features

## Implementation progress
- [ ] Application scaffold
- [ ] grammY bootstrap
- [ ] Backend API client
- [ ] Onboarding
- [ ] Channels UI
- [ ] Topics UI
- [ ] Posts UI
- [ ] Scheduling UI
- [ ] Moderation/revision UI
- [ ] Subscription/usage UI
- [ ] Docker runtime
- [ ] CI/CD
- [ ] Automated tests
