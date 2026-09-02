# -------------------------------------------------------------
# 1. مرحله بیلد فرانت‌اند React
# -------------------------------------------------------------
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend

COPY web-admin-react/package*.json ./
RUN npm install

COPY web-admin-react/ ./
RUN npm run build

# -------------------------------------------------------------
# 2. مرحله بیلد بک‌اند Node.js + Prisma
# -------------------------------------------------------------
FROM node:20-alpine AS backend-builder
WORKDIR /app/backend

RUN apk add --no-cache openssl libc6-compat

COPY backend/package*.json ./
COPY backend/prisma ./prisma/
RUN npm install
RUN npx prisma generate

COPY backend/ ./
RUN npm run build

# -------------------------------------------------------------
# 3. ایمیج نهایی Production
# -------------------------------------------------------------
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
RUN apk add --no-cache openssl libc6-compat

# کپی نیازمندی‌ها و وابستگی‌های پروداکشن بک‌اند
COPY backend/package*.json ./
COPY backend/prisma ./prisma/
RUN npm install --omit=dev
RUN npx prisma generate

# کپی کد کامپایل شده بک‌اند
COPY --from=backend-builder /app/backend/dist ./dist

# کپی خروجی بیلد فرانت‌اند ری‌اکت
COPY --from=frontend-builder /app/frontend/dist ./public/admin

EXPOSE 3000

CMD ["node", "dist/index.js"]
