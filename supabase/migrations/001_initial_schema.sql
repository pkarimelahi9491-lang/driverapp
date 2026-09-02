-- ═══════════════════════════════════════════════════════════════════
-- Arman Fleet Management System - Database Schema
-- Source of truth: backend/prisma/schema.prisma
-- Compatible with: PostgreSQL 14+ / Supabase
-- Execution order: Extensions → Enums → Tables → Indexes → Triggers
-- ═══════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════
-- STEP 1: Extensions
-- ═══════════════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ═══════════════════════════════════════════════════════════════════
-- STEP 2: Enums
-- ═══════════════════════════════════════════════════════════════════

DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('DRIVER', 'ADMIN', 'FINANCE');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE daily_work_status AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'FINALIZED', 'REJECTED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE payment_status AS ENUM ('CALCULATING', 'PENDING_APPROVAL', 'APPROVED', 'SENT_TO_FINANCE', 'PAID');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE route_request_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ═══════════════════════════════════════════════════════════════════
-- STEP 3: users
-- Prisma: model User { id, username, passwordHash, role, isActive, createdAt, updatedAt }
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username      VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role          user_role NOT NULL DEFAULT 'DRIVER',
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT users_username_unique UNIQUE (username)
);

-- ═══════════════════════════════════════════════════════════════════
-- STEP 4: drivers
-- Prisma: model Driver { ... userId, fullName, driverCode, personnelCode,
--   phoneNumber, nationalId?, carModel, carPlate, joinDateJalali,
--   isActive, description, createdAt, updatedAt }
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS drivers (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID NOT NULL,
  full_name        VARCHAR(255) NOT NULL,
  driver_code      VARCHAR(50) NOT NULL,
  personnel_code   VARCHAR(50) NOT NULL,
  phone_number     VARCHAR(20) NOT NULL,
  national_id      VARCHAR(20),
  car_model        VARCHAR(100) NOT NULL,
  car_plate        VARCHAR(50) NOT NULL,
  join_date_jalali VARCHAR(20) NOT NULL,
  is_active        BOOLEAN NOT NULL DEFAULT true,
  description      TEXT NOT NULL DEFAULT '',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT drivers_user_id_unique UNIQUE (user_id),
  CONSTRAINT drivers_driver_code_unique UNIQUE (driver_code),
  CONSTRAINT drivers_personnel_code_unique UNIQUE (personnel_code),
  CONSTRAINT drivers_user_id_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ═══════════════════════════════════════════════════════════════════
-- STEP 5: locations
-- Prisma: model Location { id, name, city, isActive, createdAt }
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS locations (
  id         SERIAL PRIMARY KEY,
  name       VARCHAR(255) NOT NULL,
  city       VARCHAR(100) NOT NULL,
  is_active  BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT locations_name_unique UNIQUE (name)
);

-- ═══════════════════════════════════════════════════════════════════
-- STEP 6: routes
-- Prisma: model Route { id, routeCode, originId, destinationId,
--   currentPrice, currency, distanceKm, ratePerKm, isActive,
--   description, createdAt, updatedAt }
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS routes (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  route_code      VARCHAR(50) NOT NULL,
  origin_id       INTEGER NOT NULL,
  destination_id  INTEGER NOT NULL,
  current_price   BIGINT NOT NULL,
  currency        VARCHAR(10) NOT NULL DEFAULT 'TOMAN',
  distance_km     INTEGER NOT NULL DEFAULT 0,
  rate_per_km     BIGINT NOT NULL DEFAULT 0,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  description     TEXT NOT NULL DEFAULT '',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT routes_route_code_unique UNIQUE (route_code),
  CONSTRAINT routes_origin_id_fk FOREIGN KEY (origin_id) REFERENCES locations(id) ON DELETE RESTRICT,
  CONSTRAINT routes_destination_id_fk FOREIGN KEY (destination_id) REFERENCES locations(id) ON DELETE RESTRICT
);

-- ═══════════════════════════════════════════════════════════════════
-- STEP 7: route_price_history
-- Prisma: model RoutePriceHistory { id, routeId, routeCode,
--   oldPrice, newPrice, changedBy, effectiveDate, createdAt }
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS route_price_history (
  id              SERIAL PRIMARY KEY,
  route_id        UUID NOT NULL,
  route_code      VARCHAR(50) NOT NULL,
  old_price       BIGINT NOT NULL,
  new_price       BIGINT NOT NULL,
  changed_by      VARCHAR(255) NOT NULL,
  effective_date  VARCHAR(20) NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT rph_route_id_fk FOREIGN KEY (route_id) REFERENCES routes(id) ON DELETE CASCADE
);

-- ═══════════════════════════════════════════════════════════════════
-- STEP 8: daily_work_logs
-- Prisma: model DailyWorkLog { id, driverId, jalaliDate, totalTrips,
--   totalIncome, status, finalizedAt?, approvedBy?, rejectionReason?,
--   notes, createdAt, updatedAt }
-- UNIQUE(driverId, jalaliDate)
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS daily_work_logs (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  driver_id        UUID NOT NULL,
  jalali_date      VARCHAR(20) NOT NULL,
  total_trips      INTEGER NOT NULL DEFAULT 0,
  total_income     BIGINT NOT NULL DEFAULT 0,
  status           daily_work_status NOT NULL DEFAULT 'DRAFT',
  finalized_at     TIMESTAMPTZ,
  approved_by      VARCHAR(255),
  rejection_reason TEXT,
  notes            TEXT NOT NULL DEFAULT '',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT dwl_driver_id_fk FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE CASCADE,
  CONSTRAINT dwl_driver_date_unique UNIQUE (driver_id, jalali_date)
);

-- ═══════════════════════════════════════════════════════════════════
-- STEP 9: trips
-- Prisma: model Trip { id, tripCode, dailyWorkId, driverId, routeId,
--   originTitle, destinationTitle, routeCode, snapshotPrice, currency,
--   tripJalaliDate, startTime, endTime?, description, isCancelled,
--   createdAt }
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS trips (
  id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_code          VARCHAR(100) NOT NULL,
  daily_work_id      UUID NOT NULL,
  driver_id          UUID NOT NULL,
  route_id           UUID NOT NULL,
  origin_title       VARCHAR(255) NOT NULL,
  destination_title  VARCHAR(255) NOT NULL,
  route_code         VARCHAR(50) NOT NULL,
  snapshot_price     BIGINT NOT NULL,
  currency           VARCHAR(10) NOT NULL DEFAULT 'TOMAN',
  trip_jalali_date   VARCHAR(20) NOT NULL,
  start_time         VARCHAR(10) NOT NULL,
  end_time           VARCHAR(10),
  description        TEXT NOT NULL DEFAULT '',
  is_cancelled       BOOLEAN NOT NULL DEFAULT false,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT trips_trip_code_unique UNIQUE (trip_code),
  CONSTRAINT trips_daily_work_id_fk FOREIGN KEY (daily_work_id) REFERENCES daily_work_logs(id) ON DELETE CASCADE,
  CONSTRAINT trips_driver_id_fk FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE CASCADE,
  CONSTRAINT trips_route_id_fk FOREIGN KEY (route_id) REFERENCES routes(id) ON DELETE RESTRICT
);

-- ═══════════════════════════════════════════════════════════════════
-- STEP 10: financial_periods
-- Prisma: model FinancialPeriod { id, jalaliYearMonth, status,
--   approvedBy?, paidAtJalali?, totalAmount, notes, createdAt, updatedAt }
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS financial_periods (
  id                  SERIAL PRIMARY KEY,
  jalali_year_month   VARCHAR(10) NOT NULL,
  status              payment_status NOT NULL DEFAULT 'PENDING_APPROVAL',
  approved_by         VARCHAR(255),
  paid_at_jalali      VARCHAR(20),
  total_amount        BIGINT NOT NULL DEFAULT 0,
  notes               TEXT NOT NULL DEFAULT '',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fp_jalali_year_month_unique UNIQUE (jalali_year_month)
);

-- ═══════════════════════════════════════════════════════════════════
-- STEP 11: route_requests
-- Prisma: model RouteRequest { id, driverId, originName,
--   destinationName, notes, status, adminNote?, createdAt, updatedAt }
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS route_requests (
  id               SERIAL PRIMARY KEY,
  driver_id        UUID NOT NULL,
  origin_name      VARCHAR(255) NOT NULL,
  destination_name VARCHAR(255) NOT NULL,
  notes            TEXT NOT NULL DEFAULT '',
  status           route_request_status NOT NULL DEFAULT 'PENDING',
  admin_note       TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT rr_driver_id_fk FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE CASCADE
);

-- ═══════════════════════════════════════════════════════════════════
-- STEP 12: audit_logs
-- Prisma: model AuditLog { id, userId?, operatorName, operatorRole,
--   action, entityTitle, details, jalaliTimestamp, createdAt }
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS audit_logs (
  id                SERIAL PRIMARY KEY,
  user_id           UUID,
  operator_name     VARCHAR(255) NOT NULL,
  operator_role     VARCHAR(50) NOT NULL,
  action            VARCHAR(100) NOT NULL,
  entity_title      VARCHAR(255) NOT NULL,
  details           TEXT NOT NULL,
  jalali_timestamp  VARCHAR(50) NOT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════════
-- STEP 13: Indexes
-- ═══════════════════════════════════════════════════════════════════

-- drivers
CREATE INDEX IF NOT EXISTS idx_drivers_driver_code ON drivers(driver_code);
CREATE INDEX IF NOT EXISTS idx_drivers_personnel_code ON drivers(personnel_code);
CREATE INDEX IF NOT EXISTS idx_drivers_is_active ON drivers(is_active);

-- locations
CREATE INDEX IF NOT EXISTS idx_locations_name ON locations(name);
CREATE INDEX IF NOT EXISTS idx_locations_city ON locations(city);

-- routes
CREATE INDEX IF NOT EXISTS idx_routes_route_code ON routes(route_code);
CREATE INDEX IF NOT EXISTS idx_routes_origin_destination ON routes(origin_id, destination_id);
CREATE INDEX IF NOT EXISTS idx_routes_is_active ON routes(is_active);

-- route_price_history
CREATE INDEX IF NOT EXISTS idx_rph_route_id ON route_price_history(route_id);
CREATE INDEX IF NOT EXISTS idx_rph_route_code ON route_price_history(route_code);

-- daily_work_logs
CREATE INDEX IF NOT EXISTS idx_dwl_jalali_date ON daily_work_logs(jalali_date);
CREATE INDEX IF NOT EXISTS idx_dwl_status ON daily_work_logs(status);
CREATE INDEX IF NOT EXISTS idx_dwl_driver_date ON daily_work_logs(driver_id, jalali_date);

-- trips
CREATE INDEX IF NOT EXISTS idx_trips_trip_code ON trips(trip_code);
CREATE INDEX IF NOT EXISTS idx_trips_driver_date ON trips(driver_id, trip_jalali_date);
CREATE INDEX IF NOT EXISTS idx_trips_daily_work_id ON trips(daily_work_id);
CREATE INDEX IF NOT EXISTS idx_trips_jalali_date ON trips(trip_jalali_date);

-- route_requests
CREATE INDEX IF NOT EXISTS idx_rr_status ON route_requests(status);

-- audit_logs
CREATE INDEX IF NOT EXISTS idx_audit_created_at ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_operator_role ON audit_logs(operator_role);

-- ═══════════════════════════════════════════════════════════════════
-- STEP 14: updated_at Triggers
-- ═══════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TRIGGER trg_drivers_updated_at BEFORE UPDATE ON drivers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TRIGGER trg_routes_updated_at BEFORE UPDATE ON routes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TRIGGER trg_daily_work_logs_updated_at BEFORE UPDATE ON daily_work_logs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TRIGGER trg_financial_periods_updated_at BEFORE UPDATE ON financial_periods FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TRIGGER trg_route_requests_updated_at BEFORE UPDATE ON route_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ═══════════════════════════════════════════════════════════════════
-- DONE: 10 tables, 4 enums, 20 indexes, 6 triggers
-- ═══════════════════════════════════════════════════════════════════

SELECT 'Schema migration completed successfully' AS result;
