# syntax=docker/dockerfile:1

FROM node:24.16.0-bookworm-slim AS base
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@11.4.0 --activate

FROM base AS deps
RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/server/package.json apps/server/package.json
RUN pnpm install --frozen-lockfile --filter @semoasn/server...

FROM deps AS build
COPY apps/server apps/server
RUN pnpm --filter @semoasn/server build

FROM base AS runner
ENV NODE_ENV=production
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/server/package.json apps/server/package.json
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/server/node_modules ./apps/server/node_modules
COPY --from=build /app/apps/server/dist ./apps/server/dist
WORKDIR /app/apps/server
EXPOSE 8080
CMD ["node", "dist/main.js"]