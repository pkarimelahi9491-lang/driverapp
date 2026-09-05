# 📋 راهنمای Migration — Arman Fleet → Supabase

## A) ترتیب اجرای Migrationها

### در پنل Supabase → SQL Editor

```
مرحله ۱: 001_initial_schema.sql
  ↓ جداول + Enumها + Indexها + Triggerها
مرحله ۲: 002_rls_policies.sql
  ↓ RLS Policies + Helper Functions
مرحله ۳: 003_seed_data.sql
  ↓ کاربران + رانندگان + مکان‌ها + مسیرها
```

**نکته:** فایل‌ها باید دقیقاً به همین ترتیب اجرا شوند.
چون `002` به جداول `001` وابسته‌ست، و `003` به هر دو.

---

## B) توضیح Authentication و RLS

### چگونه RLS کار میکنه؟

```
۱. کاربر لاگین میکنه → Supabase Auth JWT صادر میکنه
۲. Frontend/Android توکن رو ذخیره میکنه
۳. هر درخواست API شامل Authorization: Bearer <token> هست
۴. Supabase توکن رو تأیید میکنه و اطلاعات رو در request.jwt.claims قرار میده
۵. PostgreSQL RLS policies اطلاعات رو میخونه و تصمیم میگیره
```

### چگونه Role خوانده میشه؟

Supabase Auth نقش کاربر رو در `app_metadata.role` ذخیره میکنه.
وقتی کاربر لاگین میکنه، این اطلاعات در JWT قرار میگیره:

```json
{
  "sub": "uuid",
  "app_metadata": {
    "role": "ADMIN"
  },
  "user_metadata": {},
  "aud": "authenticated"
}
```

تابع `auth.user_role()` در PostgreSQL این JWT رو میخونه:

```sql
SELECT current_setting('request.jwt.claims', true)::json->'app_metadata'->>'role';
```

### سازگاری با Legacy JWT

اگر از سیستم JWT قدیمی (bcryptjs) استفاده میکنی:
- Backend توکن رو تأیید میکنه
- قبل از اجرای Query، متغیر session رو تنظیم میکنه:

```sql
SET LOCAL app.current_user_role = 'ADMIN';
```

و تابع `auth.user_role()` اول JWT و بعد session variable رو چک میکنه.

### نقش‌ها و دسترسی‌ها

| جدول | DRIVER | ADMIN | FINANCE |
|------|--------|-------|---------|
| users | فقط خودش | همه | همه |
| drivers | فقط خودش | همه | همه (خواندن) |
| locations | فقط فعال | همه | فقط خواندن |
| routes | فقط فعال | همه | فقط خواندن |
| route_price_history | ❌ | همه | ❌ |
| daily_work_logs | فقط خودش (DRAFT/REJECTED) | همه | فقط خواندن |
| trips | فقط خودش | همه | فقط خواندن |
| financial_periods | ❌ | همه | فقط خواندن |
| route_requests | فقط خودش | همه | ❌ |
| audit_logs | ❌ | همه | فقط خواندن |

### محدودیت‌های Driver

Driver **نمی‌تواند**:
- ❌ قیمت Route رو تغییر دهد
- ❌ قیمت Trip رو تغییر دهد (snapshot_price فقط هنگام ایجاد)
- ❌ اطلاعات Driver دیگر رو ببیند
- ❌ کارکرد Finalized رو تغییر دهد
- ❌ Route جدید ایجاد کند
- ❌ گزارش مالی کل شرکت رو ببیند

Driver **می‌تواند**:
- ✅ Trip جدید برای خودش ثبت کند
- ✅ Trip خودش رو حذف کند (فقط اگر DRAFT/REJECTED باشه)
- ✅ کارکرد روزانه خودش رو ببیند
- ✅ کارکرد رو Finalize کند
- ✅ درخواست مسیر جدید ثبت کند

---

## C) تست‌های بعد از Migration

### ۱. بررسی جداول

```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

باید ۱۰ جدول ببینید:
`audit_logs`, `daily_work_logs`, `drivers`, `financial_periods`,
`locations`, `route_price_history`, `route_requests`, `routes`,
`trips`, `users`

### ۲. بررسی Enumها

```sql
SELECT typname, enumlabel FROM pg_enum
JOIN pg_type ON pg_enum.enumtypid = pg_type.oid
ORDER BY typname, enumsortorder;
```

### ۳. بررسی RLS

```sql
SELECT tablename, rowsecurity FROM pg_tables
WHERE schemaname = 'public';
```

باید برای تمام جداول `rowsecurity = true` باشه.

### ۴. بررسی Indexها

```sql
SELECT indexname, tablename FROM pg_indexes
WHERE schemaname = 'public' AND indexname LIKE 'idx_%';
```

### ۵. بررسی Triggerها

```sql
SELECT trigger_name, event_object_table FROM information_schema.triggers
WHERE trigger_schema = 'public';
```

### ۶. تست لاگین (از Backend)

```bash
# از terminal
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

### ۷. تست RLS (از Supabase SQL Editor)

```sql
-- تست: Admin باید همه چیز رو ببینه
SET request.jwt.claims = '{"sub":"11111111-1111-1111-1111-111111111101","app_metadata":{"role":"ADMIN"}}';
SELECT count(*) FROM users;  -- باید 7 باشه

-- تست: Driver باید فقط خودش رو ببینه
SET request.jwt.claims = '{"sub":"11111111-1111-1111-1111-111111111103","app_metadata":{"role":"DRIVER"}}';
SELECT count(*) FROM users;  -- باید 1 باشه
SELECT count(*) FROM trips;  -- باید 0 باشه (هنوز سفری ثبت نشده)
```

### ۸. تست Seed Data

```sql
SELECT count(*) FROM users;      -- باید 7 باشه
SELECT count(*) FROM drivers;    -- باید 5 باشه
SELECT count(*) FROM locations;  -- باید 80 باشه
SELECT count(*) FROM routes;     -- باید 41 باشه
```

### ۹. تست Foreign Keys

```sql
-- بررسی رابطه Driver → User
SELECT d.driver_code, u.username, u.role
FROM drivers d
JOIN users u ON d.user_id = u.id;

-- بررسی رابطه Route → Location
SELECT r.route_code, lo.name AS origin, ld.name AS destination
FROM routes r
JOIN locations lo ON r.origin_id = lo.id
JOIN locations ld ON r.destination_id = ld.id
LIMIT 5;
```

### ۱۰. تست Price Snapshot

```sql
-- قیمت فعلی Route
SELECT route_code, current_price FROM routes WHERE route_code = 'AR-01-01';
-- باید 90000 باشه

-- بعد از تغییر قیمت (فرضی)
-- UPDATE routes SET current_price = 100000 WHERE route_code = 'AR-01-01';

-- Trip قبلی همچنان باید 90000 باشه
-- (snapshot_price هنگام ایجاد Trip ذخیره شده)
```

---

## D) نکات امنیتی

1. **Service Role Key:** هرگز در Frontend/Android قرار نده
2. **RLS:** حتماً قبل از استفاده تست کن
3. **Bcrypt Hashes:** در seed از hash واقعی استفاده شده
4. **Snapshot Price:** قیمت Trip فقط هنگام ایجاد ذخیره میشه
5. **Finalized:** بعد از Finalize، Driver نمیتونه تغییر بده
