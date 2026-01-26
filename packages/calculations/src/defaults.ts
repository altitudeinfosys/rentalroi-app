/**
 * Smart defaults for calculation inputs
 */

import type { CalculationInputs } from './types';

/**
 * Default values for all calculation inputs
 */
export const DEFAULT_VALUES: Partial<CalculationInputs> = {
  // Financing
  downPaymentPercent: 20,
  interestRate: 6.5,
  loanTermYears: 30,
  closingCosts: 0,
  repairCosts: 0,

  // Income
  otherMonthlyIncome: 0,
  vacancyRate: 5, // 5% typical for residential
  annualRentIncrease: 3, // Tied to inflation

  // Expenses
  hoaMonthly: 0,
  maintenanceMonthly: 0,
  propertyManagementPercent: 0, // User can enable if needed
  utilitiesMonthly: 0,
  otherExpensesMonthly: 0,
  annualExpenseIncrease: 2.5,

  // Multi-year
  holdingLength: 5,
  annualAppreciationRate: 3, // Historical average
  saleClosingCostsPercent: 6, // Typical realtor + closing costs
};

/**
 * Property-type specific defaults
 */
export const PROPERTY_TYPE_DEFAULTS: Record<
  CalculationInputs['propertyType'],
  Partial<CalculationInputs>
> = {
  single_family: {
    vacancyRate: 5,
    maintenanceMonthly: 0, // Will use 1% rule in UI
  },
  multi_family: {
    vacancyRate: 7,
    maintenanceMonthly: 0, // Will use 1.5% rule in UI
    propertyManagementPercent: 8,
  },
  condo: {
    vacancyRate: 6,
    maintenanceMonthly: 0, // Usually covered by HOA
  },
  townhouse: {
    vacancyRate: 5,
    maintenanceMonthly: 0,
  },
  commercial: {
    vacancyRate: 10,
    maintenanceMonthly: 0, // Will use 2% rule in UI
    propertyManagementPercent: 5,
  },
  other: {
    vacancyRate: 5,
    maintenanceMonthly: 0,
  },
};

/**
 * Get defaults for a specific property type
 */
export function getDefaultsForPropertyType(
  propertyType: CalculationInputs['propertyType']
): Partial<CalculationInputs> {
  return {
    ...DEFAULT_VALUES,
    ...PROPERTY_TYPE_DEFAULTS[propertyType],
  };
}
