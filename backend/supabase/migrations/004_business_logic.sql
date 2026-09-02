-- ═══════════════════════════════════════════════════════════════════
-- Arman Fleet - Business Logic (RPC Functions)
-- SECURITY DEFINER: All price/totals are server-controlled
-- Run AFTER 001 + 002 + 003
-- ═══════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════
-- 1. create_trip() — Driver creates trip, price from DB
-- ═══════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION create_trip(
  p_route_id UUID,
  p_jalali_date VARCHAR(20),
  p_start_time VARCHAR(10),
  p_description TEXT DEFAULT ''
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_driver_id UUID;
  v_driver_active BOOLEAN;
  v_route RECORD;
  v_daily_work RECORD;
  v_trip_code VARCHAR(100);
  v_trip_count INTEGER;
  v_new_trip_id UUID;
BEGIN
  -- 1. Authenticate
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Authentication required');
  END IF;

  -- 2. Find driver
  SELECT d.id, d.is_active INTO v_driver_id, v_driver_active
  FROM drivers d WHERE d.user_id = v_user_id;

  IF v_driver_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Driver profile not found');
  END IF;

  IF NOT v_driver_active THEN
    RETURN jsonb_build_object('success', false, 'error', 'Driver account is inactive');
  END IF;

  -- 3. Find route and get price from DB (immutable snapshot)
  SELECT r.id, r.route_code, r.current_price, r.currency,
         lo.name AS origin_name, ld.name AS destination_name
  INTO v_route
  FROM routes r
  JOIN locations lo ON lo.id = r.origin_id
  JOIN locations ld ON ld.id = r.destination_id
  WHERE r.id = p_route_id AND r.is_active = true;

  IF v_route IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Route not found or inactive');
  END IF;

  -- 4. Find or create daily work log
  SELECT id, status INTO v_daily_work
  FROM daily_work_logs
  WHERE driver_id = v_driver_id AND jalali_date = p_jalali_date;

  IF v_daily_work IS NULL THEN
    INSERT INTO daily_work_logs (driver_id, jalali_date, status)
    VALUES (v_driver_id, p_jalali_date, 'DRAFT')
    RETURNING id INTO v_daily_work;
  END IF;

  IF v_daily_work.status = 'FINALIZED' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Daily work is finalized. Cannot add trips.');
  END IF;

  -- 5. Generate trip code
  SELECT COUNT(*) + 1 INTO v_trip_count
  FROM trips
  WHERE driver_id = v_driver_id AND trip_jalali_date = p_jalali_date;

  v_trip_code := v_route.route_code || '-' || p_jalali_date || '-' || LPAD(v_trip_count::TEXT, 3, '0');

  -- 6. Insert trip (price ONLY from DB — driver cannot control)
  INSERT INTO trips (
    trip_code, daily_work_id, driver_id, route_id,
    origin_title, destination_title, route_code,
    snapshot_price, currency, trip_jalali_date,
    start_time, description, is_cancelled
  ) VALUES (
    v_trip_code, v_daily_work.id, v_driver_id, v_route.id,
    v_route.origin_name, v_route.destination_name, v_route.route_code,
    v_route.current_price, v_route.currency, p_jalali_date,
    p_start_time, p_description, false
  ) RETURNING id INTO v_new_trip_id;

  -- 7. Return result
  RETURN jsonb_build_object(
    'success', true,
    'trip_id', v_new_trip_id,
    'trip_code', v_trip_code,
    'route_code', v_route.route_code,
    'origin', v_route.origin_name,
    'destination', v_route.destination_name,
    'price', v_route.current_price,
    'currency', v_route.currency
  );
END;
$$;

-- ═══════════════════════════════════════════════════════════════════
-- 2. delete_trip() — Driver deletes own trip (not finalized)
-- ═══════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION delete_trip(p_trip_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_trip RECORD;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Authentication required');
  END IF;

  SELECT t.id, t.driver_id, dw.status AS daily_work_status
  INTO v_trip
  FROM trips t
  JOIN daily_work_logs dw ON dw.id = t.daily_work_id
  WHERE t.id = p_trip_id;

  IF v_trip IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Trip not found');
  END IF;

  -- Check ownership
  IF NOT EXISTS (SELECT 1 FROM drivers WHERE id = v_trip.driver_id AND user_id = v_user_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authorized');
  END IF;

  -- Check not finalized
  IF v_trip.daily_work_status = 'FINALIZED' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cannot delete trip from finalized daily work');
  END IF;

  DELETE FROM trips WHERE id = p_trip_id;

  RETURN jsonb_build_object('success', true, 'message', 'Trip deleted');
END;
$$;

-- ═══════════════════════════════════════════════════════════════════
-- 3. finalize_daily_work() — Totals calculated from trips
-- ═══════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION finalize_daily_work(p_daily_work_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_dwl RECORD;
  v_trip_count INTEGER;
  v_total_income BIGINT;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Authentication required');
  END IF;

  SELECT dw.id, dw.driver_id, dw.status INTO v_dwl
  FROM daily_work_logs dw WHERE dw.id = p_daily_work_id;

  IF v_dwl IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Daily work not found');
  END IF;

  -- Ownership check
  IF NOT EXISTS (SELECT 1 FROM drivers WHERE id = v_dwl.driver_id AND user_id = v_user_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authorized');
  END IF;

  IF v_dwl.status = 'FINALIZED' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Already finalized');
  END IF;

  -- Calculate from trips (cancelled excluded)
  SELECT COUNT(*), COALESCE(SUM(snapshot_price), 0)
  INTO v_trip_count, v_total_income
  FROM trips
  WHERE daily_work_id = p_daily_work_id AND is_cancelled = false;

  IF v_trip_count = 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'No trips to finalize');
  END IF;

  -- Update
  UPDATE daily_work_logs
  SET status = 'FINALIZED',
      total_trips = v_trip_count,
      total_income = v_total_income,
      finalized_at = NOW()
  WHERE id = p_daily_work_id;

  RETURN jsonb_build_object(
    'success', true,
    'total_trips', v_trip_count,
    'total_income', v_total_income,
    'status', 'FINALIZED'
  );
END;
$$;

-- ═══════════════════════════════════════════════════════════════════
-- 4. update_route_price() — ADMIN ONLY
-- ═══════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION update_route_price(
  p_route_id UUID,
  p_new_price BIGINT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_user_role TEXT;
  v_route RECORD;
  v_today VARCHAR(20);
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Authentication required');
  END IF;

  v_user_role := (current_setting('request.jwt.claims', true)::json->'app_metadata'->>'role');
  IF v_user_role IS DISTINCT FROM 'ADMIN' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Admin access required');
  END IF;

  IF p_new_price <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Price must be positive');
  END IF;

  SELECT id, route_code, current_price INTO v_route
  FROM routes WHERE id = p_route_id;

  IF v_route IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Route not found');
  END IF;

  -- Price history
  INSERT INTO route_price_history (route_id, route_code, old_price, new_price, changed_by, effective_date)
  VALUES (v_route.id, v_route.route_code, v_route.current_price, p_new_price,
          v_user_id::TEXT, TO_CHAR(NOW(), 'YYYY-MM-DD'));

  -- Update
  UPDATE routes SET current_price = p_new_price WHERE id = p_route_id;

  RETURN jsonb_build_object(
    'success', true,
    'route_code', v_route.route_code,
    'old_price', v_route.current_price,
    'new_price', p_new_price
  );
END;
$$;

-- ═══════════════════════════════════════════════════════════════════
-- 5. admin_action_daily_work() — ADMIN ONLY
-- ═══════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION admin_action_daily_work(
  p_daily_work_id UUID,
  p_action VARCHAR(20),
  p_reason TEXT DEFAULT ''
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_user_role TEXT;
  v_dwl RECORD;
  v_new_status daily_work_status;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Authentication required');
  END IF;

  v_user_role := (current_setting('request.jwt.claims', true)::json->'app_metadata'->>'role');
  IF v_user_role IS DISTINCT FROM 'ADMIN' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Admin access required');
  END IF;

  SELECT dw.id, dw.driver_id, dw.status, dw.total_trips, dw.total_income INTO v_dwl
  FROM daily_work_logs dw WHERE dw.id = p_daily_work_id;

  IF v_dwl IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Daily work not found');
  END IF;

  CASE p_action
    WHEN 'approve' THEN
      IF v_dwl.status != 'PENDING_APPROVAL' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Can only approve PENDING_APPROVAL items');
      END IF;
      v_new_status := 'FINALIZED';
    WHEN 'reject' THEN
      IF v_dwl.status != 'PENDING_APPROVAL' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Can only reject PENDING_APPROVAL items');
      END IF;
      v_new_status := 'REJECTED';
    WHEN 'unlock' THEN
      IF v_dwl.status != 'FINALIZED' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Can only unlock FINALIZED items');
      END IF;
      v_new_status := 'PENDING_APPROVAL';
    ELSE
      RETURN jsonb_build_object('success', false, 'error', 'Invalid action. Use: approve, reject, unlock');
  END CASE;

  UPDATE daily_work_logs
  SET status = v_new_status,
      rejection_reason = CASE WHEN p_action = 'reject' THEN p_reason ELSE rejection_reason END,
      approved_by = CASE WHEN p_action IN ('approve', 'unlock') THEN v_user_id::TEXT ELSE approved_by END,
      finalized_at = CASE WHEN p_action = 'unlock' THEN NULL ELSE finalized_at END
  WHERE id = p_daily_work_id;

  -- Audit log
  INSERT INTO audit_logs (user_id, operator_name, operator_role, action, entity_title, details, jalali_timestamp)
  VALUES (v_user_id, 'admin', 'ADMIN', 'daily_work_' || p_action, 'DailyWork#' || v_dwl.id,
          'Status: ' || v_dwl.status || ' → ' || v_new_status || COALESCE('. Reason: ' || p_reason, ''),
          TO_CHAR(NOW(), 'YYYY-MM-DD HH24:MI'));

  RETURN jsonb_build_object(
    'success', true,
    'old_status', v_dwl.status,
    'new_status', v_new_status,
    'action', p_action
  );
END;
$$;

-- ═══════════════════════════════════════════════════════════════════
-- GRANT Permissions
-- ═══════════════════════════════════════════════════════════════════

GRANT EXECUTE ON FUNCTION create_trip(UUID, VARCHAR, VARCHAR, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION delete_trip(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION finalize_daily_work(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION update_route_price(UUID, BIGINT) TO authenticated;
GRANT EXECUTE ON FUNCTION admin_action_daily_work(UUID, VARCHAR, TEXT) TO authenticated;

-- ═══════════════════════════════════════════════════════════════════
-- DONE: 5 RPC functions with SECURITY DEFINER
-- ═══════════════════════════════════════════════════════════════════

SELECT 'Business logic migration completed: 5 RPC functions created' AS result;
