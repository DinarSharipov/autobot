# AGENTS.md

## Project
Autobot is a Telegram-first service for creating, scheduling, moderating, and publishing AI-generated posts to Telegram channels.

This repository contains only the Telegram bot application.

Related repositories:
- `DinarSharipov/autobot-backend` — NestJS backend, persistence, queues, scheduling, AI orchestration, subscriptions, and Telegram publishing.
- `DinarSharipov/autobot-web` — standalone React Web Admin.

## Communication
- All communication with the project owner must be in Russian unless the owner explicitly asks for another language.

## Technology stack
- Node.js
- TypeScript
- grammY
- Docker
- HTTP/REST client for communication with the backend

## Architectural role
The bot is a Telegram UI/transport adapter and one client of the common Autobot backend.

The bot MUST NOT contain core business logic and MUST NOT connect directly to PostgreSQL or Redis.

Expected communication:
```
Telegram -> grammY bot -> internal HTTP -> NestJS backend

Browser -> Web Admin (separate repository/server)
        -> public HTTPS -> NestJS backend
```

The bot and backend are deployed on the same server and share the external Docker network `autobot-shared`.

Use:
```
BACKEND_URL=http://autobot-api:3000
```

The Web Admin is deployed separately and does not participate in `autobot-shared`.

## Bot responsibilities
- /start and onboarding
- Telegram commands, callback queries, menus, and conversations
- Channel/topic/post management UI
- Post creation UI
- Moderation UI
- User requests to regenerate or revise generated content
- Schedule configuration UI
- Subscription/usage information UI
- Display backend validation and entitlement errors
- Send notifications to users
- Provide links to the standalone Web Admin where useful

## Core product rules
Supported post modes:
- immediate one-time post
- scheduled one-time post
- scheduled recurring post

Publishing modes:
- AUTO: publish generated content without user approval
- MODERATION: generated content must be reviewed; user may request revisions before approval

Subscription capabilities are enforced by the backend, not by grammY handlers. Limits include at least:
- number of channels
- number of topics
- number of moderation/revision actions
- image generation availability/usage

## Client strategy
- Telegram Mini App / Telegram Web App is NOT part of the product plan.
- Standalone Web Admin is implemented in `DinarSharipov/autobot-web`.
- Web Admin uses the same backend API and user/domain model as the bot.
- Web Admin will be deployed to a different server in the future.

## Engineering rules
- Keep handlers small.
- Put Telegram-specific code in bot modules only.
- Access backend functionality through typed API clients/services.
- Do not import Prisma.
- Do not connect to PostgreSQL.
- Do not connect to Redis/BullMQ.
- Do not implement durable scheduling with in-memory timers.
- Do not duplicate subscription rules locally.
- Do not duplicate Web Admin logic in the bot.
- Treat backend responses as the source of truth for domain state.
