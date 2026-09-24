-- Open beta: every feature is free for now.
--
-- Removes the tier-based caps from RLS so free users are not blocked.
-- The tier plumbing (users.subscription_tier, get_user_tier(),
-- get_calculations_this_month(), the usage counter trigger) is left in place
-- so a paid tier can be re-introduced later by restoring these policies.
-- See docs/product/tier-plan.html for the record of the original tiers.

-- 1. Calculations: was "free < 3 per month, pro/premium unlimited".
DROP POLICY IF EXISTS "Tier enforcement for calculation creation" ON calculations;

CREATE POLICY "Users can create own calculations"
  ON calculations
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 2. Shared links: was "free links must expire within 7 days, pro unlimited".
--    The API already bypassed this with the service role and issues 30-day
--    links; this makes the policy match reality so the bypass can be removed.
DROP POLICY IF EXISTS "Users can create shared links" ON shared_links;

CREATE POLICY "Users can create shared links"
  ON shared_links
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM calculations c
      WHERE c.id = shared_links.calculation_id
      AND c.user_id = auth.uid()
    )
  );

-- 3. Projections: was pro/premium only. Table is unused by the app today,
--    but keep the ownership check and drop the tier check for consistency.
DROP POLICY IF EXISTS "Pro+ users can create projections" ON projections;

CREATE POLICY "Users can create projections for own calculations"
  ON projections
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM calculations c
      WHERE c.id = projections.calculation_id
      AND c.user_id = auth.uid()
    )
  );

COMMENT ON POLICY "Users can create own calculations" ON calculations IS
  'Open beta (2026-09): no monthly cap. Restore tier check when paid plans launch.';
