/**
 * Validation warnings for unusual input values
 */

import type { ValidationWarning } from './types';

/**
 * Threshold configuration for validation warnings
 */
interface ValidationThreshold {
  field: string;
  low?: number;
  high?: number;
  message: string;
  severity?: 'warning' | 'info';
}

export const VALIDATION_THRESHOLDS: ValidationThreshold[] = [
  {
    field: 'interestRate',
    high: 10,
    message:
      'Interest rate above 10% is unusual for residential properties. Typical rates are 5-8%.',
    severity: 'warning',
  },
  {
    field: 'interestRate',
    low: 2,
    message:
      'Interest rate below 2% is unusually low. Verify this is accurate.',
    severity: 'info',
  },
  {
    field: 'vacancyRate',
    high: 15,
    message:
      'Vacancy rate above 15% is very high. Typical ranges are 5-10%.',
    severity: 'warning',
  },
  {
    field: 'downPaymentPercent',
    low: 10,
    message:
      'Down payment below 10% may require PMI and result in higher interest rates.',
    severity: 'warning',
  },
  {
    field: 'downPaymentPercent',
    high: 50,
    message:
      'Down payment above 50% is uncommon. Consider keeping more liquidity.',
    severity: 'info',
  },
  {
    field: 'propertyManagementPercent',
    high: 12,
    message:
      'Property management fee above 12% is high. Typical rates are 8-10%.',
    severity: 'warning',
  },
  {
    field: 'annualRentIncrease',
    high: 7,
    message:
      'Rent increase above 7% annually is aggressive. Historical average is 3-4%.',
    severity: 'warning',
  },
  {
    field: 'annualAppreciationRate',
    high: 6,
    message:
      'Appreciation above 6% annually is aggressive. Historical average is 3-4%.',
    severity: 'warning',
  },
  {
    field: 'saleClosingCostsPercent',
    low: 3,
    message:
      'Closing costs below 3% is optimistic. Typical costs are 6-8% including realtor fees.',
    severity: 'info',
  },
];

/**
 * Check if a value should trigger a validation warning
 */
export function checkValidationWarnings(
  field: string,
  value: number
): ValidationWarning | null {
  const threshold = VALIDATION_THRESHOLDS.find((t) => t.field === field);

  if (!threshold) {
    return null;
  }

  // Check high threshold
  if (threshold.high !== undefined && value > threshold.high) {
    return {
      field,
      value,
      threshold: threshold.high,
      message: threshold.message,
      severity: threshold.severity || 'warning',
    };
  }

  // Check low threshold
  if (threshold.low !== undefined && value < threshold.low) {
    return {
      field,
      value,
      threshold: threshold.low,
      message: threshold.message,
      severity: threshold.severity || 'warning',
    };
  }

  return null;
}

/**
 * Get all validation warnings for a set of inputs
 */
export function getAllValidationWarnings(
  inputs: Record<string, number>
): ValidationWarning[] {
  const warnings: ValidationWarning[] = [];

  for (const [field, value] of Object.entries(inputs)) {
    if (typeof value === 'number') {
      const warning = checkValidationWarnings(field, value);
      if (warning) {
        warnings.push(warning);
      }
    }
  }

  return warnings;
}
