-- Security Fix: Pin search_path for SECURITY DEFINER functions
-- This prevents potential search_path hijacking attacks where an attacker
-- could create malicious objects in a user-controlled schema that gets
-- searched before the intended schema.

-- Fix get_user_tier() to use explicit search_path
CREATE OR REPLACE FUNCTION get_user_tier()
RETURNS subscription_tier AS $$
DECLARE
  tier subscription_tier;
BEGIN
  SELECT subscription_tier INTO tier
  FROM users
  WHERE id = auth.uid();

  -- Default to free tier if user not in table yet
  RETURN COALESCE(tier, 'free'::subscription_tier);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_catalog;

-- Fix get_calculations_this_month() to use explicit search_path
CREATE OR REPLACE FUNCTION get_calculations_this_month()
RETURNS INTEGER AS $$
DECLARE
  calc_count INTEGER;
BEGIN
  SELECT calculations_this_month INTO calc_count
  FROM users
  WHERE id = auth.uid();

  -- Default to 0 if user not in table yet
  RETURN COALESCE(calc_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_catalog;

-- Add comment explaining the security fix
COMMENT ON FUNCTION get_user_tier() IS
  'Returns the subscription tier for the current user. Uses SECURITY DEFINER with pinned search_path for security.';

COMMENT ON FUNCTION get_calculations_this_month() IS
  'Returns the calculation count this month for the current user. Uses SECURITY DEFINER with pinned search_path for security.';
