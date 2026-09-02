-- ═══════════════════════════════════════════════════════════════════
-- Arman Fleet - Seed Data (Locations + Routes)
-- Run AFTER 001_initial_schema.sql
-- NOTE: Users/Drivers are created via seed_auth.ts (Supabase Auth)
-- ═══════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════
-- STEP 1: Locations (81 locations)
-- Using ON CONFLICT DO NOTHING for idempotency
-- ═══════════════════════════════════════════════════════════════════

INSERT INTO locations (name, city, is_active) VALUES
('انبار مرکزی انتخاب (مورچه خورت)', 'اصفهان', true),
('انبار سادات', 'اصفهان', true),
('انبار حبیب آباد', 'اصفهان', true),
('شاهین شهر', 'اصفهان', true),
('گلدیس', 'اصفهان', true),
('.be', 'اصفهان', true),
('دولت آباد', 'اصفهان', true),
(' فرودگاه شهید بهشتی', 'اصفهان', true),
('خمینی شهر', 'اصفهان', true),
('نجف آباد', 'اصفهان', true),
('زیبا شهر', 'اصفهان', true),
('فلاورجان', 'اصفهان', true),
('فولاد شهر', 'اصفهان', true),
('مبارکه', 'اصفهان', true),
('سمیرم', 'اصفهان', true),
('شهرضا', 'اصفهان', true),
('کاشان', 'اصفهان', true),
('اردستان', 'اصفهان', true),
('نائین', 'اصفهان', true),
('خم cst امیریه', 'اصفهان', true),
('-approved', 'اصفهان', true),
(' سامان', 'اصفهان', true),
('باغ بهادران', 'اصفهان', true),
('چرگ', 'اصفهان', true),
('-------------------------------', 'اصفهان', true),
('محل -----------', 'اصفهان', true),
('-----------------', 'اصفهان', true),
('negar', 'اصفهان', true),
('mohamadreza', 'اصفهان', true),
('maziar', 'اصفهان', true),
('-----------', 'اصفهان', true),
('-------------------', 'اصفهان', true),
('--------------------', 'اصفهان', true),
('محل', 'اصفهان', true),
('------------------', 'اصفهان', true),
('-------------', 'اصفهان', true),
('--------------------', 'اصفهان', true),
(' -----------', 'اصفهان', true),
('-------------', 'اصفهان', true),
(' -------------------', 'اصفهان', true),
('farshad', 'اصفهان', true),
('---------------------', 'اصفهان', true),
('--------------------', 'اصفهان', true),
(' مهدی', 'اصفهان', true),
(' --------------------', 'اصفهان', true),
('  علیرضا', 'اصفهان', true),
(' -------', 'اصفهان', true),
('--------------------', 'اصفهان', true),
('--------------------', 'اصفهان', true),
(' -------------------', 'اصفهان', true),
(' -----------------', 'اصفهان', true),
('--------------------', 'اصفهان', true),
('  -------------------', 'اصفهان', true),
(' ----------', 'اصفهان', true),
('--------------------', 'اصفهان', true),
(' -------------------', 'اصفهان', true),
(' --------------------', 'اصفهان', true),
('--------------------', 'اصفهان', true),
(' -----------------', 'اصفهان', true),
('--------------------', 'اصفهان', true),
(' --------------------', 'اصفهان', true),
(' --------------------', 'اصفهان', true),
(' ----------------', 'اصفهان', true),
('--------------------', 'اصفهان', true),
(' ------------------', 'اصفهان', true),
('--------------------', 'اصفهان', true),
('--------------------', 'اصفهان', true),
('-------------------', 'اصفهان', true),
(' -------------------', 'اصفهان', true),
('--------------------', 'اصفهان', true),
(' --------------------', 'اصفهان', true),
(' ----------------', 'اصفهان', true),
('----------------', 'اصفهان', true),
('--------------------', 'اصفهان', true),
('-------------------', 'اصفهان', true),
(' --------------------', 'اصفهان', true),
(' ----------------', 'اصفهان', true),
('--------------------', 'اصفهان', true),
('--------------------', 'اصفهان', true),
('---------------------', 'اصفهان', true),
(' --------------------', 'اصفهان', true),
('--------------------', 'اصفهان', true),
(' ----------', 'اصفهان', true),
(' -----------------', 'اصفهان', true),
('------------------', 'اصفهان', true),
('--------------------', 'اصفهان', true),
(' --------------------', 'اصفهان', true)
ON CONFLICT (name) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════
-- STEP 2: Routes (41 routes)
-- Using subqueries to find location IDs by name
-- ═══════════════════════════════════════════════════════════════════

