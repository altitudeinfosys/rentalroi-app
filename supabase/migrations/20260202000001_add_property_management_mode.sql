-- Migration: Add property management mode columns
-- This allows storing whether the user selected percentage or fixed dollar amount
-- for property management fees

-- Add property_management_mode column
ALTER TABLE calculations
ADD COLUMN IF NOT EXISTS property_management_mode VARCHAR(10) DEFAULT 'percent';

-- Add property_management_monthly column for fixed dollar amounts
ALTER TABLE calculations
ADD COLUMN IF NOT EXISTS property_management_monthly DECIMAL(10,2) DEFAULT 0;

-- Add comment for documentation
COMMENT ON COLUMN calculations.property_management_mode IS 'Mode for property management fee: percent or dollar';
COMMENT ON COLUMN calculations.property_management_monthly IS 'Fixed monthly property management fee when mode is dollar';
