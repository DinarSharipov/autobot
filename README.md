# Autobot Bot

grammY service for the Autobot project. The bot resolves Telegram users through
the backend and provides Telegram UI for channels, topics, post generation,
immediate or one-time scheduled publication, moderation, and subscription usage.

Available commands include `/start`, `/menu`, `/channels`, `/topics`, `/posts`,
`/createpost`, `/moderation`, and `/schedules`.

## Local development

Requirements: Node.js 24.11.0 and npm 11.6.0 or newer.

```bash
cp .env.example .env
npm ci
npm run start:dev
```

Required environment variables: `TELEGRAM_TOKEN`, `BOT_SERVICE_ACTIVE_KEY_ID`,
and `BOT_SERVICE_ACTIVE_SECRET`. The service key and secret must match the active
bot HMAC credentials in `autobot-backend`; they must never be committed.

The production backend URL defaults to `http://autobot-api:3000`. Both services
must join the external Docker network `autobot-shared`.

Web Admin development and deployment are postponed. Leave `WEB_ADMIN_URL` empty; when a
standalone Web Admin is introduced later, setting it to its public URL will show an optional entry
button in the bot’s main menu.

## Validation

```bash
npm run locales:check
npm run format:check
npm run lint
npm run typecheck
npm run build
```

Deployment details are documented in [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

The navigation architecture and manual acceptance checklist are documented in
[docs/NAVIGATION.md](docs/NAVIGATION.md).

Localization uses the official grammY i18n plugin with Russian and English Fluent
catalogs. The UI follows the Telegram language, with Russian as the fallback.
Architecture and translation guidelines: [docs/LOCALIZATION.md](docs/LOCALIZATION.md).
