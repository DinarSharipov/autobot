# IMPLEMENTATION_PLAN.md

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
