FROM node:24.11.0-alpine AS dependencies

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

FROM dependencies AS build

COPY tsconfig.json tsconfig.build.json ./
COPY src ./src
COPY scripts/build.mjs ./scripts/build.mjs
RUN npm run build

FROM dependencies AS production-dependencies

RUN npm prune --omit=dev

FROM node:24.11.0-alpine AS runtime

ENV NODE_ENV=production
WORKDIR /app

COPY --from=production-dependencies --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist
COPY --chown=node:node package.json ./package.json

USER node

CMD ["node", "dist/main.js"]
