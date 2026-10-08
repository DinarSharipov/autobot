# IMPLEMENTATION_STATUS.md

## Current status
Repository initialized. Architecture documentation updated for the three-repository deployment model.

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
- [x] `SERVER_HOST` configured in GitHub Actions
- [x] `SERVER_PORT` configured in GitHub Actions
- [x] `SERVER_USER` configured in GitHub Actions
- [x] Dedicated `SERVER_SSH_KEY` configured
- [x] `SERVER_KNOWN_HOSTS` configured
- [ ] GitHub Actions workflow implementation
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
- [ ] Web Admin entry links where needed
- [ ] Docker runtime
- [ ] CI/CD workflow
- [ ] Automated tests
