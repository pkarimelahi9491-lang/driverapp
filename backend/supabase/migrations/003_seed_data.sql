-- ═══════════════════════════════════════════════════════════════════
-- Arman Fleet - Seed Data (Locations + Routes)
-- Run AFTER 001_initial_schema.sql
-- NOTE: Users/Drivers are created via seed_auth.ts (Supabase Auth)
-- ═══════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════
-- STEP 1: Locations — only real locations from CSV data
-- ON CONFLICT DO NOTHING for idempotency
-- ═══════════════════════════════════════════════════════════════════

INSERT INTO locations (name, city, is_active) VALUES
-- Origin (warehouse)
('انبار مرکزی انتخاب (مورچه خورت)', 'اصفهان', true),
-- Tier 1: 30km
('انبار سادات', 'اصفهان', true),
('اقامتگاه مادر شاه', 'اصفهان', true),
('بتن تعادل', 'اصفهان', true),
('پلیس راه شاهین شهر', 'شاهین شهر', true),
('شاهین شهر', 'شاهین شهر', true),
('شهرک صنعتی بزرگ', 'اصفهان', true),
-- Tier 2: 35km
('حاجی آباد شاهین شهر', 'شاهین شهر', true),
('گلدیس', 'اصفهان', true),
-- Tier 3: 40km
('آزادگان', 'اصفهان', true),
('خورزوق', 'خورزوق', true),
('شهرک سیمرغ', 'اصفهان', true),
('علویجه', 'علویجه', true),
('گرگاب', 'گرگاب', true),
('گز', 'گز برخوار', true),
-- Tier 4: 45km
('17شهریور', 'خمینی شهر', true),
('ابوریحان', 'اصفهان', true),
('آفرینش', 'اصفهان', true),
('آل محمد', 'اصفهان', true),
('آل یاسین', 'اصفهان', true),
('امام خمینی', 'خمینی شهر', true),
('امیرکبیر', 'خمینی شهر', true),
('پل چمران', 'اصفهان', true),
('پنج آذر', 'اصفهان', true),
('ترمینال کاوه', 'اصفهان', true),
('خانه اصفهان', 'اصفهان', true),
('خردمند', 'اصفهان', true),
('دستگرد', 'اصفهان', true),
('دولت آباد', 'خمینی شهر', true),
('رزمندگان', 'اصفهان', true),
('شاهپور جدید', 'اصفهان', true),
('شریف', 'اصفهان', true),
('غرضی', 'اصفهان', true),
('فدک', 'اصفهان', true),
('کاوه', 'اصفهان', true),
('گلستان', 'اصفهان', true),
('شهرک صنعتی محمود آباد', 'اصفهان', true),
('مارچین', 'اصفهان', true),
('مشیرالدوله', 'اصفهان', true),
('ملک شهر', 'اصفهان', true),
('صفائیه', 'اصفهان', true),
('نیروگاه', 'اصفهان', true),
-- Tier 5: 50km
('ابن سینا', 'اصفهان', true),
('اشراق', 'اصفهان', true),
('باهنر', 'اصفهان', true),
('برازنده', 'اصفهان', true),
('بعثت', 'اصفهان', true),
('بید آبادی', 'اصفهان', true),
('پارک لاله', 'اصفهان', true),
('پنج رمضان', 'اصفهان', true),
('جابر انصاری', 'اصفهان', true),
('چمران', 'اصفهان', true),
('حکیم شفائی اول', 'اصفهان', true),
('خرازی', 'اصفهان', true),
('دانش', 'اصفهان', true),
('دروازه تهران', 'اصفهان', true),
('رباط', 'اصفهان', true),
('رهنان', 'اصفهان', true),
('زاهد', 'اصفهان', true),
('سروش', 'اصفهان', true),
('شاهپور قدیم', 'اصفهان', true),
('شاهد', 'اصفهان', true),
('شهدا', 'اصفهان', true),
('شهرک صنعتی خمینی شهر', 'خمینی شهر', true),
('شهرک صنعتی دولت آباد', 'خمینی شهر', true),
('شهرک نگین', 'اصفهان', true),
('طالقانی', 'اصفهان', true),
('عسگریه', 'اصفهان', true),
('فردوسی', 'اصفهان', true),
('فروغی', 'اصفهان', true),
('فلاطوری', 'اصفهان', true),
('قدس', 'اصفهان', true),
('مسجد سید', 'اصفهان', true),
('مولوی', 'اصفهان', true),
('میدان امام علی', 'اصفهان', true),
('نگارستان', 'اصفهان', true),
('هسا', 'اصفهان', true),
('وفایی', 'اصفهان', true),
-- Tier 6: 55km
('22بهمن', 'اصفهان', true),
('ابشار', 'اصفهان', true),
('آپادانا', 'اصفهان', true),
('آذر بهرام', 'اصفهان', true),
('احمد آباد', 'اصفهان', true),
('ارباب', 'اصفهان', true),
('استانداری', 'اصفهان', true),
('بزرگمهر', 'اصفهان', true),
('بوستان سعدی', 'اصفهان', true),
('بهشتی', 'اصفهان', true),
('پروین', 'اصفهان', true),
('پل تمدن', 'اصفهان', true),
('پل غدیر', 'اصفهان', true),
('پل فلزی', 'اصفهان', true),
('پل مارنون', 'اصفهان', true),
('پل میر', 'اصفهان', true),
('جهاد', 'اصفهان', true),
('چهارباغ پایین', 'اصفهان', true),
('چهارباغ عباسی', 'اصفهان', true),
('چهارراه تختی', 'اصفهان', true),
('چهارراه قصر', 'اصفهان', true),
('حبیب آباد', 'اصفهان', true),
('حکیم', 'اصفهان', true),
('حکیم شفایی دوم', 'اصفهان', true),
('خزانه', 'اصفهان', true),
('خمینی شهر', 'خمینی شهر', true),
('خواجه عمید', 'اصفهان', true),
('خواجو', 'اصفهان', true),
('دانشگاه صنعتی', 'اصفهان', true),
('دشتستان', 'اصفهان', true),
('دروازه دولت', 'اصفهان', true),
('رکن الدوله', 'اصفهان', true),
('زینبیه', 'اصفهان', true),
('سجاد', 'اصفهان', true),
('شریف واقفی', 'اصفهان', true),
('شمس آبادی', 'اصفهان', true),
('شهرک سلامت', 'اصفهان', true),
('شهرک ولی عصر', 'اصفهان', true),
('شیخ بهایی', 'اصفهان', true),
('شیخ صدوق', 'اصفهان', true),
('شیخ طوسی', 'اصفهان', true),
('شیخ مفید', 'اصفهان', true),
('صمدیه', 'اصفهان', true),
('علامه امینی', 'اصفهان', true),
('میدان احمد آباد', 'اصفهان', true),
('فیض', 'اصفهان', true),
('کاشانی', 'اصفهان', true),
('گلزار', 'اصفهان', true),
('لاله', 'اصفهان', true),
('لاهور', 'اصفهان', true),
('لنبان', 'اصفهان', true),
('محتشم کاشانی', 'اصفهان', true),
('مدرس', 'اصفهان', true),
('مشتاق', 'اصفهان', true),
('معراج', 'اصفهان', true),
('مهرآباد', 'اصفهان', true),
('میدان امام', 'اصفهان', true),
('میدان امام حسین', 'اصفهان', true),
('میر', 'اصفهان', true),
('میرداماد', 'اصفهان', true),
('میمه', 'میمه', true),
('نشاط', 'اصفهان', true),
('هاتف', 'اصفهان', true),
('ولی عصر', 'اصفهان', true),
('هشت بهشت', 'اصفهان', true),
-- Tier 7: 60km
('آتشگاه', 'اصفهان', true),
('ارتش', 'اصفهان', true),
('اطشاران', 'اصفهان', true),
('امیر حمزه', 'اصفهان', true),
('انقلاب', 'اصفهان', true),
('باغ دریاچه', 'اصفهان', true),
('بلوار آیینه خانه', 'اصفهان', true),
('بلوار ملت', 'اصفهان', true),
('بیمارستان میلاد', 'اصفهان', true),
('پل وحید', 'اصفهان', true),
('تالار', 'اصفهان', true),
('ترمینال جی', 'اصفهان', true),
('ترمینال صفه', 'اصفهان', true),
('توحید', 'اصفهان', true),
('جی', 'اصفهان', true),
('جی شیر', 'اصفهان', true),
('چهارباغ بالا', 'اصفهان', true),
('حسین آباد', 'اصفهان', true),
('حکیم نظامی', 'اصفهان', true),
('حمزه', 'اصفهان', true),
('خاقانی', 'اصفهان', true),
('دانشگاه اصفهان', 'اصفهان', true),
('دانشگاه هنر', 'اصفهان', true),
('دروازه شیراز', 'اصفهان', true),
('رودکی', 'اصفهان', true),
('سروستان', 'اصفهان', true),
('سیمین', 'اصفهان', true),
('سهروردی', 'اصفهان', true),
('شریعتی', 'اصفهان', true),
('فرایبورگ', 'اصفهان', true),
('فرح آباد', 'اصفهان', true),
('قائمیه', 'اصفهان', true),
('کشاورز', 'اصفهان', true),
('کوی امیریه', 'اصفهان', true),
('لباف', 'اصفهان', true),
('مرداویج', 'اصفهان', true),
('مهاجر', 'اصفهان', true),
('ناژوان', 'اصفهان', true),
('نظر', 'اصفهان', true),
('هزار جریب', 'اصفهان', true),
('وحید', 'اصفهان', true),
-- Tier 8: 65km
('ارغوانیه', 'اصفهان', true),
('خوراسگان', 'اصفهان', true),
('دهق', 'اصفهان', true),
('کشوری', 'اصفهان', true),
('کوی امام', 'اصفهان', true),
('کهندژ', 'اصفهان', true),
('صفه', 'اصفهان', true),
('نبوی منش', 'اصفهان', true),
('کهریزسنگ', 'اصفهان', true),
-- Tier 9: 70km
('شهرک صنعتی جی', 'اصفهان', true),
('شهرک صنعتی کمشچه', 'کمشچه', true),
('فرودگاه', 'اصفهان', true),
('کمشچه', 'کمشچه', true),
('گمرک', 'اصفهان', true),
-- Tier 10: 75km
('باغ رضوان', 'اصفهان', true),
('درچه', 'درچه', true),
('سپاهان شهر', 'اصفهان', true),
('فلاورجان', 'فلاورجان', true),
('کلیشاد', 'کلیشاد', true),
-- Tier 11: 80km
('اشکاوند', 'نجف‌آباد', true),
('بهاران', 'اصفهان', true),
('جوزدان', 'اصفهان', true),
('قهجاورستان', 'اصفهان', true),
('شهرک صنعتی نجف‌آباد', 'نجف‌آباد', true),
('ویلا شهر', 'نجف‌آباد', true),
-- Tier 12: 85km
('بهارستان', 'بهارستان', true),
('تیران', 'تیران و کرون', true),
('شهر ابریشم', 'اصفهان', true),
('شهرک صنعتی سروش بادران', 'اصفهان', true),
('نجف آباد', 'نجف‌آباد', true),
-- Tier 13: 90km
('نطنز', 'نطنز', true),
-- Tier 14: 95km
('شهرک صنعتی مبارکه', 'مبارکه', true),
('فولاد شهر', 'مبارکه', true),
-- Tier 15: 100km
('چادگان', 'چادگان', true),
('زاینده رود', 'اصفهان', true),
('زرین شهر', 'زرین‌شهر', true),
('سجزی', 'سجزی', true),
('شهرضا', 'شهرضا', true),
('شهرک صنعتی سجزی', 'سجزی', true),
('شهرک صنعتی کوهپایه', 'کوهپایه', true),
('مبارکه', 'مبارکه', true),
('انبار حبیب آباد', 'اصفهان', true),
('زیبا شهر', 'اصفهان', true),
('باغ بهادران', 'اصفهان', true),
('اردستان', 'اردستان', true),
('نائین', 'نائین', true),
('کاشان', 'کاشان', true),
('سمیرم', 'سمیرم', true),
('فرودگاه شهید بهشتی', 'اصفهان', true)
ON CONFLICT (name) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════
-- STEP 2: Routes — using subqueries for location IDs
-- Run from CSV price data: 90,000 Toman per km baseline
-- ═══════════════════════════════════════════════════════════════════

