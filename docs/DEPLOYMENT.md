# Deployment

## Topology

The bot is deployed as the `autobot-bot` container under `/opt/autobot/bot`.
It joins the external Docker network `autobot-shared` and reaches the backend at
`http://autobot-api:3000`.

The bot deployment owns only `autobot-bot`. It does not deploy or restart the
backend, PostgreSQL, Redis, or Web Admin.

## GitHub environment

Create the `production` environment in the `DinarSharipov/autobot` repository.

Environment secrets:

- `SERVER_HOST`
- `SERVER_PORT`
- `SERVER_USER`
- `SERVER_KNOWN_HOSTS`
- either `SERVER_SSH_KEY` or `SERVER_PASSWORD`
- `TELEGRAM_TOKEN`
- `BOT_SERVICE_ACTIVE_KEY_ID`
- `BOT_SERVICE_ACTIVE_SECRET`

Environment variables:

- `BACKEND_URL=http://autobot-api:3000`
- `LOG_LEVEL=info`

Never commit these values. The deployment workflow renders a temporary
production environment file, transfers it with mode `0600`, and does not copy
server credentials into the container. The two `BOT_SERVICE_*` secrets must
match the active HMAC key configured in `autobot-backend`; they are independent
from `TELEGRAM_TOKEN`.

## Workflow

Pull requests to `dev` run formatting, lint, type checking, tests, and build.
A push to `dev` additionally:

1. builds an immutable container image;
2. publishes it to GHCR with the commit SHA;
3. uploads only the bot Compose files and environment;
4. creates `autobot-shared` when it does not exist;
5. updates only `autobot-bot`;
6. waits for the bot container to become healthy.

The backend deployment must declare the same external network name and the
backend service/container name `autobot-api`.
