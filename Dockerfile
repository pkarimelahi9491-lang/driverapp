FROM node:20-alpine

WORKDIR /app

# کپی فایل‌های پکیج
COPY package*.json ./
COPY prisma ./prisma/

# نصب پکیج‌ها و تولید کلاینت پریزما
RUN npm ci
RUN npx prisma generate

# کپی کل سورس‌کد و بیلد پروژه
COPY . .
RUN npm run build

# تعیین متغیر محیطی پورت
ENV PORT=3000
EXPOSE 3000

# دستور اجرای برنامه
CMD ["npm", "start"]

