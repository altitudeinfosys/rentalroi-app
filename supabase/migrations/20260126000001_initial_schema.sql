-- RentalROI Initial Database Schema
-- Created: 2026-01-26

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE subscription_tier AS ENUM ('free', 'pro', 'premium');
CREATE TYPE property_type AS ENUM ('single_family', 'multi_family', 'condo', 'townhouse', 'commercial', 'other');

-- =====================================================
-- Users Table (extends Supabase auth.users)
-- =====================================================
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,

  -- Subscription information
  subscription_tier subscription_tier NOT NULL DEFAULT 'free',
  subscription_expires_at TIMESTAMPTZ,

  -- RevenueCat integration
  revenuecat_user_id TEXT,
  revenuecat_subscription_id TEXT,

  -- Usage tracking
  calculations_this_month INTEGER NOT NULL DEFAULT 0,
  last_calculation_reset_at TIMESTAMPTZ DEFAULT NOW(),

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for subscription queries
CREATE INDEX idx_users_subscription_tier ON users(subscription_tier);
CREATE INDEX idx_users_revenuecat_user_id ON users(revenuecat_user_id);

-- =====================================================
-- Properties Table
-- =====================================================
CREATE TABLE properties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Property details
  title TEXT NOT NULL,
  property_type property_type NOT NULL DEFAULT 'single_family',
  address TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,

  -- Property characteristics
  bedrooms INTEGER,
  bathrooms DECIMAL(3,1),
  square_feet INTEGER,
  year_built INTEGER,

  -- Notes
  notes TEXT,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for properties
CREATE INDEX idx_properties_user_id ON properties(user_id);
CREATE INDEX idx_properties_city ON properties(city);
CREATE INDEX idx_properties_property_type ON properties(property_type);

-- =====================================================
-- Calculations Table
-- =====================================================
CREATE TABLE calculations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  property_id UUID REFERENCES properties(id) ON DELETE SET NULL,

  -- Calculation metadata
  title TEXT NOT NULL,
  holding_length INTEGER NOT NULL DEFAULT 1, -- Years

  -- Purchase inputs
  purchase_price DECIMAL(12,2) NOT NULL,
  down_payment_percent DECIMAL(5,2) NOT NULL,
  closing_costs DECIMAL(12,2) NOT NULL DEFAULT 0,
  repair_costs DECIMAL(12,2) NOT NULL DEFAULT 0,

  -- Loan inputs
  interest_rate DECIMAL(5,3) NOT NULL,
  loan_term_years INTEGER NOT NULL DEFAULT 30,

  -- Income inputs
  monthly_rent DECIMAL(10,2) NOT NULL,
  other_monthly_income DECIMAL(10,2) NOT NULL DEFAULT 0,
  vacancy_rate DECIMAL(5,2) NOT NULL DEFAULT 5.0,
  annual_rent_increase DECIMAL(5,2) NOT NULL DEFAULT 2.0,

  -- Expense inputs
  property_tax_annual DECIMAL(10,2) NOT NULL,
  insurance_annual DECIMAL(10,2) NOT NULL,
  hoa_monthly DECIMAL(10,2) NOT NULL DEFAULT 0,
  maintenance_monthly DECIMAL(10,2) NOT NULL DEFAULT 0,
  property_management_percent DECIMAL(5,2) NOT NULL DEFAULT 0,
  utilities_monthly DECIMAL(10,2) NOT NULL DEFAULT 0,
  other_expenses_monthly DECIMAL(10,2) NOT NULL DEFAULT 0,

  -- Appreciation & exit
  annual_appreciation_rate DECIMAL(5,2) NOT NULL DEFAULT 3.0,
  sale_closing_costs_percent DECIMAL(5,2) NOT NULL DEFAULT 6.0,

  -- Results (first year - calculated and stored for quick access)
  total_investment DECIMAL(12,2),
  monthly_mortgage_payment DECIMAL(10,2),
  monthly_gross_income DECIMAL(10,2),
  monthly_expenses DECIMAL(10,2),
  monthly_cash_flow DECIMAL(10,2),
  annual_cash_flow DECIMAL(12,2),
  cash_on_cash_return DECIMAL(6,3),
  cap_rate DECIMAL(6,3),

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for calculations
CREATE INDEX idx_calculations_user_id ON calculations(user_id);
CREATE INDEX idx_calculations_property_id ON calculations(property_id);
CREATE INDEX idx_calculations_created_at ON calculations(created_at DESC);
CREATE INDEX idx_calculations_cash_on_cash_return ON calculations(cash_on_cash_return DESC);

