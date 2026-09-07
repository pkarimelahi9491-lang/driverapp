# ═══════════════════════════════════════════════════════════════════
# Arman Fleet - Main Dockerfile
# Multi-stage build: Web Admin + Backend API + Driver App
# ═══════════════════════════════════════════════════════════════════

# ─── Stage 1: Build Web Admin ─────────────────────────────────────
FROM node:20-alpine AS web-admin-builder

WORKDIR /web-admin

COPY web-admin-react/package*.json ./
RUN npm install

COPY web-admin-react/ ./
RUN npm run build


# ─── Stage 2: Build Backend ────────────────────────────────────────
FROM node:20-alpine AS backend-builder

WORKDIR /app

# OpenSSL required by Prisma
RUN apk add --no-cache openssl

# Backend dependencies
COPY backend/package*.json ./
RUN npm install

# Prisma
COPY backend/prisma ./prisma/
RUN npx prisma generate

# Backend source
COPY backend/tsconfig.json ./
COPY backend/src ./src/

# TypeScript build
RUN npx tsc


# ─── Stage 3: Production Runner ───────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

# OpenSSL required by Prisma
RUN apk add --no-cache openssl

# Production dependencies
COPY backend/package*.json ./
RUN npm install --omit=dev

# Prisma
COPY backend/prisma ./prisma/
RUN npx prisma generate

# Compiled backend
COPY --from=backend-builder /app/dist ./dist/

# Web admin
COPY --from=web-admin-builder /web-admin/dist ./web-admin-react/dist/

# Driver web app
COPY driver-app ./driver-app/

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

CMD ["node", "dist/app.js"]
