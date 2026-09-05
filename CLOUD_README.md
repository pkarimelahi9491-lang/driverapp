# ☁️ Arman Fleet - Cloud Deployment Guide

## 🎯 هدف

انتقال پروژه از معماری Docker-based به **Cloud-first** با استفاده از Supabase.

## 📊 خلاصه تغییرات

| قبلی | جدید |
|------|------|
| Docker + PostgreSQL Local | Supabase Cloud PostgreSQL |
| JWT دستی (bcryptjs) | Supabase Auth + Legacy JWT |
| RBAC Middleware دستی | RLS Policies (امنیت سطح دیتابیس) |
| `.env` محلی | `.env` با Supabase Cloud |

## 🚀 مراحل راه‌اندازی

### مرحله ۱: ساخت پروژه Supabase

1. به [supabase.com](https://supabase.com) برو
2. ثبت‌نام کن و پروژه جدید بساز
3. اطلاعات زیر رو یادداشت کن:
   - **Project URL** (مثلاً `https://abc123.supabase.co`)
   - **anon public key** (شروع با `eyJ...`)
   - **service_role key** (شروع با `eyJ...`)
   - **Database Password**

### مرحله ۲: اجرای SQL Migration

در پنل Supabase:
1. **SQL Editor** → **New Query**
2. فایل‌ها رو به ترتیب اجرا کن:
   - `backend/supabase/migrations/001_initial_schema.sql`
   - `backend/supabase/migrations/002_rls_policies.sql`
   - `backend/supabase/migrations/003_seed_data.sql`

### مرحله ۳: بروزرسانی فایل .env

```bash
cd backend
cp .env.example .env
# فایل .env رو ویرایش کن و مقادیر Supabase رو وارد کن
```

### مرحله ۴: نصب و اجرای Backend

```bash
cd backend
npm install
npm run dev
# تست: http://localhost:3000/api/health
```

### مرحله ۵: اجرای Web Admin

```bash
cd web-admin-react
npm install
npm run dev
# باز کردن: http://localhost:5173
```

### مرحله ۶: اجرای Android App

1. پروژه رو در Android Studio باز کن
2. `app/src/main/java/com/example/config/ApiConfig.kt` رو ویرایش کن
3. `BASE_URL` رو تنظیم کن
4. Run کن

## 📁 ساختار پروژه

```
Arman/
├── backend/                    # Backend API (Node.js + Express)
│   ├── src/
│   │   ├── config/
│   │   │   ├── env.ts         # متغیرهای محیطی
│   │   │   ├── database.ts    # Prisma Client
│   │   │   └── supabase.ts    # Supabase Client ⭐ جدید
│   │   ├── middleware/
│   │   │   └── auth.ts        # Auth (Supabase + Legacy) ⭐ بروزرسانی
│   │   └── modules/           # API Routes
│   ├── supabase/
│   │   └── migrations/        # SQL Migrations ⭐ جدید
│   ├── .env.example           # الگوی متغیرها ⭐ جدید
│   ├── CLOUD_MIGRATION_GUIDE.md # راهنمای انتقال ⭐ جدید
│   └── package.json
├── web-admin-react/            # Web Admin Dashboard
│   ├── src/
│   │   ├── config/
│   │   │   └── supabase.ts    # Supabase Config ⭐ جدید
│   │   ├── services/api.ts    # API Client
│   │   └── context/AuthContext.tsx
│   ├── .env.example           # الگوی متغیرها ⭐ جدید
│   └── vite.config.ts
├── app/                        # Android App
│   └── src/main/java/com/example/
│       ├── config/
│       │   └── ApiConfig.kt   # API Configuration ⭐ جدید
│       ├── data/remote/
│       │   └── RetrofitClient.kt # بروزرسانی ⭐
│       └── data/auth/
│           └── AuthManager.kt
├── driver-app/                 # Standalone HTML Driver App
│   └── index.html
└── CLOUD_README.md             # این فایل ⭐ جدید
```

## 🔐 امنیت

### RLS Policies
- **Driver:** فقط سفرها و کارکرد خودش رو میبینه
- **Admin:** دسترسی کامل به تمام جداول
- **Finance:** دسترسی خواندن به گزارش‌ها

### Secrets
- **SUPABASE_SERVICE_ROLE_KEY:** فقط سمت Backend
- **DATABASE_URL:** شامل رمز دیatabase
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

## 🎯 مزایا

- ✅ **بدون Docker:** نیاز به Docker Desktop نیست
- ✅ **Cloud-first:** از هر جایی قابل دسترسی
- ✅ **Auto Backup:** Supabase خودکار بکاپ میگیره
- ✅ **Free Tier:** برای شروع رایگانه
- ✅ **Scalable:** با رشد پروژه ارتقا پیدا میکنه
- ✅ **Auth built-in:** نیاز به JWT دستی نیست
- ✅ **RLS:** امنیت سطح دیتابیس

## 🧪 تست

### Authentication
```bash
# تست لاگین
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

### Health Check
```bash
curl http://localhost:3000/api/health
```

## 📚 مستندات

- `backend/CLOUD_MIGRATION_GUIDE.md` - راهنمای کامل انتقال
- `backend/supabase/SETUP.md` - راهنمای راه‌اندازی Supabase
- `backend/.env.example` - الگوی متغیرهای محیطی

## ⚠️ نکات مهم

1. **DATABASE_URL:** از پورت `6543` (Transaction Pooler) استفاده کن
2. **RLS:** حتماً RLS policies رو اجرا کن
3. **Service Role Key:** هرگز در Frontend قرار نده
4. **Testing:** حتماً با کاربران مختلف تست کن

## 🎉 تبریک!

حالا پروژه شما **Cloud-based** و **Production-ready** هست! 🚀
