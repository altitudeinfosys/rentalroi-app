-- Add missing columns to calculations table
-- These fields exist in the form but were not in the initial schema

-- Add property_type to calculations (form has it, allows standalone calculations without a property)
ALTER TABLE calculations
ADD COLUMN IF NOT EXISTS property_type TEXT;

-- Add annual_expense_increase (form has it for projections)
ALTER TABLE calculations
ADD COLUMN IF NOT EXISTS annual_expense_increase DECIMAL(5,2) DEFAULT 2.5;

-- Add property detail fields to calculations (denormalized for easier queries)
-- These allow saving calculations without requiring a separate properties record
ALTER TABLE calculations
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS state TEXT,
ADD COLUMN IF NOT EXISTS zip_code TEXT,
ADD COLUMN IF NOT EXISTS bedrooms INTEGER,
ADD COLUMN IF NOT EXISTS bathrooms DECIMAL(3,1),
ADD COLUMN IF NOT EXISTS square_feet INTEGER;

-- Add index for property_type filtering
CREATE INDEX IF NOT EXISTS idx_calculations_property_type ON calculations(property_type);

-- Add index for city filtering (useful for market analysis)
CREATE INDEX IF NOT EXISTS idx_calculations_city ON calculations(city);
