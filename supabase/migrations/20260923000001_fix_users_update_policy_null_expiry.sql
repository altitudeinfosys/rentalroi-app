-- Fix: "Users can update own profile" always failed for real users.
--
-- The original WITH CHECK compared subscription_expires_at with `=` against
-- the existing row. That column is NULL for every non-paying user, and
-- NULL = NULL evaluates to NULL, so the check never passed and every
-- client-side UPDATE on users (e.g. editing the display name in Settings)
-- was rejected with "new row violates row-level security policy".
-- IS NOT DISTINCT FROM treats two NULLs as equal.

DROP POLICY IF EXISTS "Users can update own profile" ON users;

CREATE POLICY "Users can update own profile"
  ON users
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND subscription_tier IS NOT DISTINCT FROM (SELECT u.subscription_tier FROM users u WHERE u.id = auth.uid())
    AND subscription_expires_at IS NOT DISTINCT FROM (SELECT u.subscription_expires_at FROM users u WHERE u.id = auth.uid())
  );

COMMENT ON POLICY "Users can update own profile" ON users IS
  'Users may edit their own profile but cannot change subscription fields. Null-safe comparison (2026-09-23).';
