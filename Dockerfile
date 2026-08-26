# syntax=docker/dockerfile:1
FROM node:22-alpine AS base

# ---- deps: install dependencies only ----
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ---- builder: compile the app (also used for one-off `prisma migrate deploy`) ----
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

# ---- runner: production image, running via `next start` ----
# Deliberately NOT using `output: "standalone"`: its bundled server.js never
# completes the streaming SSR response for a route with a Suspense boundary
# doing real async work (our /weather/[city], which has a loading.tsx and
# awaits several provider fetches) - the boundary's content just never
# flushes, so client hydration silently never happens for that subtree.
# Confirmed reproducible with `node .next/standalone/server.js` and absent
# with plain `next start` on the identical build. This costs image size
# (full node_modules instead of the traced standalone subset) in exchange
# for actually working.
FROM base AS runner
WORKDIR /app

RUN apk add --no-cache openssl \
  && addgroup -S -g 1001 nodejs \
  && adduser -S -D -H -u 1001 -G nodejs nextjs

ENV NODE_ENV=production

COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nextjs:nodejs /app/next.config.ts ./next.config.ts

USER nextjs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/api/health || exit 1

CMD ["node_modules/.bin/next", "start", "-p", "3000", "-H", "0.0.0.0"]
