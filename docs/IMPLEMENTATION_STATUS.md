# IMPLEMENTATION_STATUS.md

## Current status
Minimal deployable grammY application initialized. It starts long polling but intentionally contains no product handlers, commands, callbacks, menus, or backend API calls yet.

Local quality gates, production image build, and Compose validation pass. The production server is reachable but currently has no Autobot containers or `autobot-shared` network. The deployment script creates that external network idempotently and updates only `autobot-bot`.

## Approved architecture
- [x] Separate repository for Telegram bot
- [x] Backend in `DinarSharipov/autobot-backend`
- [x] Web Admin in `DinarSharipov/autobot-web`
- [x] Web Admin will run on a separate future server
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
- [x] Password-based SSH deployment configured; a dedicated key remains a future hardening option
- [x] Verified `SERVER_KNOWN_HOSTS` configured in the GitHub `production` environment
- [x] GitHub Actions workflow implementation
- [ ] First deployment validation

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
- [x] grammY bootstrap without product handlers
- [ ] Backend API client
- [ ] Onboarding
- [ ] Channels UI
- [ ] Topics UI
- [ ] Posts UI
- [ ] Scheduling UI
- [ ] Moderation/revision UI
- [ ] Subscription/usage UI
- [ ] Web Admin entry links where needed
- [x] Docker runtime
- [x] CI/CD workflow
- [x] Automated tests for the current scaffold
