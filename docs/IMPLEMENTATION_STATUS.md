# IMPLEMENTATION_STATUS.md

## Current status
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
