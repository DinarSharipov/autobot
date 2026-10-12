# Autobot Bot

Minimal deployable grammY service for the Autobot project. The bot handles
`/start`; callback handlers, menus, and domain flows are not implemented yet.

## Local development

Requirements: Node.js 24.11.0 and npm 11.6.0 or newer.

```bash
cp .env.example .env
npm ci
npm run start:dev
```

Required environment variable: `TELEGRAM_TOKEN`.

The production backend URL defaults to `http://autobot-api:3000`. Both services
must join the external Docker network `autobot-shared`.

## Validation

```bash
npm run format:check
npm run lint
npm run typecheck
npm test
npm run build
```

Deployment details are documented in [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).
