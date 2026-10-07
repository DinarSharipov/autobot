# AGENTS.md

## Project
Autobot is a Telegram-first service for creating, scheduling, moderating, and publishing AI-generated posts to Telegram channels.

This repository contains only the Telegram bot application. The core backend and the Web Admin live in `DinarSharipov/autobot-backend`.

## Communication
- All communication with the project owner must be in Russian unless the owner explicitly asks for another language.

## Technology stack
- Node.js
- TypeScript
- grammY
- Docker
- HTTP/REST client for communication with the backend

## Architectural role
The bot is one client of the common Autobot backend. It acts as a Telegram UI/transport adapter: receives Telegram updates, renders menus and conversations, collects user input, and calls the backend API.

The bot MUST NOT contain core business logic and MUST NOT connect directly to PostgreSQL or Redis.

Expected communication:
```
Telegram -> grammY bot -> HTTP -> NestJS backend
Web Admin -------------> HTTP -> NestJS backend
```

The grammY bot and the Web Admin are independent clients of the same Application/Domain layer. Domain behavior must stay consistent regardless of which client initiates an action.

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
- Provide Telegram-side entry points that may direct users to the standalone Web Admin when appropriate

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
- A standalone Web Admin is required in MVP.
- The Web Admin uses React + TypeScript and works in a normal browser.
- Authentication for the Web Admin is performed through Telegram.
- The same user account/domain data must be shared between the bot and the Web Admin.

## Engineering rules
- Keep handlers small.
- Put Telegram-specific code in bot modules only.
- Access backend functionality through typed API clients/services.
- Do not import Prisma.
- Do not connect to PostgreSQL.
- Do not connect to Redis/BullMQ.
- Do not implement scheduling with setTimeout/setInterval.
- Do not duplicate subscription rules locally.
- Do not duplicate Web Admin logic in the bot.
- Treat backend responses as the source of truth for domain state.
