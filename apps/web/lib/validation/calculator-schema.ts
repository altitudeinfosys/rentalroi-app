/**
 * Zod validation schemas for calculator wizard
 */

import { z } from 'zod';

/**
 * Property types enum
 */
export const propertyTypes = [
  'single_family',
  'multi_family',
  'condo',
  'townhouse',
  'commercial',
  'other',
] as const;

/**
 * Step 1: Property Details Schema
 */
export const step1Schema = z.object({
  propertyType: z.enum(propertyTypes),
  title: z.string().min(1, 'Title is required').max(100, 'Title is too long'),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z
    .string()
    .regex(/^\d{5}(-\d{4})?$/, 'Zip code must be 5 digits (e.g., 12345) or 9 digits (e.g., 12345-6789)')
    .optional()
    .or(z.literal('')),
  bedrooms: z.number().int().min(0).max(50).optional(),
  bathrooms: z.number().min(0).max(50).optional(),
  squareFeet: z.number().int().min(0).max(100000).optional(),
});

/**
 * Step 2: Purchase & Financing Schema
 */
export const step2Schema = z.object({
  purchasePrice: z
    .number()
    .min(1000, 'Purchase price must be at least $1,000')
    .max(100000000, 'Purchase price is too high'),
  downPaymentPercent: z
    .number()
    .min(0, 'Down payment cannot be negative')
    .max(100, 'Down payment cannot exceed 100%'),
  interestRate: z
    .number()
    .min(0.1, 'Interest rate must be at least 0.1%')
    .max(20, 'Interest rate cannot exceed 20%'),
  loanTermYears: z
    .number()
    .int()
    .min(1, 'Loan term must be at least 1 year')
    .max(50, 'Loan term cannot exceed 50 years'),
  closingCosts: z.number().min(0, 'Closing costs cannot be negative'),
  repairCosts: z.number().min(0, 'Repair costs cannot be negative'),
});

/**
 * Step 3: Income Schema
 */
export const step3Schema = z.object({
  monthlyRent: z
    .number()
    .min(1, 'Monthly rent must be at least $1')
    .max(1000000, 'Monthly rent is too high'),
  otherMonthlyIncome: z
    .number()
    .min(0, 'Other income cannot be negative')
    .max(1000000, 'Other income is too high'),
  vacancyRate: z
    .number()
    .min(0, 'Vacancy rate cannot be negative')
    .max(100, 'Vacancy rate cannot exceed 100%'),
  annualRentIncrease: z
    .number()
    .min(0, 'Rent increase cannot be negative')
    .max(50, 'Rent increase cannot exceed 50%'),
});

/**
 * Expense input mode type
 */
export const expenseModes = ['dollar', 'percent'] as const;
export type ExpenseMode = typeof expenseModes[number];

/**
 * Step 4: Expenses Schema
 */
