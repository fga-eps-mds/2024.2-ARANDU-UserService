FROM node:22-alpine AS base

FROM base AS deps
RUN apk add --no-cache libc6-compat

WORKDIR /app

COPY package.json package-lock.json* ./
RUN \
  if [ -f package-lock.json ]; then npm ci; \
  fi


FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

COPY .env .env
RUN npm run build

FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup -g 1001 -S nodejs \
  && adduser -S arandu -u 1001

COPY --chown=arandu:nodejs --from=builder /app/dist ./dist
COPY --chown=arandu:nodejs --from=builder /app/node_modules ./node_modules
COPY --chown=arandu:nodejs --from=builder /app/.env ./.env

USER arandu

EXPOSE 3000

ENV PORT=3000

CMD ["node", "dist/main.js"]