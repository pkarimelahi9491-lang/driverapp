# 🚗 Arman Fleet — سیستم مدیریت ناوگان هلدینگ آرمان انتخاب

سیستم جامع مدیریت مأموریت، سفر، کارکرد و درآمد رانندگان هلدینگ آرمان انتخاب.

## ✨ امکانات

### اپ رانندگان (Driver App)
- ✅ ورود امن با نام کاربری و رمز عبور
- ✅ ثبت سفر با انتخاب مبدأ و مقصد
- ✅ جستجوی خودکار مسیر و نرخ
- ✅ نمایش قیمت سفر
- ✅ لیست سفرهای روز
- ✅ درآمد روزانه و ماهانه
- ✅ ثبت نهایی کارکرد
- ✅ تقویم شمسی

### پنل مدیریت (Admin Dashboard)
- ✅ داشبورد آماری
- ✅ مدیریت رانندگان (افزودن/ویرایش/حذف/فعال/غیرفعال)
- ✅ مدیریت مسیرها و نرخ‌ها
- ✅ مشاهده سفرها و کارکردها
- ✅ تأیید/رد کارکرد رانندگان
- ✅ محاسبه خودکار کارکرد ماهانه
- ✅ گزارش مالی و خروجی CSV
- ✅ لاگ حسابرسی

### Backend API
- ✅ Express + TypeScript
- ✅ PostgreSQL + Prisma ORM
- ✅ Supabase Auth + RLS
- ✅ JWT Authentication
- ✅ Role-Based Access Control (ADMIN/FINANCE/DRIVER)
- ✅ Docker Support

## 🏗️ ساختار پروژه

```
arman-fleet/
├── Dockerfile                    ← Docker اصلی
├── docker-compose.yml            ← اجرا با PostgreSQL
├── DEPLOYMENT.md                 ← راهنمای deployment
├── backend/                      ← Express API
│   ├── prisma/schema.prisma      ← Database Schema
│   ├── supabase/migrations/      ← SQL migrations
│   ├── supabase/seed_auth.ts     ← ساخت کاربران
│   └── src/                      ← سورس کد
├── driver-app/                   ← اپ رانندگان (HTML)
│   └── index.html
├── web-admin-react/              ← پنل ادمین (React)
│   └── src/
└── app/                          ← اپ اندروید (Kotlin)
    └── src/
```

## 🚀 اجرا

### Docker (توصیه شده)

```bash
# ساخت تصویر
docker build -t arman-fleet .

# اجرا
docker run -d -p 3000:3000 \
  -e DATABASE_URL=postgresql://... \
  -e JWT_SECRET=secret \
  arman-fleet
```

### Docker Compose (شامل PostgreSQL)

```bash
docker-compose up -d
```

### دسترسی‌ها

| سرویس | آدرس |
|-------|------|
| API | `http://localhost:3000/api/health` |
| اپ رانندگان | `http://localhost:3000/driver/index.html` |
| پنل ادمین | `http://localhost:3000/admin/` |

## 🔑 رمزهای پیش‌فرض

| بخش | نام کاربری | رمز | نقش |
|-----|-----------|-----|-----|
| ادمین | `admin` | `admin123` | مدیر |
| مالی | `malimedia` | `admin123` | مالی |
| راننده | `d101` | `driver123` | راننده |

## 📚 مستندات

- [راهنمای Deployment](DEPLOYMENT.md)
- [Migration Guide](backend/supabase/MIGRATION_GUIDE.md)
- [Cloud Migration](backend/CLOUD_MIGRATION_GUIDE.md)

## ⚖️ مجوز

پروژه اختصاصی هلدینگ آرمان انتخاب.
