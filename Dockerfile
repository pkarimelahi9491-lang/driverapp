FROM node:20-alpine AS builder

WORKDIR /app

# نصب OpenSSL موردنیاز Prisma
RUN apk add --no-cache openssl libc6-compat

# کپی فایل‌های پکیج
COPY package*.json ./
COPY prisma ./prisma/

# نصب وابستگی‌ها
RUN npm install

# تولید کلاینت Prisma
RUN npx prisma generate

# کپی سورس کد و بیلد
COPY . .
RUN npm run build


FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# نصب OpenSSL در کانتینر نهایی
RUN apk add --no-cache openssl libc6-compat

COPY package*.json ./
COPY prisma ./prisma/

# نصب وابستگی‌های production
RUN npm install --omit=dev

# تولید کلاینت Prisma
RUN npx prisma generate

# کپی خروجی build
COPY --from=builder /app/dist 
