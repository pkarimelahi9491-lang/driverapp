# ☁️ راهنمای انتقال به Cloud (Supabase)

## 📋 خلاصه تغییرات

| قبلی | جدید |
|------|------|
| Docker + PostgreSQL Local | Supabase Cloud PostgreSQL |
| JWT دستی (bcryptjs) | Supabase Auth (JWT خودکار) |
| RBAC Middleware دستی | RLS Policies (امنیت سطح دیتابیس) |
| `.env` با `DATABASE_URL` محلی | `.env` با `SUPABASE_URL` + `DATABASE_URL` Cloud |

## 🚀 مراحل انتقال

### مرحله ۱: ساخت پروژه Supabase

1. به [supabase.com](https://supabase.com) برو
2. ثبت‌نام کن و پروژه جدید بساز
3. اطلاعات زیر رو یادداشت کن:
   - **Project URL** (مثلاً `https://abc123.supabase.co`)
   - **anon public key** (شروع با `eyJ...`)
   - **service_role key** (شروع با `eyJ...`)
   - **Database Password** (همونی که موقع ساخت وارد کردی)

### مرحله ۲: اجرای SQL Migration

در پنل Supabase:
1. **SQL Editor** → **New Query**
2. فایل `supabase/migrations/001_initial_schema.sql` رو اجرا کن
3. فایل `supabase/migrations/002_rls_policies.sql` رو اجرا کن
4. فایل `supabase/migrations/003_seed_data.sql` رو اجرا کن

### مرحله ۳: بروزرسانی .env

فایل `backend/.env` رو ویرایش کن:

```env
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Database (از Supabase Dashboard > Settings > Database > Connection string)
DATABASE_URL=postgresql://postgres.xxx:password@aws-0-region.pooler.supabase.com:6543/postgres

# بقیه متغیرها...
PORT=3000
NODE_ENV=development
CORS_ORIGIN=*
JWT_SECRET=your-secret-key
```

### مرحله ۴: نصب وابستگی جدید

```bash
cd backend
npm install @supabase/supabase-js
```

### مرحله ۵: تست اتصال

```bash
npm run dev
# مرورگر: http://localhost:3000/api/health
```

## 📁 فایل‌های جدید اضافه شده

| فایل | توضیح |
|------|-------|
| `backend/src/config/supabase.ts` | Supabase Client Configuration |
| `backend/supabase/migrations/001_initial_schema.sql` | Schema Migration |
| `backend/supabase/migrations/002_rls_policies.sql` | RLS Policies |
| `backend/supabase/migrations/003_seed_data.sql` | Seed Data |
| `backend/supabase/SETUP.md` | راهنمای کامل راه‌اندازی |
| `backend/.env.example` | الگوی متغیرهای محیطی |

## 📁 فایل‌های تغییر یافته

| فایل | تغییر |
|------|-------|
| `backend/src/config/env.ts` | اضافه شدن متغیرهای Supabase |
| `backend/package.json` | اضافه شدن `@supabase/supabase-js` |
| `backend/.env.example` | بروزرسانی الگو |

## 🔐 امنیت

### RLS Policies
- **Driver:** فقط سفرها و کارکرد خودش رو میبینه
- **Admin:** دسترسی کامل به تمام جداول
- **Finance:** دسترسی خواندن به گزارش‌ها

### Secrets
- **SUPABASE_SERVICE_ROLE_KEY:** فقط سمت Backend (هرگز در Frontend)
- **DATABASE_URL:** شامل رمز دیتابیس (هرگز در کد)
- **JWT_SECRET:** برای سازگاری با سیستم فعلی

## 🔄 مقایسه Architecture

```
قبلی:
Android App → Backend API (Docker) → PostgreSQL (Docker)
Web Admin → Backend API (Docker) → PostgreSQL (Docker)

جدید:
Android App → Backend API (Node.js) → Supabase Cloud
Web Admin → Backend API (Node.js) → Supabase Cloud
                  ↓
           Supabase Auth (JWT)
           Supabase PostgreSQL (Cloud)
           RLS Policies (امنیت)
```

## ⚠️ نکات مهم

1. **DATABASE_URL:** از پورت `6543` (Transaction Pooler) استفاده کن
2. **RLS:** حتماً RLS policies رو اجرا کن وگرنه امنیت نداری
3. **Service Role Key:** هرگز در Frontend یا Android قرار نده
4. **Testing:** حتماً با کاربران مختلف تست کن

## 🎯 مزایا

- ✅ **بدون Docker:** نیاز به Docker Desktop نیست
- ✅ **Cloud-first:** از هر جایی قابل دسترسی
- ✅ **Auto Backup:** Supabase خودکار بکاپ میگیره
- ✅ **Free Tier:** برای شروع رایگانه
- ✅ **Scalable:** با رشد پروژه ارتقا پیدا میکنه
- ✅ **Auth built-in:** نیاز به JWT دستی نیست
- ✅ **RLS:** امنیت سطح دیتابیس
