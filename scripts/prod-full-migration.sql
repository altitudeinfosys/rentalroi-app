-- =====================================================
-- RENTALROI PROD DATABASE - FULL MIGRATION
-- Apply this to: https://supabase.com/dashboard/project/mgpacftgrgcyvpjguoxs/sql/new
-- =====================================================

-- ===========================================
-- MIGRATION 1: Initial Schema
-- ===========================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE subscription_tier AS ENUM ('free', 'pro', 'premium');
CREATE TYPE property_type AS ENUM ('single_family', 'multi_family', 'condo', 'townhouse', 'commercial', 'other');

-- Users Table (extends Supabase auth.users)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  subscription_tier subscription_tier NOT NULL DEFAULT 'free',
  subscription_expires_at TIMESTAMPTZ,
  revenuecat_user_id TEXT,
  revenuecat_subscription_id TEXT,
  calculations_this_month INTEGER NOT NULL DEFAULT 0,
  last_calculation_reset_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_subscription_tier ON users(subscription_tier);
CREATE INDEX idx_users_revenuecat_user_id ON users(revenuecat_user_id);

-- Properties Table
CREATE TABLE properties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  property_type property_type NOT NULL DEFAULT 'single_family',
  address TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  bedrooms INTEGER,
  bathrooms DECIMAL(3,1),
  square_feet INTEGER,
  year_built INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_properties_user_id ON properties(user_id);
CREATE INDEX idx_properties_city ON properties(city);
CREATE INDEX idx_properties_property_type ON properties(property_type);

-- Calculations Table
CREATE TABLE calculations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  holding_length INTEGER NOT NULL DEFAULT 1,
  purchase_price DECIMAL(12,2) NOT NULL,
  down_payment_percent DECIMAL(5,2) NOT NULL,
  closing_costs DECIMAL(12,2) NOT NULL DEFAULT 0,
  repair_costs DECIMAL(12,2) NOT NULL DEFAULT 0,
  interest_rate DECIMAL(5,3) NOT NULL,
  loan_term_years INTEGER NOT NULL DEFAULT 30,
  monthly_rent DECIMAL(10,2) NOT NULL,
  other_monthly_income DECIMAL(10,2) NOT NULL DEFAULT 0,
  vacancy_rate DECIMAL(5,2) NOT NULL DEFAULT 5.0,
  annual_rent_increase DECIMAL(5,2) NOT NULL DEFAULT 2.0,
  property_tax_annual DECIMAL(10,2) NOT NULL,
  insurance_annual DECIMAL(10,2) NOT NULL,
  hoa_monthly DECIMAL(10,2) NOT NULL DEFAULT 0,
  maintenance_monthly DECIMAL(10,2) NOT NULL DEFAULT 0,
  property_management_percent DECIMAL(5,2) NOT NULL DEFAULT 0,
  utilities_monthly DECIMAL(10,2) NOT NULL DEFAULT 0,
  other_expenses_monthly DECIMAL(10,2) NOT NULL DEFAULT 0,
  annual_appreciation_rate DECIMAL(5,2) NOT NULL DEFAULT 3.0,
  sale_closing_costs_percent DECIMAL(5,2) NOT NULL DEFAULT 6.0,
  total_investment DECIMAL(12,2),
  monthly_mortgage_payment DECIMAL(10,2),
  monthly_gross_income DECIMAL(10,2),
  monthly_expenses DECIMAL(10,2),
  monthly_cash_flow DECIMAL(10,2),
  annual_cash_flow DECIMAL(12,2),
  cash_on_cash_return DECIMAL(6,3),
  cap_rate DECIMAL(6,3),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_calculations_user_id ON calculations(user_id);
CREATE INDEX idx_calculations_property_id ON calculations(property_id);
CREATE INDEX idx_calculations_created_at ON calculations(created_at DESC);
CREATE INDEX idx_calculations_cash_on_cash_return ON calculations(cash_on_cash_return DESC);

-- Shared Links Table
CREATE TABLE shared_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  calculation_id UUID NOT NULL REFERENCES calculations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ,
  view_count INTEGER NOT NULL DEFAULT 0,
  last_viewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_shared_links_token ON shared_links(token);
CREATE INDEX idx_shared_links_calculation_id ON shared_links(calculation_id);
CREATE INDEX idx_shared_links_user_id ON shared_links(user_id);
CREATE INDEX idx_shared_links_expires_at ON shared_links(expires_at) WHERE expires_at IS NOT NULL;

-- Projections Table
CREATE TABLE projections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  calculation_id UUID NOT NULL REFERENCES calculations(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  gross_income DECIMAL(12,2) NOT NULL,
  vacancy_loss DECIMAL(12,2) NOT NULL,
  net_income DECIMAL(12,2) NOT NULL,
  property_tax DECIMAL(10,2) NOT NULL,
  insurance DECIMAL(10,2) NOT NULL,
  hoa DECIMAL(10,2) NOT NULL,
  maintenance DECIMAL(10,2) NOT NULL,
  property_management DECIMAL(10,2) NOT NULL,
  utilities DECIMAL(10,2) NOT NULL,
  other_expenses DECIMAL(10,2) NOT NULL,
  total_expenses DECIMAL(12,2) NOT NULL,
  mortgage_payment DECIMAL(12,2) NOT NULL,
  principal_paid DECIMAL(12,2) NOT NULL,
  interest_paid DECIMAL(12,2) NOT NULL,
  cash_flow DECIMAL(12,2) NOT NULL,
  cumulative_cash_flow DECIMAL(12,2) NOT NULL,
  property_value DECIMAL(12,2) NOT NULL,
  loan_balance DECIMAL(12,2) NOT NULL,
  equity DECIMAL(12,2) NOT NULL,
  cash_on_cash_return DECIMAL(6,3),
  equity_multiple DECIMAL(6,3),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(calculation_id, year)
);

