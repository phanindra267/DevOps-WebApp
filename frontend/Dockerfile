# syntax=docker/dockerfile:1
# Multi-stage production image for the Next.js dashboard.
# Stage 1: install dependencies and build the production bundle.
FROM node:20-alpine AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
# API_UPSTREAM is baked into next.config.js at build time.
# Docker Compose uses "http://backend:8080"; Kubernetes uses the full Service DNS.
ARG API_UPSTREAM=http://backend:8080
ENV API_UPSTREAM=${API_UPSTREAM}
RUN npm run build

# Stage 2: minimal runtime image running the production server as non-root.
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

RUN addgroup -S nodejs && adduser -S nextjs -G nodejs

COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.js ./next.config.js

USER nextjs
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "require('http').get('http://127.0.0.1:3000/', r => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

CMD ["npm", "start"]
