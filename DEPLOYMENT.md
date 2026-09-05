# 🚀 راهنمای Deployment — هلدینگ آرمان انتخاب

## ساختار پروژه

```
arman-fleet/
├── Dockerfile              ← Docker اصلی (برای HamDocker)
├── docker-compose.yml      ← اجرای کامل با PostgreSQL
├── backend/                ← Express + TypeScript API
│   ├── Dockerfile          ← Docker اختصاصی backend
│   ├── prisma/schema.prisma
│   ├── supabase/migrations/  ← SQL migrations برای Supabase Cloud
│   ├── supabase/seed_auth.ts ← ساخت کاربران Auth
│   └── src/                ← سورس کد backend
├── driver-app/             ← اپ رانندگان (HTML standalone)
│   └── index.html
├── web-admin-react/        ← پنل ادمین (React + TypeScript)
│   └── src/
└── app/                    ← اپ اندروید (Kotlin)
```

---

## 🐳 روش ۱: اجرا با Docker (HamDocker یا هر سرویس Docker)

### ۱. ساخت تصویر Docker

```bash
docker build -t arman-fleet .
```

### ۲. اجرا

```bash
docker run -d \
  --name arman-fleet \
  -p 3000:3000 \
  -e DATABASE_URL=postgresql://arman:arman_secret_123@host:5432/arman_fleet \
  -e JWT_SECRET=your-secret-key-here \
  -e NODE_ENV=production \
  arman-fleet
```

### ۳. بررسی سلامت

```bash
# Health Check
curl http://localhost:3000/api/health

# پاسخ مورد انتظار:
# {"success":true,"message":"Arman Entekhab Fleet API is running"}
```

### ۴. دسترسی‌ها

| سرویس | آدرس |
|-------|------|
| API Health | `http://your-server:3000/api/health` |
| اپ رانندگان | `http://your-server:3000/driver/index.html` |
| پنل ادمین | `http://your-server:3000/admin/` |

---

## 🐳 روش ۲: اجرا با Docker Compose (شامل PostgreSQL)

```bash
# راه‌اندازی کامل (Backend + PostgreSQL)
docker-compose up -d

# بررسی وضعیت
docker-compose ps

# مشاهده لاگ‌ها
docker-compose logs -f backend
```

این دستور هم PostgreSQL و هم Backend API رو اجرا میکنه.

---

## 🌐 روش ۳: اجرای Supabase Cloud + HamDocker

### مرحله ۱: ساخت پروژه Supabase (رایگان)

1. برو به [supabase.com](https://supabase.com) و ثبت‌نام کن
2. یک پروژه جدید بساز
3. در پنل، برو به **SQL Editor**

### مرحله ۲: اجرای SQL Migration

به ترتیب در SQL Editor اجرا کن:

```
۱. backend/supabase/migrations/001_initial_schema.sql
   (جداول + Enumها + Indexها + Triggers)

۲. backend/supabase/migrations/002_rls_policies.sql
   (امنیت سطح دیتابیس)

۳. backend/supabase/migrations/003_seed_data.sql
   (مکان‌ها + مسیرها)

۴. backend/supabase/migrations/004_business_logic.sql
   (Functions امن ایجاد سفر و ...)
```

### مرحله ۳: ساخت کاربران Auth

```bash
# متغیرهای محیطی
export SUPABASE_URL=https://xxxxx.supabase.co
export SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJI...

# اجرای seed
cd backend
npx ts-node supabase/seed_auth.ts
```

### مرحله ۴: بروزرسانی .env

فایل `backend/.env` رو بروزرسانی کن:

```env
DATABASE_URL=postgresql://postgres.xxxxx:[YOUR-PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOi...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...
JWT_SECRET=your-random-secret-key
PORT=3000
NODE_ENV=production
CORS_ORIGIN=*
```

### مرحله ۵: Build و Deploy

```bash
# Build Docker image
docker build -t arman-fleet .

# Deploy to HamDocker
# (نحوه deploy بستگی به تنظیمات HamDocker شما دارد)
```

---

## 🔑 رمزهای ورود پیش‌فرض

| بخش | نام کاربری | رمز عبور | نقش |
|-----|-----------|---------|-----|
| پنل ادمین | `admin` | `admin123` | مدیر سیستم |
| پنل مالی | `malimedia` | `admin123` | واحد مالی |
| اپ رانندگان | `d101` | `driver123` | راننده |
| اپ رانندگان | `d102` | `driver123` | راننده |
| اپ رانندگان | `d103` | `driver123` | راننده |
| اپ رانندگان | `d104` | `driver123` | راننده |
| اپ رانندگان | `d105` | `driver123` | راننده (غیرفعال) |

---

## ⚠️ نکات امنیتی برای Production

1. **رمزهای عبور** → حتماً عوض کنید
2. **JWT_SECRET** → یک رشته تصادفی قوی بگذارید
3. **SUPABASE_SERVICE_ROLE_KEY** → فقط سمت Backend باشد
4. **DATABASE_URL** → از connection pooler استفاده کنید
5. **HTTPS** → در Production حتماً فعال کنید

---

## 📋 API Endpoints

| Method | Endpoint | Auth | توضیح |
|--------|----------|------|-------|
| GET | `/api/health` | ❌ | Health Check |
| POST | `/api/auth/login` | ❌ | ورود |
| GET | `/api/auth/me` | ✅ | اطلاعات کاربر |
| GET | `/api/drivers` | ADMIN/FINANCE | لیست رانندگان |
| POST | `/api/drivers` | ADMIN | ایجاد راننده |
| PUT | `/api/drivers/:id` | ADMIN | ویرایش راننده |
| DELETE | `/api/drivers/:id` | ADMIN | حذف راننده |
| GET | `/api/routes` | ✅ | لیست مسیرها |
| POST | `/api/routes/lookup` | ✅ | جستجوی مسیر |
| POST | `/api/trips` | DRIVER | ثبت سفر |
| GET | `/api/trips` | ✅ | لیست سفرها |
| POST | `/api/daily-work/submit` | DRIVER | ارسال نهایی |
| POST | `/api/daily-work/:id/approve` | ADMIN | تأیید |
| GET | `/api/finance/monthly` | ADMIN/FINANCE | گزارش مالی |
| GET | `/api/finance/export/csv` | ADMIN/FINANCE | خروجی CSV |
| GET | `/api/roster/:yearMonth` | ADMIN | لیست رانندگان ماهانه |
| POST | `/api/roster/calculate` | ADMIN | محاسبه خودکار |

---

## 🔧 عیب‌یابی

### خطا: "Cannot find type definition file"
→ فایل `backend/tsconfig.json` باید `include: ["src/**/*.ts"]` داشته باشد (نه `src/**/*`)

### خطا: Docker build fails on `npm run build`
→ مطمئن شو `tsconfig.json` اصلاح شده و `COPY . .` شامل فایل‌های اضافی نیست

### خطا: "Failed to fetch" در اپ رانندگان
→ Backend روی پورت 3000 اجرا شده؟ اگر از Docker استفاده میکنی، پورت رو چک کن

### خطا: "Connection refused" برای PostgreSQL
→ PostgreSQL اجرا شده؟ با `docker-compose up -d` اجرا کن یا Supabase Cloud رو چک کن