-- =====================================================
-- Shared Links Table (for sharing calculations)
-- =====================================================
CREATE TABLE shared_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  calculation_id UUID NOT NULL REFERENCES calculations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Link details
  token TEXT UNIQUE NOT NULL, -- URL-safe random token
  expires_at TIMESTAMPTZ, -- NULL = never expires (Pro/Premium users)

  -- Analytics
  view_count INTEGER NOT NULL DEFAULT 0,
  last_viewed_at TIMESTAMPTZ,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for shared links
CREATE INDEX idx_shared_links_token ON shared_links(token);
CREATE INDEX idx_shared_links_calculation_id ON shared_links(calculation_id);
CREATE INDEX idx_shared_links_user_id ON shared_links(user_id);
CREATE INDEX idx_shared_links_expires_at ON shared_links(expires_at) WHERE expires_at IS NOT NULL;

-- =====================================================
-- Multi-Year Projections Table (Pro/Premium feature)
-- =====================================================
CREATE TABLE projections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  calculation_id UUID NOT NULL REFERENCES calculations(id) ON DELETE CASCADE,

  -- Year data
  year INTEGER NOT NULL,

  -- Income
  gross_income DECIMAL(12,2) NOT NULL,
  vacancy_loss DECIMAL(12,2) NOT NULL,
  net_income DECIMAL(12,2) NOT NULL,

  -- Expenses
  property_tax DECIMAL(10,2) NOT NULL,
  insurance DECIMAL(10,2) NOT NULL,
  hoa DECIMAL(10,2) NOT NULL,
  maintenance DECIMAL(10,2) NOT NULL,
  property_management DECIMAL(10,2) NOT NULL,
  utilities DECIMAL(10,2) NOT NULL,
  other_expenses DECIMAL(10,2) NOT NULL,
  total_expenses DECIMAL(12,2) NOT NULL,

  -- Mortgage
  mortgage_payment DECIMAL(12,2) NOT NULL,
  principal_paid DECIMAL(12,2) NOT NULL,
  interest_paid DECIMAL(12,2) NOT NULL,

  -- Cash flow
  cash_flow DECIMAL(12,2) NOT NULL,
  cumulative_cash_flow DECIMAL(12,2) NOT NULL,

  -- Property value
  property_value DECIMAL(12,2) NOT NULL,
  loan_balance DECIMAL(12,2) NOT NULL,
  equity DECIMAL(12,2) NOT NULL,

  -- Returns
  cash_on_cash_return DECIMAL(6,3),
  equity_multiple DECIMAL(6,3),

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraint: one row per calculation per year
  UNIQUE(calculation_id, year)
);

-- Indexes for projections
CREATE INDEX idx_projections_calculation_id ON projections(calculation_id);
CREATE INDEX idx_projections_year ON projections(year);

-- =====================================================
-- Audit Log (for important actions)
-- =====================================================
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,

  -- Action details
  action TEXT NOT NULL, -- e.g., 'calculation_created', 'subscription_upgraded'
  entity_type TEXT, -- e.g., 'calculation', 'user'
  entity_id UUID,

  -- Additional context
  metadata JSONB,
  ip_address INET,
  user_agent TEXT,

  -- Timestamp
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for audit logs
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- =====================================================
-- Functions
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to tables
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
$$ LANGUAGE plpgsql;

-- Trigger to track calculation count
CREATE TRIGGER track_calculation_count
  AFTER INSERT ON calculations
  FOR EACH ROW
  EXECUTE FUNCTION increment_calculation_count();

-- =====================================================
-- Initial Data / Seed (optional)
-- =====================================================

-- Add any seed data here if needed
