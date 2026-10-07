# IMPLEMENTATION_PLAN.md

## Goal
Build the grammY Telegram client for Autobot while keeping all domain logic in `autobot-backend` and supporting coexistence with the standalone Web Admin.

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
- Treat the NestJS API as the single source of business rules shared with the Web Admin.

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

Moderation state must be shared with the Web Admin through backend persistence/API. A moderation action performed in one client must be visible in the other.

### 5. Web Admin coexistence
- Do not implement Telegram Mini App / Web App.
- Keep bot flows independent from the browser UI.
- Allow the bot to provide links/entry points to the standalone Web Admin where useful.
- Do not store separate user state that conflicts with the common backend account.

### 6. Infrastructure
- Run as container `autobot-bot`.
- Attach only to external Docker network `autobot-shared`.
- Communicate with backend using Docker DNS name `autobot-api`.
- Keep deployment independent from the backend repository.

### 7. CI/CD
- Build and test on push/PR.
- Build Docker image.
- Deploy/restart only the bot service on the shared server.
- Do not restart backend, Web Admin, PostgreSQL, or Redis during bot deployment.

## Out of scope for this repository
- Web Admin implementation
- Telegram authentication for Web Admin
- Prisma/schema/migrations
- PostgreSQL
- Redis/BullMQ
- AI provider integration
- subscription enforcement
- scheduler implementation
- background workers
- direct Telegram scheduled publishing from workers
