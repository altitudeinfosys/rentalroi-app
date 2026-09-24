-- Harden the calculation-count trigger function.
--
-- PROD had been hot-patched to SECURITY DEFINER with a pinned search_path
-- (so the trigger's UPDATE on users is not subject to the inserting user's
-- RLS), while DEV and this repo still had the original unprivileged version.
-- This migration makes the definition identical everywhere and records it.

CREATE OR REPLACE FUNCTION increment_calculation_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Reset count if it's a new month
  IF (SELECT last_calculation_reset_at FROM users WHERE id = NEW.user_id) < DATE_TRUNC('month', NOW()) THEN
    UPDATE users
    SET
      calculations_this_month = 1,
      last_calculation_reset_at = NOW()
    WHERE id = NEW.user_id;
  ELSE
    -- Increment count
    UPDATE users
    SET calculations_this_month = calculations_this_month + 1
    WHERE id = NEW.user_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_catalog;

COMMENT ON FUNCTION increment_calculation_count() IS
  'Trigger: tracks calculations_this_month per user. SECURITY DEFINER with pinned search_path so it runs regardless of the caller''s RLS.';
