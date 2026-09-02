FROM node:20-alpine AS builder

WORKDIR /app

# نصب وابستگی‌های لازم برای Prisma
RUN apk add --no-cache openssl libc6-compat

# کپی فایل‌های پکیج
COPY package*.json ./
COPY prisma ./prisma/

# نصب همه وابستگی‌ها
RUN npm install

# تولید Prisma Client
RUN npx prisma generate

# کپی سورس پروژه
COPY . .

# ساخت پروژه بک‌اند
RUN npm run build


FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# نصب OpenSSL در کانتینر نهایی
RUN apk add --no-cache openssl libc6-compat

# کپی فایل‌های پکیج و Prisma
COPY package*.json ./
COPY prisma ./prisma/

# نصب وابستگی‌های production
RUN npm install --omit=dev

# تولید Prisma Client
RUN npx prisma generate

# کپی خروجی build بک‌اند
COPY --from=builder /app/dist ./dist

# کپی پوشه‌های برنامه‌های استاتیک
COPY --from=builder /app/web-admin-react ./web-admin-react
COPY --from=builder /app/driver-app ./driver-app

# پورت برنامه
EXPOSE 3000

# اجرای برنامه
CMD ["node", "dist/index.js"]