export const step4Schema = z.object({
  // Property Tax - with toggle
  propertyTaxAnnual: z
    .number()
    .min(0, 'Property tax cannot be negative')
    .max(10000000, 'Property tax is too high'),
  propertyTaxPercent: z
    .number()
    .min(0, 'Property tax % cannot be negative')
    .max(10, 'Property tax % is too high')
    .optional(),
  propertyTaxMode: z.enum(expenseModes).optional(),

  // Insurance - with toggle
  insuranceAnnual: z
    .number()
    .min(0, 'Insurance cannot be negative')
    .max(1000000, 'Insurance is too high'),
  insurancePercent: z
    .number()
    .min(0, 'Insurance % cannot be negative')
    .max(5, 'Insurance % is too high')
    .optional(),
  insuranceMode: z.enum(expenseModes).optional(),

  // Maintenance - with toggle
  maintenanceMonthly: z
    .number()
    .min(0, 'Maintenance cannot be negative')
    .max(100000, 'Maintenance is too high'),
  maintenancePercent: z
    .number()
    .min(0, 'Maintenance % cannot be negative')
    .max(5, 'Maintenance % is too high')
    .optional(),
  maintenanceMode: z.enum(expenseModes).optional(),

  // Property Management - with toggle (reverse: default is %)
  propertyManagementPercent: z
    .number()
    .min(0, 'Management fee cannot be negative')
    .max(50, 'Management fee cannot exceed 50%'),
  propertyManagementMonthly: z
    .number()
    .min(0, 'Management fee cannot be negative')
    .max(100000, 'Management fee is too high')
    .optional(),
  propertyManagementMode: z.enum(expenseModes).optional(),

  // Fixed expenses (no toggle needed)
  hoaMonthly: z
    .number()
    .min(0, 'HOA fees cannot be negative')
    .max(100000, 'HOA fees are too high'),
  utilitiesMonthly: z
    .number()
    .min(0, 'Utilities cannot be negative')
    .max(100000, 'Utilities are too high'),
  otherExpensesMonthly: z
    .number()
    .min(0, 'Other expenses cannot be negative')
    .max(100000, 'Other expenses are too high'),

  // Multi-year assumptions
  annualExpenseIncrease: z
    .number()
    .min(0, 'Expense increase cannot be negative')
    .max(50, 'Expense increase cannot exceed 50%'),
  holdingLength: z
    .number()
    .int()
    .min(1, 'Holding period must be at least 1 year')
    .max(50, 'Holding period cannot exceed 50 years'),
  annualAppreciationRate: z
    .number()
    .min(-50, 'Appreciation rate too low')
    .max(50, 'Appreciation rate cannot exceed 50%'),
  saleClosingCostsPercent: z
    .number()
    .min(0, 'Sale costs cannot be negative')
    .max(20, 'Sale costs cannot exceed 20%'),
});

/**
 * Complete calculator schema (all steps combined)
 */
export const calculatorSchema = step1Schema
  .merge(step2Schema)
  .merge(step3Schema)
  .merge(step4Schema);

/**
 * Type inference from schema
 */
export type CalculatorFormData = z.infer<typeof calculatorSchema>;
export type Step1FormData = z.infer<typeof step1Schema>;
export type Step2FormData = z.infer<typeof step2Schema>;
export type Step3FormData = z.infer<typeof step3Schema>;
export type Step4FormData = z.infer<typeof step4Schema>;

/**
 * Get fields for a specific step (for validation)
 */
export function getStepFields(step: number): Array<keyof CalculatorFormData> {
  switch (step) {
    case 1:
      return [
        'propertyType',
        'title',
        'address',
        'city',
        'state',
        'bedrooms',
        'bathrooms',
        'squareFeet',
      ];
    case 2:
      return [
        'purchasePrice',
        'downPaymentPercent',
        'interestRate',
        'loanTermYears',
        'closingCosts',
        'repairCosts',
      ];
    case 3:
      return [
        'monthlyRent',
        'otherMonthlyIncome',
        'vacancyRate',
        'annualRentIncrease',
      ];
    case 4:
      return [
        'propertyTaxAnnual',
        'insuranceAnnual',
        'hoaMonthly',
        'maintenanceMonthly',
        'propertyManagementPercent',
        'utilitiesMonthly',
        'otherExpensesMonthly',
        'annualExpenseIncrease',
        'holdingLength',
        'annualAppreciationRate',
        'saleClosingCostsPercent',
      ];
    default:
      return [];
  }
}

/**
 * Validation warnings for unusual values
 */
export function getValidationWarnings(
  data: Partial<CalculatorFormData>
): Record<string, string> {
  const warnings: Record<string, string> = {};

  if (data.interestRate && data.interestRate > 10) {
    warnings.interestRate =
      'Interest rate above 10% is unusual for residential properties';
  }

  if (data.vacancyRate && data.vacancyRate > 15) {
    warnings.vacancyRate = 'Vacancy rate above 15% is very high';
  }

  if (
    data.downPaymentPercent !== undefined &&
    data.downPaymentPercent < 10
  ) {
    warnings.downPaymentPercent =
      'Down payment below 10% may require PMI and higher rates';
  }

  if (data.propertyManagementPercent && data.propertyManagementPercent > 15) {
    warnings.propertyManagementPercent =
      'Management fee above 15% is unusually high';
  }

  return warnings;
}