-- Helper: Only insert if both locations exist and route doesn't already exist
DO $$
DECLARE
  v_origin_id INTEGER;
  v_dest_id INTEGER;
BEGIN
  -- Route 1: AR-01-01
  SELECT id INTO v_origin_id FROM locations WHERE name = 'انبار مرکزی انتخاب (مورچه خورت)' LIMIT 1;
  SELECT id INTO v_dest_id FROM locations WHERE name = 'شاهین شهر' LIMIT 1;
  IF v_origin_id IS NOT NULL AND v_dest_id IS NOT NULL THEN
    INSERT INTO routes (route_code, origin_id, destination_id, current_price, currency, distance_km, rate_per_km, is_active, description)
    SELECT 'AR-01-01', v_origin_id, v_dest_id, 2700000, 'TOMAN', 45, 60000, true, 'انبار مرکزی ← شاهین شهر'
    WHERE NOT EXISTS (SELECT 1 FROM routes WHERE route_code = 'AR-01-01');
  END IF;

  -- Route 2: AR-02-01
  SELECT id INTO v_origin_id FROM locations WHERE name = 'انبار مرکزی انتخاب (مورچه خورت)' LIMIT 1;
  SELECT id INTO v_dest_id FROM locations WHERE name = 'گلدیس' LIMIT 1;
  IF v_origin_id IS NOT NULL AND v_dest_id IS NOT NULL THEN
    INSERT INTO routes (route_code, origin_id, destination_id, current_price, currency, distance_km, rate_per_km, is_active, description)
    SELECT 'AR-02-01', v_origin_id, v_dest_id, 3150000, 'TOMAN', 52, 60000, true, 'انبار مرکزی ← گلدیس'
    WHERE NOT EXISTS (SELECT 1 FROM routes WHERE route_code = 'AR-02-01');
  END IF;

  -- Route 3: AR-04-14
  SELECT id INTO v_origin_id FROM locations WHERE name = 'انبار مرکزی انتخاب (مورچه خورت)' LIMIT 1;
  SELECT id INTO v_dest_id FROM locations WHERE name = 'دولت آباد' LIMIT 1;
  IF v_origin_id IS NOT NULL AND v_dest_id IS NOT NULL THEN
    INSERT INTO routes (route_code, origin_id, destination_id, current_price, currency, distance_km, rate_per_km, is_active, description)
    SELECT 'AR-04-14', v_origin_id, v_dest_id, 90000, 'TOMAN', 3, 30000, true, 'انبار مرکزی ← دولت آباد'
    WHERE NOT EXISTS (SELECT 1 FROM routes WHERE route_code = 'AR-04-14');
  END IF;

  -- Route 4: AR-09-03
  SELECT id INTO v_origin_id FROM locations WHERE name = 'انبار مرکزی انتخاب (مورچه خورت)' LIMIT 1;
  SELECT id INTO v_dest_id FROM locations WHERE name = 'خمینی شهر' LIMIT 1;
  IF v_origin_id IS NOT NULL AND v_dest_id IS NOT NULL THEN
    INSERT INTO routes (route_code, origin_id, destination_id, current_price, currency, distance_km, rate_per_km, is_active, description)
    SELECT 'AR-09-03', v_origin_id, v_dest_id, 1800000, 'TOMAN', 30, 60000, true, 'انبار مرکزی ← خمینی شهر'
    WHERE NOT EXISTS (SELECT 1 FROM routes WHERE route_code = 'AR-09-03');
  END IF;

  -- Route 5: AR-12-05
  SELECT id INTO v_origin_id FROM locations WHERE name = 'انبار مرکزی انتخاب (مورچه خورت)' LIMIT 1;
  SELECT id INTO v_dest_id FROM locations WHERE name = 'نجف آباد' LIMIT 1;
  IF v_origin_id IS NOT NULL AND v_dest_id IS NOT NULL THEN
    INSERT INTO routes (route_code, origin_id, destination_id, current_price, currency, distance_km, rate_per_km, is_active, description)
    SELECT 'AR-12-05', v_origin_id, v_dest_id, 7650000, 'TOMAN', 127, 60000, true, 'انبار مرکزی ← نجف آباد'
    WHERE NOT EXISTS (SELECT 1 FROM routes WHERE route_code = 'AR-12-05');
  END IF;

  -- Route 6: AR-03-02
  SELECT id INTO v_origin_id FROM locations WHERE name = 'انبار مرکزی انتخاب (مورچه خورت)' LIMIT 1;
  SELECT id INTO v_dest_id FROM locations WHERE name = '.be' LIMIT 1;
  IF v_origin_id IS NOT NULL AND v_dest_id IS NOT NULL THEN
    INSERT INTO routes (route_code, origin_id, destination_id, current_price, currency, distance_km, rate_per_km, is_active, description)
    SELECT 'AR-03-02', v_origin_id, v_dest_id, 2250000, 'TOMAN', 38, 60000, true, 'انبار مرکزی ← .be'
    WHERE NOT EXISTS (SELECT 1 FROM routes WHERE route_code = 'AR-03-02');
  END IF;

  -- Route 7: AR-11-04
  SELECT id INTO v_origin_id FROM locations WHERE name = 'انبار مرکزی انتخاب (مورچه خورت)' LIMIT 1;
  SELECT id INTO v_dest_id FROM locations WHERE name = 'زیبا شهر' LIMIT 1;
  IF v_origin_id IS NOT NULL AND v_dest_id IS NOT NULL THEN
    INSERT INTO routes (route_code, origin_id, destination_id, current_price, currency, distance_km, rate_per_km, is_active, description)
    SELECT 'AR-11-04', v_origin_id, v_dest_id, 1500000, 'TOMAN', 25, 60000, true, 'انبار مرکزی ← زیبا شهر'
    WHERE NOT EXISTS (SELECT 1 FROM routes WHERE route_code = 'AR-11-04');
  END IF;

  -- Route 8: AR-13-06
  SELECT id INTO v_origin_id FROM locations WHERE name = 'انبار مرکزی انتخاب (مورچه خورت)' LIMIT 1;
  SELECT id INTO v_dest_id FROM locations WHERE name = 'فلاورجان' LIMIT 1;
  IF v_origin_id IS NOT NULL AND v_dest_id IS NOT NULL THEN
    INSERT INTO routes (route_code, origin_id, destination_id, current_price, currency, distance_km, rate_per_km, is_active, description)
    SELECT 'AR-13-06', v_origin_id, v_dest_id, 3200000, 'TOMAN', 53, 60000, true, 'انبار مرکزی ← فلاورجان'
    WHERE NOT EXISTS (SELECT 1 FROM routes WHERE route_code = 'AR-13-06');
  END IF;

  -- Route 9: AR-14-07
  SELECT id INTO v_origin_id FROM locations WHERE name = 'انبار مرکزی انتخاب (مورچه خورت)' LIMIT 1;
  SELECT id INTO v_dest_id FROM locations WHERE name = 'فولاد شهر' LIMIT 1;
  IF v_origin_id IS NOT NULL AND v_dest_id IS NOT NULL THEN
    INSERT INTO routes (route_code, origin_id, destination_id, current_price, currency, distance_km, rate_per_km, is_active, description)
    SELECT 'AR-14-07', v_origin_id, v_dest_id, 2800000, 'TOMAN', 47, 60000, true, 'انبار مرکزی ← فولاد شهر'
    WHERE NOT EXISTS (SELECT 1 FROM routes WHERE route_code = 'AR-14-07');
  END IF;

  -- Route 10: AR-15-08
  SELECT id INTO v_origin_id FROM locations WHERE name = 'انبار مرکزی انتخاب (مورچه خورت)' LIMIT 1;
  SELECT id INTO v_dest_id FROM locations WHERE name = 'مبارکه' LIMIT 1;
  IF v_origin_id IS NOT NULL AND v_dest_id IS NOT NULL THEN
    INSERT INTO routes (route_code, origin_id, destination_id, current_price, currency, distance_km, rate_per_km, is_active, description)
    SELECT 'AR-15-08', v_origin_id, v_dest_id, 4500000, 'TOMAN', 75, 60000, true, 'انبار مرکزی ← مبارکه'
    WHERE NOT EXISTS (SELECT 1 FROM routes WHERE route_code = 'AR-15-08');
  END IF;

  -- Route 11: AR-16-09
  SELECT id INTO v_origin_id FROM locations WHERE name = 'انبار مرکزی انتخاب (مورچه خورت)' LIMIT 1;
  SELECT id INTO v_dest_id FROM locations WHERE name = 'سمیرم' LIMIT 1;
  IF v_origin_id IS NOT NULL AND v_dest_id IS NOT NULL THEN
    INSERT INTO routes (route_code, origin_id, destination_id, current_price, currency, distance_km, rate_per_km, is_active, description)
    SELECT 'AR-16-09', v_origin_id, v_dest_id, 12000000, 'TOMAN', 200, 60000, true, 'انبار مرکزی ← سمیرم'
    WHERE NOT EXISTS (SELECT 1 FROM routes WHERE route_code = 'AR-16-09');
  END IF;

  -- Route 12: AR-17-10
  SELECT id INTO v_origin_id FROM locations WHERE name = 'انبار مرکزی انتخاب (مورچه خورت)' LIMIT 1;
  SELECT id INTO v_dest_id FROM locations WHERE name = 'شهرضا' LIMIT 1;
  IF v_origin_id IS NOT NULL AND v_dest_id IS NOT NULL THEN
    INSERT INTO routes (route_code, origin_id, destination_id, current_price, currency, distance_km, rate_per_km, is_active, description)
    SELECT 'AR-17-10', v_origin_id, v_dest_id, 8400000, 'TOMAN', 140, 60000, true, 'انبار مرکزی ← شهرضا'
    WHERE NOT EXISTS (SELECT 1 FROM routes WHERE route_code = 'AR-17-10');
  END IF;

  -- Route 13: AR-18-11
  SELECT id INTO v_origin_id FROM locations WHERE name = 'انبار مرکزی انتخاب (مورچه خورت)' LIMIT 1;
  SELECT id INTO v_dest_id FROM locations WHERE name = 'کاشان' LIMIT 1;
  IF v_origin_id IS NOT NULL AND v_dest_id IS NOT NULL THEN
    INSERT INTO routes (route_code, origin_id, destination_id, current_price, currency, distance_km, rate_per_km, is_active, description)
    SELECT 'AR-18-11', v_origin_id, v_dest_id, 15000000, 'TOMAN', 250, 60000, true, 'انبار مرکزی ← کاشان'
    WHERE NOT EXISTS (SELECT 1 FROM routes WHERE route_code = 'AR-18-11');
  END IF;

  -- Route 14: AR-05-15
  SELECT id INTO v_origin_id FROM locations WHERE name = 'انبار مرکزی انتخاب (مورچه خورت)' LIMIT 1;
  SELECT id INTO v_dest_id FROM locations WHERE name = 'فرودگاه شهید بهشتی' LIMIT 1;
  IF v_origin_id IS NOT NULL AND v_dest_id IS NOT NULL THEN
    INSERT INTO routes (route_code, origin_id, destination_id, current_price, currency, distance_km, rate_per_km, is_active, description)
    SELECT 'AR-05-15', v_origin_id, v_dest_id, 1200000, 'TOMAN', 20, 60000, true, 'انبار مرکزی ← فرودگاه'
    WHERE NOT EXISTS (SELECT 1 FROM routes WHERE route_code = 'AR-05-15');
  END IF;

  -- Route 15: AR-06-16
  SELECT id INTO v_origin_id FROM locations WHERE name = 'انبار مرکزی انتخاب (مورچه خورت)' LIMIT 1;
  SELECT id INTO v_dest_id FROM locations WHERE name = 'اردستان' LIMIT 1;
  IF v_origin_id IS NOT NULL AND v_dest_id IS NOT NULL THEN
    INSERT INTO routes (route_code, origin_id, destination_id, current_price, currency, distance_km, rate_per_km, is_active, description)
    SELECT 'AR-06-16', v_origin_id, v_dest_id, 9600000, 'TOMAN', 160, 60000, true, 'انبار مرکزی ← اردستان'
    WHERE NOT EXISTS (SELECT 1 FROM routes WHERE route_code = 'AR-06-16');
  END IF;

  -- Route 16: AR-07-17
  SELECT id INTO v_origin_id FROM locations WHERE name = 'انبار مرکزی انتخاب (مورچه خورت)' LIMIT 1;
  SELECT id INTO v_dest_id FROM locations WHERE name = 'نائین' LIMIT 1;
  IF v_origin_id IS NOT NULL AND v_dest_id IS NOT NULL THEN
    INSERT INTO routes (route_code, origin_id, destination_id, current_price, currency, distance_km, rate_per_km, is_active, description)
    SELECT 'AR-07-17', v_origin_id, v_dest_id, 18000000, 'TOMAN', 300, 60000, true, 'انبار مرکزی ← نائین'
    WHERE NOT EXISTS (SELECT 1 FROM routes WHERE route_code = 'AR-07-17');
  END IF;

  -- Route 17: AR-08-18
  SELECT id INTO v_origin_id FROM locations WHERE name = 'انبار مرکزی انتخاب (مورچه خورت)' LIMIT 1;
  SELECT id INTO v_dest_id FROM locations WHERE name = 'باغ بهادران' LIMIT 1;
  IF v_origin_id IS NOT NULL AND v_dest_id IS NOT NULL THEN
    INSERT INTO routes (route_code, origin_id, destination_id, current_price, currency, distance_km, rate_per_km, is_active, description)
    SELECT 'AR-08-18', v_origin_id, v_dest_id, 4200000, 'TOMAN', 70, 60000, true, 'انبار مرکزی ← باغ بهادران'
    WHERE NOT EXISTS (SELECT 1 FROM routes WHERE route_code = 'AR-08-18');
  END IF;

  -- Route 18: AR-10-19
  SELECT id INTO v_origin_id FROM locations WHERE name = 'انبار مرکزی انتخاب (مورچه خورت)' LIMIT 1;
  SELECT id INTO v_dest_id FROM locations WHERE name = 'negar' LIMIT 1;
  IF v_origin_id IS NOT NULL AND v_dest_id IS NOT NULL THEN
    INSERT INTO routes (route_code, origin_id, destination_id, current_price, currency, distance_km, rate_per_km, is_active, description)
    SELECT 'AR-10-19', v_origin_id, v_dest_id, 600000, 'TOMAN', 10, 60000, true, 'انبار مرکزی ← negar'
    WHERE NOT EXISTS (SELECT 1 FROM routes WHERE route_code = 'AR-10-19');
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

SELECT 'Seed data migration completed' AS result;
