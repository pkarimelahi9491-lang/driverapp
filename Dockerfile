FROM node:20-alpine AS builder

WORKDIR /app

# کپی فایل‌های پکیج
COPY package*.json ./
COPY prisma ./prisma/

# نصب تمام وابستگی‌ها (به جای npm ci)
RUN npm install

# تولید کلاینت پریزما
RUN npx prisma generate

# کپی سورس کد و بیلد
COPY . .
RUN npm run build

FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./
COPY prisma ./prisma/

# نصب فقط وابستگی‌های پروداکشن
RUN npm install --only=production
RUN npx prisma generate

# کپی خروجی بیلد از مرحله قبل
COPY --from=builder /app/dist ./dist

EXPOSE 3000

CMD ["node", "dist/index.js"]
