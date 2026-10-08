# IMPLEMENTATION_PLAN.md

## Goal
Build the grammY Telegram client for Autobot while keeping all domain logic in `autobot-backend` and interoperating with the standalone `autobot-web` client.

## Planned implementation

### 1. Bootstrap
- Initialize Node.js + TypeScript application.
- Configure grammY.
- Add environment configuration.
- Add structured logging and error handling.
- Add Dockerfile and Docker Compose service.

### 2. Backend integration
- Create a typed HTTP client.
- Configure `BACKEND_URL=http://autobot-api:3000`.
- Add request timeout/retry policy where safe.
- Map backend validation/domain errors to clear Telegram messages.
- Treat the NestJS API as the single source of business rules shared with Web Admin.

### 3. Telegram flows
Implement UI flows for:
- onboarding
- channels
- topics
- posts
- immediate one-time publication
- scheduled one-time publication
- recurring publication
- moderation and approval
- revision requests
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
- Do not implement Web Admin in this repository.
- Web Admin lives in `DinarSharipov/autobot-web`.
- Keep bot flows independent from browser UI.
- Allow links to the standalone Web Admin where useful.

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
- lint/test/build on push/PR
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
