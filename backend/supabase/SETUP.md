# 🚀 راهنمای راه‌اندازی Supabase

## مرحله ۱: ساخت پروژه Supabase

1. به [supabase.com](https://supabase.com) برو
2. با GitHub یا Email ثبت‌نام کن
3. روی **New Project** کلیک کن
4. اطلاعات زیر رو وارد کن:
   - **Organization:** Arman Fleet (یا اسم دلخواه)
   - **Project Name:** arman-fleet-db
   - **Database Password:** یه رمز قوی انتخاب کن (اینو جایی یادداشت کن!)
   - **Region:** آسیای جنوب شرقی (یا نزدیک‌ترین منطقه)
5. روی **Create New Project** کلیک کن
6. **صبر کن** تا پروژه ساخته بشه (حدود ۲ دقیقه)

## مرحله ۲: دریافت API Keys

بعد از ساخت پروژه:

1. از منوی سمت چپ **Settings** → **API** رو بزن
2. این اطلاعات رو کپی کن:

```
Project URL: https://xxxxxxxx.supabase.co
anon public key: eyJhbGciOiJIUzI1NiIs...
service_role key: eyJhbGciOiJIUzI1NiIs...
```

## مرحله ۳: اجرای SQL Migration

1. از منوی سمت چپ **SQL Editor** رو بزن
2. روی **New Query** کلیک کن
3. محتوای فایل `001_initial_schema.sql` رو کپی-پیست کن
4. روی **Run** کلیک کن
5. **صبر کن** تا تموم بشه

## مرحله ۴: اجرای RLS Policies

1. یه Query جدید بساز
2. محتوای فایل `002_rls_policies.sql` رو کپی-پیست کن
3. روی **Run** کلیک کن

## مرحله ۵: اجرای Seed Data

1. یه Query جدید بساز
2. محتوای فایل `003_seed_data.sql` رو کپی-پیست کن
3. روی **Run** کلیک کن

## مرحله ۶: بروزرسانی فایل .env

فایل `backend/.env` رو باز کن و مقادیر زیر رو جایگزین کن:

```env
# Supabase Configuration
SUPABASE_URL=https://xxxxxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIs...

# Database URL (from Supabase Dashboard > Settings > Database)
DATABASE_URL=postgresql://postgres.xxxxxxxxx:your-password@aws-0-region.pooler.supabase.com:6543/postgres

# Server
PORT=3000
NODE_ENV=development

# CORS
CORS_ORIGIN=*

# JWT (for backward compatibility)
JWT_SECRET=your-random-secret-key-here
```

## مرحله ۷: تست اتصال

1. ترمینال رو باز کن
2. برو به پوشه backend:
   ```bash
   cd backend
   ```
3. وابستگی‌ها رو نصب کن:
   ```bash
   npm install
   ```
4. سرور رو استارت کن:
   ```bash
   npm run dev
   ```
5. مرورگر رو باز کن و این آدرس رو تایپ کن:
   ```
   http://localhost:3000/api/health
   ```
6. اگر این پیام رو دیدی **یعنی موفق بودی** ✅:
   ```json
   {"success":true,"message":"Arman Entekhab Fleet API is running"}
   ```

## مرحله ۸: تست لاگین

1. مرورگر رو باز کن
2. از ابزاری مثل Postman یا curl استفاده کن:

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

3. اگر پاسخ زیر رو دیدی **لاگین موفق** ✅:
   ```json
   {"success":true,"data":{"token":"eyJhbGci...","user":{"id":"...","username":"admin","role":"ADMIN"}}}
   ```

## عیب‌یابی

### مشکل: "Database connection failed"
- مطمئن شو `DATABASE_URL` درسته
- مطمئن شو پورت `6543` (Transaction Pooler) هست نه `5432`

### مشکل: "Invalid API key"
- مطمئن شو `SUPABASE_ANON_KEY` درسته
- از **Settings > API** در پنل Supabase کپی کن

### مشکل: "CORS error"
- مطمئن شو `CORS_ORIGIN=*` در فایل .env هست
- اگر از مرورگر استفاده میکنی، این الزامیه

### مشکل: "RLS policy violation"
- مطمئن شو RLS policies اجرا شدن
- از **Authentication > Policies** در پنل Supabase بررسی کن
