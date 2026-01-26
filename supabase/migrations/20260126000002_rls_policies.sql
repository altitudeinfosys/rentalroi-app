-- RentalROI Row-Level Security (RLS) Policies
-- Created: 2026-01-26
-- Purpose: Enforce subscription tiers and data access control

-- =====================================================
-- Enable RLS on all tables
-- =====================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE calculations ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE projections ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- Helper Functions for RLS
-- =====================================================

-- Get current user's subscription tier
CREATE OR REPLACE FUNCTION get_user_tier()
RETURNS subscription_tier AS $$
BEGIN
  RETURN (
    SELECT subscription_tier
    FROM users
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if subscription is active (not expired)
CREATE OR REPLACE FUNCTION is_subscription_active()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT
      subscription_tier != 'free'
      AND (
        subscription_expires_at IS NULL
        OR subscription_expires_at > NOW()
      )
    FROM users
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get calculation count this month
CREATE OR REPLACE FUNCTION get_calculations_this_month()
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COALESCE(
      (SELECT calculations_this_month FROM users WHERE id = auth.uid()),
      0
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Users Table Policies
-- =====================================================

-- Users can read their own profile
CREATE POLICY "Users can read own profile"
  ON users
  FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile (except subscription fields)
CREATE POLICY "Users can update own profile"
  ON users
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND subscription_tier = (SELECT subscription_tier FROM users WHERE id = auth.uid())
    AND subscription_expires_at = (SELECT subscription_expires_at FROM users WHERE id = auth.uid())
  );

-- Users are inserted automatically via trigger (handled by Supabase Auth)
-- Service role can manage subscriptions
CREATE POLICY "Service role can manage users"
  ON users
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- =====================================================
-- Properties Table Policies
-- =====================================================

-- Users can read their own properties
CREATE POLICY "Users can read own properties"
  ON properties
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own properties
CREATE POLICY "Users can insert own properties"
  ON properties
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own properties
CREATE POLICY "Users can update own properties"
  ON properties
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own properties
CREATE POLICY "Users can delete own properties"
  ON properties
  FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- Calculations Table Policies
-- =====================================================

-- Users can read their own calculations
CREATE POLICY "Users can read own calculations"
  ON calculations
  FOR SELECT
  USING (auth.uid() = user_id);

-- Free tier: max 3 calculations per month
-- Pro/Premium: unlimited
CREATE POLICY "Tier enforcement for calculation creation"
  ON calculations
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND (
      -- Pro or Premium: unlimited
      get_user_tier() IN ('pro', 'premium')
      OR
      -- Free tier: under 3 this month
      (
        get_user_tier() = 'free'
        AND get_calculations_this_month() < 3
      )
    )
  );

-- Users can update their own calculations
CREATE POLICY "Users can update own calculations"
  ON calculations
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own calculations
CREATE POLICY "Users can delete own calculations"
  ON calculations
  FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- Projections Table Policies
-- =====================================================

-- Users can read projections for their own calculations
CREATE POLICY "Users can read own projections"
  ON projections
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM calculations c
      WHERE c.id = projections.calculation_id
      AND c.user_id = auth.uid()
    )
  );

-- Only Pro/Premium users can create multi-year projections
CREATE POLICY "Pro+ users can create projections"
  ON projections
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM calculations c
      WHERE c.id = projections.calculation_id
      AND c.user_id = auth.uid()
    )
    AND get_user_tier() IN ('pro', 'premium')
  );

-- Users can update projections for their own calculations
CREATE POLICY "Users can update own projections"
  ON projections
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM calculations c
      WHERE c.id = projections.calculation_id
      AND c.user_id = auth.uid()
    )
  );

-- Users can delete projections for their own calculations
CREATE POLICY "Users can delete own projections"
  ON projections
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1
      FROM calculations c
      WHERE c.id = projections.calculation_id
      AND c.user_id = auth.uid()
    )
  );

-- =====================================================
-- Shared Links Table Policies
-- =====================================================

-- Users can read their own shared links
CREATE POLICY "Users can read own shared links"
  ON shared_links
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create shared links for their own calculations
-- Free tier: links expire in 7 days
-- Pro/Premium: links never expire
CREATE POLICY "Users can create shared links"
  ON shared_links
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1
      FROM calculations c
      WHERE c.id = shared_links.calculation_id
      AND c.user_id = auth.uid()
    )
    AND (
      -- Free tier: must have expiration
      (
        get_user_tier() = 'free'
        AND expires_at IS NOT NULL
        AND expires_at <= NOW() + INTERVAL '7 days'
      )
      OR
      -- Pro/Premium: can have no expiration
      get_user_tier() IN ('pro', 'premium')
    )
  );

-- Users can delete their own shared links
CREATE POLICY "Users can delete own shared links"
  ON shared_links
  FOR DELETE
  USING (auth.uid() = user_id);

-- Public can read shared calculations (via token, not user_id)
-- This will be handled via service role in the API, not RLS

-- =====================================================
-- Audit Logs Table Policies
-- =====================================================

-- Only service role can write audit logs
CREATE POLICY "Service role can insert audit logs"
  ON audit_logs
  FOR INSERT
  WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- Users can read their own audit logs
CREATE POLICY "Users can read own audit logs"
  ON audit_logs
  FOR SELECT
  USING (auth.uid() = user_id);

-- =====================================================
-- Triggers for automatic user creation
-- =====================================================

-- Automatically create user profile when auth user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users insert
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- Indexes for RLS performance
-- =====================================================

-- These indexes help RLS policies run faster
CREATE INDEX IF NOT EXISTS idx_calculations_user_id_created_at
  ON calculations(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_properties_user_id_created_at
  ON properties(user_id, created_at DESC);

-- =====================================================
-- Grant permissions
-- =====================================================

-- Authenticated users can access their own data
GRANT SELECT, INSERT, UPDATE, DELETE ON users TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON properties TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON calculations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON shared_links TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON projections TO authenticated;
GRANT SELECT ON audit_logs TO authenticated;

-- Service role has full access
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;