CREATE INDEX idx_projections_calculation_id ON projections(calculation_id);
CREATE INDEX idx_projections_year ON projections(year);

-- Audit Logs Table
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  metadata JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_properties_updated_at
  BEFORE UPDATE ON properties
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_calculations_updated_at
  BEFORE UPDATE ON calculations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to reset monthly calculation count
CREATE OR REPLACE FUNCTION reset_monthly_calculations()
RETURNS void AS $$
BEGIN
  UPDATE users
  SET
    calculations_this_month = 0,
    last_calculation_reset_at = NOW()
  WHERE
    last_calculation_reset_at < DATE_TRUNC('month', NOW());
END;
$$ LANGUAGE plpgsql;

-- Function to increment calculation count
CREATE OR REPLACE FUNCTION increment_calculation_count()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT last_calculation_reset_at FROM users WHERE id = NEW.user_id) < DATE_TRUNC('month', NOW()) THEN
    UPDATE users
    SET
      calculations_this_month = 1,
      last_calculation_reset_at = NOW()
    WHERE id = NEW.user_id;
  ELSE
    UPDATE users
    SET calculations_this_month = calculations_this_month + 1
    WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER track_calculation_count
  AFTER INSERT ON calculations
  FOR EACH ROW
  EXECUTE FUNCTION increment_calculation_count();

-- ===========================================
-- MIGRATION 2: RLS Policies
-- ===========================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE calculations ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE projections ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper functions for RLS
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

-- Users Table Policies
CREATE POLICY "Users can read own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND subscription_tier = (SELECT subscription_tier FROM users WHERE id = auth.uid())
    AND subscription_expires_at = (SELECT subscription_expires_at FROM users WHERE id = auth.uid())
  );

CREATE POLICY "Service role can manage users"
  ON users FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- Properties Table Policies
CREATE POLICY "Users can read own properties"
  ON properties FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own properties"
  ON properties FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own properties"
  ON properties FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own properties"
  ON properties FOR DELETE
  USING (auth.uid() = user_id);

-- Calculations Table Policies
CREATE POLICY "Users can read own calculations"
  ON calculations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Tier enforcement for calculation creation"
  ON calculations FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND (
      get_user_tier() IN ('pro', 'premium')
      OR (
        get_user_tier() = 'free'
        AND get_calculations_this_month() < 3
      )
    )
  );

CREATE POLICY "Users can update own calculations"
  ON calculations FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own calculations"
  ON calculations FOR DELETE
  USING (auth.uid() = user_id);

-- Projections Table Policies
CREATE POLICY "Users can read own projections"
  ON projections FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM calculations c
      WHERE c.id = projections.calculation_id
      AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "Pro+ users can create projections"
  ON projections FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM calculations c
      WHERE c.id = projections.calculation_id
      AND c.user_id = auth.uid()
    )
    AND get_user_tier() IN ('pro', 'premium')
  );

CREATE POLICY "Users can update own projections"
  ON projections FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM calculations c
      WHERE c.id = projections.calculation_id
      AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own projections"
  ON projections FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM calculations c
      WHERE c.id = projections.calculation_id
      AND c.user_id = auth.uid()
    )
  );

-- Shared Links Table Policies
CREATE POLICY "Users can read own shared links"
  ON shared_links FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create shared links"
  ON shared_links FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM calculations c
      WHERE c.id = shared_links.calculation_id
      AND c.user_id = auth.uid()
    )
    AND (
      (
        get_user_tier() = 'free'
        AND expires_at IS NOT NULL
        AND expires_at <= NOW() + INTERVAL '7 days'
      )
      OR get_user_tier() IN ('pro', 'premium')
    )
  );

CREATE POLICY "Users can delete own shared links"
  ON shared_links FOR DELETE
  USING (auth.uid() = user_id);

-- Audit Logs Table Policies
CREATE POLICY "Service role can insert audit logs"
  ON audit_logs FOR INSERT
  WITH CHECK (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Users can read own audit logs"
  ON audit_logs FOR SELECT
  USING (auth.uid() = user_id);

-- Trigger for automatic user creation
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

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Additional indexes for RLS performance
CREATE INDEX IF NOT EXISTS idx_calculations_user_id_created_at
  ON calculations(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_properties_user_id_created_at
  ON properties(user_id, created_at DESC);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON users TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON properties TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON calculations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON shared_links TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON projections TO authenticated;
GRANT SELECT ON audit_logs TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- ===========================================
-- MIGRATION 3: Add Missing Columns
-- ===========================================

ALTER TABLE calculations
ADD COLUMN IF NOT EXISTS property_type TEXT;

ALTER TABLE calculations
ADD COLUMN IF NOT EXISTS annual_expense_increase DECIMAL(5,2) DEFAULT 2.5;

ALTER TABLE calculations
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS state TEXT,
ADD COLUMN IF NOT EXISTS zip_code TEXT,
ADD COLUMN IF NOT EXISTS bedrooms INTEGER,
ADD COLUMN IF NOT EXISTS bathrooms DECIMAL(3,1),
ADD COLUMN IF NOT EXISTS square_feet INTEGER;

CREATE INDEX IF NOT EXISTS idx_calculations_property_type ON calculations(property_type);
CREATE INDEX IF NOT EXISTS idx_calculations_city ON calculations(city);

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
