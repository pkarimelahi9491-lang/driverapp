# ═══════════════════════════════════════════════════════════════════
# Arman Fleet - Main Dockerfile (HamDocker compatible)
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

# Install OpenSSL for Prisma (required on Alpine)
RUN apk add --no-cache openssl

# Copy backend package files
COPY backend/package*.json ./

# Install all dependencies (including devDependencies for build)
RUN npm install

# Copy Prisma schema and generate client
COPY backend/prisma ./prisma/
RUN npx prisma generate

# Copy backend source code only
COPY backend/tsconfig.json ./
COPY backend/src ./src/

# Build TypeScript
RUN npx tsc

# ─── Stage 3: Production Runner ────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

# Install OpenSSL for Prisma runtime
RUN apk add --no-cache openssl

# Copy backend package files
COPY backend/package*.json ./

# Install production dependencies only
RUN npm install --omit=dev

# Copy Prisma schema and generate client for production
COPY backend/prisma ./prisma/
RUN npx prisma generate

# Copy built JavaScript from backend builder
COPY --from=backend-builder /app/dist ./dist/

# Copy built Web Admin from web-admin builder
COPY --from=web-admin-builder /web-admin/dist ./web-admin-react/dist/

# Copy static files: Driver App
COPY driver-app ./driver-app/

# Set environment
ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

CMD ["node", "dist/app.js"]
