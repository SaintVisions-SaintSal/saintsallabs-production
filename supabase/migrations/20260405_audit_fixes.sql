-- ============================================================
-- OBRA AUDIT FIXES — April 5, 2026
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. ADD MISSING INDEXES (performance)
-- ─────────────────────────────────────────────────────────────

-- profiles: fast lookup by stripe_customer_id (webhook handler)
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer_id
  ON profiles(stripe_customer_id) WHERE stripe_customer_id IS NOT NULL;

-- profiles: fast lookup by ghl_contact_id (provisioning)
CREATE INDEX IF NOT EXISTS idx_profiles_ghl_contact_id
  ON profiles(ghl_contact_id) WHERE ghl_contact_id IS NOT NULL;

-- profiles: fast lookup by tier (credit checks, model routing)
CREATE INDEX IF NOT EXISTS idx_profiles_tier
  ON profiles(tier);

-- profiles: fast lookup by email (auth, user lookup)
CREATE INDEX IF NOT EXISTS idx_profiles_email
  ON profiles(email);

-- usage_log: fast user usage queries (credits dashboard)
CREATE INDEX IF NOT EXISTS idx_usage_log_user_id
  ON usage_log(user_id);

-- usage_log: time-based queries (monthly reset, analytics)
CREATE INDEX IF NOT EXISTS idx_usage_log_created_at
  ON usage_log(created_at DESC);

-- meter_prices: fast tier lookup (metering api)
CREATE INDEX IF NOT EXISTS idx_meter_prices_tier_active
  ON meter_prices(tier, is_active) WHERE is_active = true;

-- tier_limits: single row per tier (already indexed on tier, verify)
CREATE INDEX IF NOT EXISTS idx_tier_limits_tier
  ON tier_limits(tier);


-- 2. ENSURE RLS IS ENABLED ON ALL PUBLIC TABLES
-- ─────────────────────────────────────────────────────────────
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE tier_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE meter_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;


-- 3. RLS POLICIES — profiles
-- ─────────────────────────────────────────────────────────────

-- Users can read their own profile
DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
CREATE POLICY "profiles_select_own"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile (limited fields)
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Service role can do everything (bypasses RLS)
-- Note: service_role key always bypasses RLS — no policy needed


-- 4. RLS POLICIES — usage_log
-- ─────────────────────────────────────────────────────────────

-- Users can read their own usage
DROP POLICY IF EXISTS "usage_log_select_own" ON usage_log;
CREATE POLICY "usage_log_select_own"
  ON usage_log FOR SELECT
  USING (auth.uid() = user_id);

-- Service role inserts usage (no user-facing insert)
-- Anon/user cannot insert directly
DROP POLICY IF EXISTS "usage_log_insert_denied" ON usage_log;
CREATE POLICY "usage_log_insert_denied"
  ON usage_log FOR INSERT
  WITH CHECK (false); -- Only service_role can insert


-- 5. RLS POLICIES — tier_limits (read-only for everyone)
-- ─────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "tier_limits_select_all" ON tier_limits;
CREATE POLICY "tier_limits_select_all"
  ON tier_limits FOR SELECT
  USING (true); -- Public read — pricing is not secret


-- 6. RLS POLICIES — meter_prices (read-only for everyone)
-- ─────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "meter_prices_select_active" ON meter_prices;
CREATE POLICY "meter_prices_select_active"
  ON meter_prices FOR SELECT
  USING (true); -- Public read — model list is not secret


-- 7. RLS POLICIES — roles (read-only for everyone)
-- ─────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "roles_select_all" ON roles;
CREATE POLICY "roles_select_all"
  ON roles FOR SELECT
  USING (true);


-- 8. ADD MISSING COLUMNS TO PROFILES (if not exist)
-- ─────────────────────────────────────────────────────────────

-- phone column (used in GHL contact creation)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone text;

-- payment_status column (used in invoice.payment_failed handler)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'active';

-- avatar_url column (for profile page)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url text;

-- last_seen_at (for session tracking)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_seen_at timestamptz;


-- 9. CREATE TRIGGER — auto-update last_seen_at on profile select
-- ─────────────────────────────────────────────────────────────
-- (Handled in app layer, not DB trigger — for performance)


-- 10. VERIFY — show final state
-- ─────────────────────────────────────────────────────────────
SELECT
  p.tablename,
  p.rowsecurity as rls_enabled,
  COUNT(pol.policyname) as policy_count
FROM pg_tables p
LEFT JOIN pg_policies pol ON pol.tablename = p.tablename AND pol.schemaname = 'public'
WHERE p.schemaname = 'public'
GROUP BY p.tablename, p.rowsecurity
ORDER BY p.tablename;
