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

Web Admin development and deployment are postponed. If it is introduced later, it will be deployed
separately and will not participate in `autobot-shared`.

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
- Do not implement or activate Web Admin links while the Web Admin is postponed.

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
- A standalone Web Admin may later be implemented in `DinarSharipov/autobot-web`.
- Any future Web Admin must use the same backend API and user/domain model as the bot.
- Any future Web Admin will be deployed to a different server.

## Engineering rules
- Do not write or add tests for this project.
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

## Maintainability and grammY practices
- Write code that is easy to extend and maintain: use small cohesive modules, explicit typed contracts, and a single source of truth for shared behavior. Avoid duplicated routes, labels, and state cleanup.
- Follow the official grammY documentation and best practices: https://grammy.dev/guide/ and https://grammy.dev/advanced/structuring.html.
- Use Composer to organize middleware. Register global navigation and commands before feature input handlers so navigation works at every step.
- Always await Telegram API calls and middleware `next()`. Answer callback queries promptly and install a top-level `bot.catch` error boundary.
- Keep the main reply keyboard separate from page messages. Feature modules must use the shared page renderer and inline keyboards; never remove or replace the main reply keyboard.
- Keep Telegram's native keyboard hide/show control available: do not enable one-time or forced persistent keyboard behavior.
- Define new sections in the shared section registry and connect their page handlers in the navigation module. Do not register section navigation inside feature modules.
- Use the shared draft store for transient flows. Only one flow may be active per user; navigation and cancellation clear it, and starting another flow replaces it. Do not treat in-memory drafts as durable data.
- Handle stale callbacks and backend version conflicts explicitly. Do not silently swallow unexpected Telegram API failures or retry state-changing backend operations without a deliberate idempotency policy.
- Validate changes using formatting, lint, type checking, and build. Do not add automated tests, in accordance with the project decision above.
- When the owner requests testing, use `docs/E2E_TEST_CASES.md` as the mandatory test checklist and update `docs/E2E_TEST_STATUS.md` during the same work session. Keep every case in one of three statuses: **Готово**, **Не проверено**, or **Ошибка**. For **Ошибка**, record reproducible evidence and the related issue or commit when available.

## Localization
- Use the official `@grammyjs/i18n` plugin with Fluent catalogs in `src/locales`. Use the shared `BotContext` type in Telegram modules.
- All user-facing messages, keyboard labels, validation errors, notifications, and domain status labels must come from localization through `context.t(...)`. Never hardcode UI text in handlers or views.
- Use complete messages with named variables. Do not concatenate translated sentence fragments or interpolate backend error text directly into the UI.
- Keep Russian and English catalogs aligned. Add new keys and the same variable names to every supported locale. Run `npm run locales:check` when changing UI or translations.
- Language follows Telegram's `language_code`; unsupported languages fall back to Russian. Keep commands, callback data, domain codes, and IDs language-independent.
- Match reply-keyboard navigation across supported translations so changing Telegram's language does not break an already displayed keyboard.
- Format dates and numbers through shared locale-aware helpers. The display language does not change the publication time zone.
- User-authored content and backend data such as channel titles, generated text, and plan names are not UI translations. Technical logs and API error identifiers remain stable for operations.
- Register localization before navigation and feature composers in `src/bot/app.ts`. Keep startup/shutdown in `src/main.ts`, rendering in views/UI modules, and backend error presentation in `src/bot/errors.ts`.
