-- Fix: get_user_tier() should return 'free' by default if user doesn't exist
-- This prevents RLS policy failures for new users before their profile is created

CREATE OR REPLACE FUNCTION get_user_tier()
RETURNS subscription_tier AS $$
BEGIN
  RETURN COALESCE(
    (SELECT subscription_tier FROM users WHERE id = auth.uid()),
    'free'::subscription_tier -- Default to free tier if user not in table yet
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Also fix get_calculations_this_month to handle missing user
CREATE OR REPLACE FUNCTION get_calculations_this_month()
RETURNS INTEGER AS $$
BEGIN
  RETURN COALESCE(
    (SELECT calculations_this_month FROM users WHERE id = auth.uid()),
    0 -- Default to 0 if user not in table yet
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
