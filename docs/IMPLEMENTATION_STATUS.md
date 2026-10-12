# IMPLEMENTATION_STATUS.md

## Current status
The current worktree adds backend HMAC integration, Telegram-user onboarding, menu navigation,
subscription/usage display, channel management, topic management, post creation/publication,
resource editing/archiving, one-time scheduling with pause/resume/cancel controls, and moderation
actions. These changes have not been deployed yet.

Local quality gates, GitHub Actions, production image publication, and SSH deployment pass. The `autobot-bot` container is running and healthy on the production server, and it is attached to the external `autobot-shared` network. The deployment updates only `autobot-bot`.

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
- [x] One-time scheduling UI
- [x] Moderation/revision UI
- [x] Subscription/usage UI
- [ ] Web Admin entry links where needed
- [x] Docker runtime
- [x] CI/CD workflow
- [x] No automated tests by project decision
