#!/usr/bin/env bash
set -Eeuo pipefail

deploy_root='/opt/autobot/bot'
compose=(docker compose -p autobot-bot -f compose.yaml -f compose.prod.yaml --env-file .env)

cd "$deploy_root"

if [[ ! -s .env.next ]]; then
  echo 'Staged production environment file is missing' >&2
  exit 1
fi

chmod 600 .env.next

if [[ -s .env ]]; then
  # Keep the existing production HMAC identity during regular image updates.
  for name in BOT_SERVICE_ACTIVE_KEY_ID BOT_SERVICE_ACTIVE_SECRET; do
    value="$(awk -F= -v key="$name" '$1 == key { value = substr($0, index($0, "=") + 1) } END { print value }' .env)"
    if [[ -z "$value" ]]; then
      echo "Existing production .env is missing $name" >&2
      exit 1
    fi
    printf '%s=%s\n' "$name" "$value" >> .env.next
  done
else
  # A new server has no bot .env; first deploy must receive the same HMAC
  # credentials as the backend through the production GitHub environment.
  for name in BOT_SERVICE_ACTIVE_KEY_ID BOT_SERVICE_ACTIVE_SECRET; do
    if ! grep -q "^$name=.+" .env.next; then
      echo "First deployment requires $name in the rendered environment" >&2
      exit 1
    fi
  done
fi

docker compose -p autobot-bot -f compose.yaml -f compose.prod.yaml \
  --env-file .env.next config --quiet

if [[ -f .env ]]; then
  cp --preserve=mode,timestamps .env .env.previous
fi

mv .env.next .env
chmod 600 .env

docker network inspect autobot-shared >/dev/null 2>&1 || \
  docker network create --driver bridge --attachable autobot-shared >/dev/null

if [[ -z "${GHCR_USER:-}" ]]; then
  echo 'GHCR_USER is required' >&2
  exit 1
fi

IFS= read -r ghcr_token
if [[ -z "$ghcr_token" ]]; then
  echo 'GHCR token is required' >&2
  exit 1
fi

printf '%s' "$ghcr_token" | docker login ghcr.io --username "$GHCR_USER" --password-stdin >/dev/null
unset ghcr_token
trap 'docker logout ghcr.io >/dev/null 2>&1 || true' EXIT

"${compose[@]}" pull autobot-bot
"${compose[@]}" up -d --no-build autobot-bot

for _ in $(seq 1 20); do
  state="$(docker inspect --format '{{.State.Status}}' autobot-bot 2>/dev/null || true)"
  health="$(docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}missing{{end}}' autobot-bot 2>/dev/null || true)"

  if [[ "$state" == 'running' && "$health" == 'healthy' ]]; then
    "${compose[@]}" ps
    exit 0
  fi

  if [[ "$state" == 'exited' || "$state" == 'dead' || "$health" == 'unhealthy' ]]; then
    "${compose[@]}" logs --tail 100 autobot-bot >&2
    exit 1
  fi

  sleep 5
done

"${compose[@]}" logs --tail 100 autobot-bot >&2
echo 'autobot-bot did not become healthy in time' >&2
exit 1
