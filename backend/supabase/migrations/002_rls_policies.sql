-- ═══════════════════════════════════════════════════════════════════
-- Arman Fleet - Row Level Security (Final)
-- Driver: READ only on trips/daily_work_logs. All writes via RPC.
-- ═══════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════
-- STEP 1: Enable RLS
-- ═══════════════════════════════════════════════════════════════════

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE route_price_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_work_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE route_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- ═══════════════════════════════════════════════════════════════════
-- STEP 2: Drop all existing policies (idempotent)
-- ═══════════════════════════════════════════════════════════════════

DO $$ DECLARE r RECORD;
BEGIN
  FOR r IN SELECT schemaname, tablename, policyname FROM pg_policies WHERE schemaname = 'public' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
  END LOOP;
END $$;

-- ═══════════════════════════════════════════════════════════════════
-- STEP 3: RLS Policies
-- ═══════════════════════════════════════════════════════════════════

-- Role helper (inline, no custom auth schema functions):
-- (current_setting('request.jwt.claims', true)::json->'app_metadata'->>'role')

-- ─── users ───────────────────────────────────────────────────────
CREATE POLICY "p_users_admin_all" ON users
  FOR ALL USING ((current_setting('request.jwt.claims', true)::json->'app_metadata'->>'role') = 'ADMIN');

CREATE POLICY "p_users_select_own" ON users
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "p_users_finance_read" ON users
  FOR SELECT USING ((current_setting('request.jwt.claims', true)::json->'app_metadata'->>'role') = 'FINANCE');

-- ─── drivers ─────────────────────────────────────────────────────
CREATE POLICY "p_drivers_admin_all" ON drivers
  FOR ALL USING ((current_setting('request.jwt.claims', true)::json->'app_metadata'->>'role') = 'ADMIN');

CREATE POLICY "p_drivers_finance_read" ON drivers
  FOR SELECT USING ((current_setting('request.jwt.claims', true)::json->'app_metadata'->>'role') = 'FINANCE');

CREATE POLICY "p_drivers_select_own" ON drivers
  FOR SELECT USING (user_id = auth.uid());

-- Driver can update own profile (limited fields enforced by backend, not RLS)
CREATE POLICY "p_drivers_update_own" ON drivers
  FOR UPDATE USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ─── locations ───────────────────────────────────────────────────
CREATE POLICY "p_locations_select_auth" ON locations
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "p_locations_admin_all" ON locations
  FOR ALL USING ((current_setting('request.jwt.claims', true)::json->'app_metadata'->>'role') = 'ADMIN');

-- ─── routes ──────────────────────────────────────────────────────
CREATE POLICY "p_routes_select_auth" ON routes
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "p_routes_admin_all" ON routes
  FOR ALL USING ((current_setting('request.jwt.claims', true)::json->'app_metadata'->>'role') = 'ADMIN');

-- ─── route_price_history ────────────────────────────────────────
CREATE POLICY "p_rph_admin_read" ON route_price_history
  FOR SELECT USING ((current_setting('request.jwt.claims', true)::json->'app_metadata'->>'role') = 'ADMIN');

CREATE POLICY "p_rph_admin_insert" ON route_price_history
  FOR INSERT WITH CHECK ((current_setting('request.jwt.claims', true)::json->'app_metadata'->>'role') = 'ADMIN');

-- ─── daily_work_logs ────────────────────────────────────────────
-- Admin: full access
CREATE POLICY "p_dwl_admin_all" ON daily_work_logs
  FOR ALL USING ((current_setting('request.jwt.claims', true)::json->'app_metadata'->>'role') = 'ADMIN');

-- Finance: read only
CREATE POLICY "p_dwl_finance_read" ON daily_work_logs
  FOR SELECT USING ((current_setting('request.jwt.claims', true)::json->'app_metadata'->>'role') = 'FINANCE');

-- Driver: SELECT only (INSERT/UPDATE via create_trip RPC, finalize via finalize_daily_work RPC)
CREATE POLICY "p_dwl_select_own" ON daily_work_logs
  FOR SELECT USING (driver_id IN (SELECT id FROM drivers WHERE user_id = auth.uid()));

-- ═══════════════════════════════════════════════════════════════════
-- NOTE: Driver has NO INSERT/UPDATE/DELETE on daily_work_logs
-- All writes go through create_trip() and finalize_daily_work() RPCs
-- which run as SECURITY DEFINER and bypass RLS.
-- ═══════════════════════════════════════════════════════════════════

-- ─── trips ──────────────────────────────────────────────────────
-- Admin: full access
CREATE POLICY "p_trips_admin_all" ON trips
  FOR ALL USING ((current_setting('request.jwt.claims', true)::json->'app_metadata'->>'role') = 'ADMIN');

-- Finance: read only
CREATE POLICY "p_trips_finance_read" ON trips
  FOR SELECT USING ((current_setting('request.jwt.claims', true)::json->'app_metadata'->>'role') = 'FINANCE');

-- Driver: SELECT only (INSERT via create_trip RPC, DELETE via delete_trip RPC)
CREATE POLICY "p_trips_select_own" ON trips
  FOR SELECT USING (driver_id IN (SELECT id FROM drivers WHERE user_id = auth.uid()));

-- ═══════════════════════════════════════════════════════════════════
-- NOTE: Driver has NO INSERT/UPDATE/DELETE on trips
-- All writes go through create_trip() and delete_trip() RPCs
-- which run as SECURITY DEFINER and bypass RLS.
-- This prevents Driver from manipulating snapshot_price,
-- route_code, origin/destination, or any other field.
-- ═══════════════════════════════════════════════════════════════════

-- ─── financial_periods ──────────────────────────────────────────
CREATE POLICY "p_fp_admin_all" ON financial_periods
  FOR ALL USING ((current_setting('request.jwt.claims', true)::json->'app_metadata'->>'role') = 'ADMIN');

CREATE POLICY "p_fp_finance_read" ON financial_periods
  FOR SELECT USING ((current_setting('request.jwt.claims', true)::json->'app_metadata'->>'role') = 'FINANCE');

-- Driver: NO access

-- ─── route_requests ─────────────────────────────────────────────
CREATE POLICY "p_rr_admin_all" ON route_requests
  FOR ALL USING ((current_setting('request.jwt.claims', true)::json->'app_metadata'->>'role') = 'ADMIN');

CREATE POLICY "p_rr_select_own" ON route_requests
  FOR SELECT USING (driver_id IN (SELECT id FROM drivers WHERE user_id = auth.uid()));

CREATE POLICY "p_rr_insert_own" ON route_requests
  FOR INSERT WITH CHECK (driver_id IN (SELECT id FROM drivers WHERE user_id = auth.uid()));

-- ─── audit_logs ─────────────────────────────────────────────────
CREATE POLICY "p_audit_admin_all" ON audit_logs
  FOR ALL USING ((current_setting('request.jwt.claims', true)::json->'app_metadata'->>'role') = 'ADMIN');

CREATE POLICY "p_audit_finance_read" ON audit_logs
  FOR SELECT USING ((current_setting('request.jwt.claims', true)::json->'app_metadata'->>'role') = 'FINANCE');

-- Driver: NO access

-- ═══════════════════════════════════════════════════════════════════
-- DONE
-- ═══════════════════════════════════════════════════════════════════

SELECT 'RLS policies created: Driver SELECT-only on trips/daily_work_logs, all writes via RPC' AS result;