DO $$
DECLARE
  v_origin_id INTEGER;
  v_dest_id INTEGER;
BEGIN
  -- Get origin
  SELECT id INTO v_origin_id FROM locations WHERE name = 'انبار مرکزی انتخاب (مورچه خورت)' LIMIT 1;

  IF v_origin_id IS NULL THEN
    RAISE NOTICE 'Origin location not found. Skipping route seed.';
    RETURN;
  END IF;

  -- ── Tier 1: Shahin Shahr (30km, 2,700,000 TOMAN) ──
  SELECT id INTO v_dest_id FROM locations WHERE name = 'شاهین شهر' LIMIT 1;
  IF v_dest_id IS NOT NULL THEN
    INSERT INTO routes (route_code, origin_id, destination_id, current_price, currency, distance_km, rate_per_km, is_active, description)
    SELECT 'AR-01-01', v_origin_id, v_dest_id, 2700000, 'TOMAN', 30, 90000, true, 'انبار مرکزی ← شاهین شهر (۳۰ کیلومتر)'
    WHERE NOT EXISTS (SELECT 1 FROM routes WHERE route_code = 'AR-01-01');
    INSERT INTO route_price_history (route_id, route_code, old_price, new_price, changed_by, effective_date)
    SELECT id, 'AR-01-01', 0, 2700000, 'seed', TO_CHAR(NOW(), 'YYYY-MM-DD')
    FROM routes WHERE route_code = 'AR-01-01'
    AND NOT EXISTS (SELECT 1 FROM route_price_history WHERE route_code = 'AR-01-01');
  END IF;

  -- ── Tier 1: Goldis (35km, 3,150,000 TOMAN) ──
  SELECT id INTO v_dest_id FROM locations WHERE name = 'گلدیس' LIMIT 1;
  IF v_dest_id IS NOT NULL THEN
    INSERT INTO routes (route_code, origin_id, destination_id, current_price, currency, distance_km, rate_per_km, is_active, description)
    SELECT 'AR-02-01', v_origin_id, v_dest_id, 3150000, 'TOMAN', 35, 90000, true, 'انبار مرکزی ← گلدیس (۳۵ کیلومتر)'
    WHERE NOT EXISTS (SELECT 1 FROM routes WHERE route_code = 'AR-02-01');
    INSERT INTO route_price_history (route_id, route_code, old_price, new_price, changed_by, effective_date)
    SELECT id, 'AR-02-01', 0, 3150000, 'seed', TO_CHAR(NOW(), 'YYYY-MM-DD')
    FROM routes WHERE route_code = 'AR-02-01'
    AND NOT EXISTS (SELECT 1 FROM route_price_history WHERE route_code = 'AR-02-01');
  END IF;

  -- ── Tier 4: Doostabad (45km, 4,050,000 TOMAN) ──
  SELECT id INTO v_dest_id FROM locations WHERE name = 'دولت آباد' LIMIT 1;
  IF v_dest_id IS NOT NULL THEN
    INSERT INTO routes (route_code, origin_id, destination_id, current_price, currency, distance_km, rate_per_km, is_active, description)
    SELECT 'AR-04-14', v_origin_id, v_dest_id, 4050000, 'TOMAN', 45, 90000, true, 'انبار مرکزی ← دولت آباد (۴۵ کیلومتر)'
    WHERE NOT EXISTS (SELECT 1 FROM routes WHERE route_code = 'AR-04-14');
    INSERT INTO route_price_history (route_id, route_code, old_price, new_price, changed_by, effective_date)
    SELECT id, 'AR-04-14', 0, 4050000, 'seed', TO_CHAR(NOW(), 'YYYY-MM-DD')
    FROM routes WHERE route_code = 'AR-04-14'
    AND NOT EXISTS (SELECT 1 FROM route_price_history WHERE route_code = 'AR-04-14');
  END IF;

  -- ── Tier 6: Khomeini Shahr (55km, 4,950,000 TOMAN) ──
  SELECT id INTO v_dest_id FROM locations WHERE name = 'خمینی شهر' LIMIT 1;
  IF v_dest_id IS NOT NULL THEN
    INSERT INTO routes (route_code, origin_id, destination_id, current_price, currency, distance_km, rate_per_km, is_active, description)
    SELECT 'AR-06-01', v_origin_id, v_dest_id, 4950000, 'TOMAN', 55, 90000, true, 'انبار مرکزی ← خمینی شهر (۵۵ کیلومتر)'
    WHERE NOT EXISTS (SELECT 1 FROM routes WHERE route_code = 'AR-06-01');
    INSERT INTO route_price_history (route_id, route_code, old_price, new_price, changed_by, effective_date)
    SELECT id, 'AR-06-01', 0, 4950000, 'seed', TO_CHAR(NOW(), 'YYYY-MM-DD')
    FROM routes WHERE route_code = 'AR-06-01'
    AND NOT EXISTS (SELECT 1 FROM route_price_history WHERE route_code = 'AR-06-01');
  END IF;

  -- ── Tier 7: Jey (60km, 5,400,000 TOMAN) ──
  SELECT id INTO v_dest_id FROM locations WHERE name = 'جی' LIMIT 1;
  IF v_dest_id IS NOT NULL THEN
    INSERT INTO routes (route_code, origin_id, destination_id, current_price, currency, distance_km, rate_per_km, is_active, description)
    SELECT 'AR-07-01', v_origin_id, v_dest_id, 5400000, 'TOMAN', 60, 90000, true, 'انبار مرکزی ← جی (۶۰ کیلومتر)'
    WHERE NOT EXISTS (SELECT 1 FROM routes WHERE route_code = 'AR-07-01');
    INSERT INTO route_price_history (route_id, route_code, old_price, new_price, changed_by, effective_date)
    SELECT id, 'AR-07-01', 0, 5400000, 'seed', TO_CHAR(NOW(), 'YYYY-MM-DD')
    FROM routes WHERE route_code = 'AR-07-01'
    AND NOT EXISTS (SELECT 1 FROM route_price_history WHERE route_code = 'AR-07-01');
  END IF;

  -- ── Tier 8: Kahrizak/Asgharabad (65km, 5,850,000 TOMAN) ──
  SELECT id INTO v_dest_id FROM locations WHERE name = 'صفه' LIMIT 1;
  IF v_dest_id IS NOT NULL THEN
    INSERT INTO routes (route_code, origin_id, destination_id, current_price, currency, distance_km, rate_per_km, is_active, description)
    SELECT 'AR-08-01', v_origin_id, v_dest_id, 5850000, 'TOMAN', 65, 90000, true, 'انبار مرکزی ← صفه (۶۵ کیلومتر)'
    WHERE NOT EXISTS (SELECT 1 FROM routes WHERE route_code = 'AR-08-01');
    INSERT INTO route_price_history (route_id, route_code, old_price, new_price, changed_by, effective_date)
    SELECT id, 'AR-08-01', 0, 5850000, 'seed', TO_CHAR(NOW(), 'YYYY-MM-DD')
    FROM routes WHERE route_code = 'AR-08-01'
    AND NOT EXISTS (SELECT 1 FROM route_price_history WHERE route_code = 'AR-08-01');
  END IF;

  -- ── Tier 9: Airport (70km, 6,300,000 TOMAN) ──
  SELECT id INTO v_dest_id FROM locations WHERE name = 'فرودگاه' LIMIT 1;
  IF v_dest_id IS NOT NULL THEN
    INSERT INTO routes (route_code, origin_id, destination_id, current_price, currency, distance_km, rate_per_km, is_active, description)
    SELECT 'AR-09-01', v_origin_id, v_dest_id, 6300000, 'TOMAN', 70, 90000, true, 'انبار مرکزی ← فرودگاه (۷۰ کیلومتر)'
    WHERE NOT EXISTS (SELECT 1 FROM routes WHERE route_code = 'AR-09-01');
    INSERT INTO route_price_history (route_id, route_code, old_price, new_price, changed_by, effective_date)
    SELECT id, 'AR-09-01', 0, 6300000, 'seed', TO_CHAR(NOW(), 'YYYY-MM-DD')
    FROM routes WHERE route_code = 'AR-09-01'
    AND NOT EXISTS (SELECT 1 FROM route_price_history WHERE route_code = 'AR-09-01');
  END IF;

  -- ── Tier 10: Falavarjan (75km, 6,750,000 TOMAN) ──
  SELECT id INTO v_dest_id FROM locations WHERE name = 'فلاورجان' LIMIT 1;
  IF v_dest_id IS NOT NULL THEN
    INSERT INTO routes (route_code, origin_id, destination_id, current_price, currency, distance_km, rate_per_km, is_active, description)
    SELECT 'AR-10-01', v_origin_id, v_dest_id, 6750000, 'TOMAN', 75, 90000, true, 'انبار مرکزی ← فلاورجان (۷۵ کیلومتر)'
    WHERE NOT EXISTS (SELECT 1 FROM routes WHERE route_code = 'AR-10-01');
    INSERT INTO route_price_history (route_id, route_code, old_price, new_price, changed_by, effective_date)
    SELECT id, 'AR-10-01', 0, 6750000, 'seed', TO_CHAR(NOW(), 'YYYY-MM-DD')
    FROM routes WHERE route_code = 'AR-10-01'
    AND NOT EXISTS (SELECT 1 FROM route_price_history WHERE route_code = 'AR-10-01');
  END IF;

  -- ── Tier 11: Najafabad (80km, 7,200,000 TOMAN) ──
  SELECT id INTO v_dest_id FROM locations WHERE name = 'نجف آباد' LIMIT 1;
  IF v_dest_id IS NOT NULL THEN
    INSERT INTO routes (route_code, origin_id, destination_id, current_price, currency, distance_km, rate_per_km, is_active, description)
    SELECT 'AR-11-01', v_origin_id, v_dest_id, 7200000, 'TOMAN', 80, 90000, true, 'انبار مرکزی ← نجف آباد (۸۰ کیلومتر)'
    WHERE NOT EXISTS (SELECT 1 FROM routes WHERE route_code = 'AR-11-01');
    INSERT INTO route_price_history (route_id, route_code, old_price, new_price, changed_by, effective_date)
    SELECT id, 'AR-11-01', 0, 7200000, 'seed', TO_CHAR(NOW(), 'YYYY-MM-DD')
    FROM routes WHERE route_code = 'AR-11-01'
    AND NOT EXISTS (SELECT 1 FROM route_price_history WHERE route_code = 'AR-11-01');
  END IF;

  -- ── Tier 12: Baharestan (85km, 7,650,000 TOMAN) ──
  SELECT id INTO v_dest_id FROM locations WHERE name = 'بهارستان' LIMIT 1;
  IF v_dest_id IS NOT NULL THEN
    INSERT INTO routes (route_code, origin_id, destination_id, current_price, currency, distance_km, rate_per_km, is_active, description)
    SELECT 'AR-12-01', v_origin_id, v_dest_id, 7650000, 'TOMAN', 85, 90000, true, 'انبار مرکزی ← بهارستان (۸۵ کیلومتر)'
    WHERE NOT EXISTS (SELECT 1 FROM routes WHERE route_code = 'AR-12-01');
    INSERT INTO route_price_history (route_id, route_code, old_price, new_price, changed_by, effective_date)
    SELECT id, 'AR-12-01', 0, 7650000, 'seed', TO_CHAR(NOW(), 'YYYY-MM-DD')
    FROM routes WHERE route_code = 'AR-12-01'
    AND NOT EXISTS (SELECT 1 FROM route_price_history WHERE route_code = 'AR-12-01');
  END IF;

  -- ── Tier 13: Natanz (90km, 8,100,000 TOMAN) ──
  SELECT id INTO v_dest_id FROM locations WHERE name = 'نطنز' LIMIT 1;
  IF v_dest_id IS NOT NULL THEN
    INSERT INTO routes (route_code, origin_id, destination_id, current_price, currency, distance_km, rate_per_km, is_active, description)
    SELECT 'AR-13-01', v_origin_id, v_dest_id, 8100000, 'TOMAN', 90, 90000, true, 'انبار مرکزی ← نطنز (۹۰ کیلومتر)'
    WHERE NOT EXISTS (SELECT 1 FROM routes WHERE route_code = 'AR-13-01');
    INSERT INTO route_price_history (route_id, route_code, old_price, new_price, changed_by, effective_date)
    SELECT id, 'AR-13-01', 0, 8100000, 'seed', TO_CHAR(NOW(), 'YYYY-MM-DD')
    FROM routes WHERE route_code = 'AR-13-01'
    AND NOT EXISTS (SELECT 1 FROM route_price_history WHERE route_code = 'AR-13-01');
  END IF;

  -- ── Tier 14: Mobarkheh (95km, 8,550,000 TOMAN) ──
  SELECT id INTO v_dest_id FROM locations WHERE name = 'مبارکه' LIMIT 1;
  IF v_dest_id IS NOT NULL THEN
    INSERT INTO routes (route_code, origin_id, destination_id, current_price, currency, distance_km, rate_per_km, is_active, description)
    SELECT 'AR-14-01', v_origin_id, v_dest_id, 8550000, 'TOMAN', 95, 90000, true, 'انبار مرکزی ← مبارکه (۹۵ کیلومتر)'
    WHERE NOT EXISTS (SELECT 1 FROM routes WHERE route_code = 'AR-14-01');
    INSERT INTO route_price_history (route_id, route_code, old_price, new_price, changed_by, effective_date)
    SELECT id, 'AR-14-01', 0, 8550000, 'seed', TO_CHAR(NOW(), 'YYYY-MM-DD')
    FROM routes WHERE route_code = 'AR-14-01'
    AND NOT EXISTS (SELECT 1 FROM route_price_history WHERE route_code = 'AR-14-01');
  END IF;

  -- ── Tier 15: Shahreza (100km, 9,000,000 TOMAN) ──
  SELECT id INTO v_dest_id FROM locations WHERE name = 'شهرضا' LIMIT 1;
  IF v_dest_id IS NOT NULL THEN
    INSERT INTO routes (route_code, origin_id, destination_id, current_price, currency, distance_km, rate_per_km, is_active, description)
    SELECT 'AR-15-01', v_origin_id, v_dest_id, 9000000, 'TOMAN', 100, 90000, true, 'انبار مرکزی ← شهرضا (۱۰۰ کیلومتر)'
    WHERE NOT EXISTS (SELECT 1 FROM routes WHERE route_code = 'AR-15-01');
    INSERT INTO route_price_history (route_id, route_code, old_price, new_price, changed_by, effective_date)
    SELECT id, 'AR-15-01', 0, 9000000, 'seed', TO_CHAR(NOW(), 'YYYY-MM-DD')
    FROM routes WHERE route_code = 'AR-15-01'
    AND NOT EXISTS (SELECT 1 FROM route_price_history WHERE route_code = 'AR-15-01');
  END IF;

  -- ── Long distance: Kashan (250km, 15,000,000 TOMAN) ──
  SELECT id INTO v_dest_id FROM locations WHERE name = 'کاشان' LIMIT 1;
  IF v_dest_id IS NOT NULL THEN
    INSERT INTO routes (route_code, origin_id, destination_id, current_price, currency, distance_km, rate_per_km, is_active, description)
    SELECT 'AR-18-01', v_origin_id, v_dest_id, 15000000, 'TOMAN', 250, 60000, true, 'انبار مرکزی ← کاشان (۲۵۰ کیلومتر)'
    WHERE NOT EXISTS (SELECT 1 FROM routes WHERE route_code = 'AR-18-01');
    INSERT INTO route_price_history (route_id, route_code, old_price, new_price, changed_by, effective_date)
    SELECT id, 'AR-18-01', 0, 15000000, 'seed', TO_CHAR(NOW(), 'YYYY-MM-DD')
    FROM routes WHERE route_code = 'AR-18-01'
    AND NOT EXISTS (SELECT 1 FROM route_price_history WHERE route_code = 'AR-18-01');
  END IF;

  -- ── Long distance: Semirom (200km, 12,000,000 TOMAN) ──
  SELECT id INTO v_dest_id FROM locations WHERE name = 'سمیرم' LIMIT 1;
  IF v_dest_id IS NOT NULL THEN
    INSERT INTO routes (route_code, origin_id, destination_id, current_price, currency, distance_km, rate_per_km, is_active, description)
    SELECT 'AR-16-01', v_origin_id, v_dest_id, 12000000, 'TOMAN', 200, 60000, true, 'انبار مرکزی ← سمیرم (۲۰۰ کیلومتر)'
    WHERE NOT EXISTS (SELECT 1 FROM routes WHERE route_code = 'AR-16-01');
    INSERT INTO route_price_history (route_id, route_code, old_price, new_price, changed_by, effective_date)
    SELECT id, 'AR-16-01', 0, 12000000, 'seed', TO_CHAR(NOW(), 'YYYY-MM-DD')
    FROM routes WHERE route_code = 'AR-16-01'
    AND NOT EXISTS (SELECT 1 FROM route_price_history WHERE route_code = 'AR-16-01');
  END IF;

  -- ── Long distance: Ardestan (160km, 9,600,000 TOMAN) ──
  SELECT id INTO v_dest_id FROM locations WHERE name = 'اردستان' LIMIT 1;
  IF v_dest_id IS NOT NULL THEN
    INSERT INTO routes (route_code, origin_id, destination_id, current_price, currency, distance_km, rate_per_km, is_active, description)
    SELECT 'AR-06-16', v_origin_id, v_dest_id, 9600000, 'TOMAN', 160, 60000, true, 'انبار مرکزی ← اردستان (۱۶۰ کیلومتر)'
    WHERE NOT EXISTS (SELECT 1 FROM routes WHERE route_code = 'AR-06-16');
    INSERT INTO route_price_history (route_id, route_code, old_price, new_price, changed_by, effective_date)
    SELECT id, 'AR-06-16', 0, 9600000, 'seed', TO_CHAR(NOW(), 'YYYY-MM-DD')
    FROM routes WHERE route_code = 'AR-06-16'
    AND NOT EXISTS (SELECT 1 FROM route_price_history WHERE route_code = 'AR-06-16');
  END IF;

  -- ── Long distance: Na'in (300km, 18,000,000 TOMAN) ──
  SELECT id INTO v_dest_id FROM locations WHERE name = 'نائین' LIMIT 1;
  IF v_dest_id IS NOT NULL THEN
    INSERT INTO routes (route_code, origin_id, destination_id, current_price, currency, distance_km, rate_per_km, is_active, description)
    SELECT 'AR-07-17', v_origin_id, v_dest_id, 18000000, 'TOMAN', 300, 60000, true, 'انبار مرکزی ← نائین (۳۰۰ کیلومتر)'
    WHERE NOT EXISTS (SELECT 1 FROM routes WHERE route_code = 'AR-07-17');
    INSERT INTO route_price_history (route_id, route_code, old_price, new_price, changed_by, effective_date)
    SELECT id, 'AR-07-17', 0, 18000000, 'seed', TO_CHAR(NOW(), 'YYYY-MM-DD')
    FROM routes WHERE route_code = 'AR-07-17'
    AND NOT EXISTS (SELECT 1 FROM route_price_history WHERE route_code = 'AR-07-17');
  END IF;

END $$;

-- ═══════════════════════════════════════════════════════════════════
-- STEP 3: Verify
-- ═══════════════════════════════════════════════════════════════════

DO $$
DECLARE
  v_loc_count INTEGER;
  v_route_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_loc_count FROM locations;
  SELECT COUNT(*) INTO v_route_count FROM routes;
  RAISE NOTICE 'Seed data completed: % locations, % routes', v_loc_count, v_route_count;
END $$;

SELECT 'Seed data migration completed successfully' AS result;
