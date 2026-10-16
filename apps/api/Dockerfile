# syntax=docker/dockerfile:1

# ---------- Base ----------
FROM node:22-alpine AS base
RUN corepack enable \
    && corepack prepare pnpm@9.0.0 --activate \
    && apk add --no-cache openssl
WORKDIR /app

# ---------- Install workspace dependencies ----------
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/
COPY packages/db/package.json ./packages/db/
RUN pnpm install --frozen-lockfile --prod=false

# ---------- Build (generate Prisma client) ----------
FROM deps AS builder
COPY . .
RUN pnpm --filter api build

# ---------- Runtime ----------
FROM base AS runner
ENV NODE_ENV=production
COPY --from=builder /app ./
RUN chmod +x apps/api/docker-entrypoint.sh
WORKDIR /app/apps/api
EXPOSE 4000
CMD ["./docker-entrypoint.sh"]
