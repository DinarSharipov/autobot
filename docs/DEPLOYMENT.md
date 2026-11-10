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
- `BOT_SERVICE_ACTIVE_SECRET` — needed on the *first* deployment to a new empty server;
  must match the backend's HMAC secret.

Environment variables:

- `BOT_SERVICE_ACTIVE_KEY_ID` — the same key ID as in the backend.
- `BACKEND_URL=http://autobot-api:3000`
- `LOG_LEVEL=info`
- `WEB_ADMIN_URL=` (leave empty while Web Admin development and deployment are postponed)

Never commit credentials to the repository. The workflow renders a temporary
production environment file, transfers it with mode `0600`, and deploys only
the bot service.

On a **new empty replacement server**, there is no `/opt/autobot/bot/.env`.
The first deployment installs both HMAC values from GitHub Environment settings;
they **must match** `BOT_SERVICE_ACTIVE_KEY_ID` and
`BOT_SERVICE_ACTIVE_SECRET` used by `autobot-backend`.
A later deployment with an existing server-side `.env` preserves those
credentials instead of overwriting them.

### Replacement host procedure

1. Finish the backend's first deployment and confirm that
   `autobot-api`, `autobot-postgres`, `autobot-redis` and
   `autobot-proxy` are healthy.
2. Update the `production` GitHub Environment secret `SERVER_HOST` to the
   replacement host's IP, and `SERVER_KNOWN_HOSTS` to its verified SSH key.
   Set `SERVER_PORT`, `SERVER_USER`, and the corresponding SSH key or password.
3. Configure `TELEGRAM_TOKEN`, shared `BOT_SERVICE_ACTIVE_SECRET`,
   shared `BOT_SERVICE_ACTIVE_KEY_ID`, and
   `BACKEND_URL=http://autobot-api:3000`.
4. Run **Actions → Bot CI/CD → Run workflow** on `dev`.
   The workflow also deploys automatically after future pushes to `dev`.

Do not deploy the bot to the replacement server before the backend is ready.
The Web Admin is still a separate future server.

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
