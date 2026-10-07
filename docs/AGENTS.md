# AGENTS.md

## Project
Autobot is a Telegram-first service for creating, scheduling, moderating, and publishing AI-generated posts to Telegram channels.

This repository contains only the Telegram bot application. The business backend lives in `DinarSharipov/autobot-backend`.

## Communication
- All communication with the project owner must be in Russian unless the owner explicitly asks for another language.

## Technology stack
- Node.js
- TypeScript
- grammY
- Docker
- HTTP/REST client for communication with the backend

## Architectural role
The bot is a Telegram UI/transport adapter. It receives Telegram updates, renders menus and conversations, collects user input, and calls the backend API.

The bot MUST NOT contain core business logic and MUST NOT connect directly to PostgreSQL or Redis.

Expected communication:
```
Telegram -> grammY bot -> HTTP -> NestJS backend
```

On the production server both repositories run in Docker on the same host. The bot and API share the external Docker network `autobot-shared`.

Use:
```
BACKEND_URL=http://autobot-api:3000
```

Do not call the backend through the server public IP when internal Docker DNS is available.

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

Telegram Mini App is not required for MVP. Keep the bot thin so a Mini App or web client can be added later without moving business logic out of the bot.

## Engineering rules
- Keep handlers small.
- Put Telegram-specific code in bot modules only.
- Access backend functionality through typed API clients/services.
- Do not import Prisma.
- Do not connect to PostgreSQL.
- Do not connect to Redis/BullMQ.
- Do not implement scheduling with setTimeout/setInterval.
- Do not duplicate subscription rules locally.
- Treat backend responses as the source of truth for domain state.
