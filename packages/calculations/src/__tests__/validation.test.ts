/**
 * Validation warning tests
 *
 * Tests verify warnings trigger for unusual/risky input values
 */

import { describe, it, expect } from 'vitest';
import {
  VALIDATION_THRESHOLDS,
  checkValidationWarnings,
  getAllValidationWarnings,
} from '../validation';

describe('VALIDATION_THRESHOLDS', () => {
  it('defines thresholds for key fields', () => {
    const fields = VALIDATION_THRESHOLDS.map((t) => t.field);

    expect(fields).toContain('interestRate');
    expect(fields).toContain('vacancyRate');
    expect(fields).toContain('downPaymentPercent');
    expect(fields).toContain('propertyManagementPercent');
    expect(fields).toContain('annualRentIncrease');
    expect(fields).toContain('annualAppreciationRate');
    expect(fields).toContain('saleClosingCostsPercent');
  });

  it('has message for each threshold', () => {
    VALIDATION_THRESHOLDS.forEach((threshold) => {
      expect(threshold.message).toBeDefined();
      expect(threshold.message.length).toBeGreaterThan(10);
    });
  });
});

describe('checkValidationWarnings', () => {
  describe('interest rate warnings', () => {
    it('warns for high interest rate (>10%)', () => {
      const warning = checkValidationWarnings('interestRate', 12);

      expect(warning).not.toBeNull();
      expect(warning?.field).toBe('interestRate');
      expect(warning?.value).toBe(12);
      expect(warning?.severity).toBe('warning');
    });

    it('no warning for normal interest rate (5-8%)', () => {
      expect(checkValidationWarnings('interestRate', 6)).toBeNull();
      expect(checkValidationWarnings('interestRate', 7.5)).toBeNull();
    });

    it('no warning for boundary value (10%)', () => {
      // At threshold, no warning
      expect(checkValidationWarnings('interestRate', 10)).toBeNull();
    });
  });

  describe('vacancy rate warnings', () => {
    it('warns for high vacancy rate (>15%)', () => {
      const warning = checkValidationWarnings('vacancyRate', 20);

      expect(warning).not.toBeNull();
      expect(warning?.field).toBe('vacancyRate');
      expect(warning?.severity).toBe('warning');
    });

    it('no warning for normal vacancy rate (5-10%)', () => {
      expect(checkValidationWarnings('vacancyRate', 5)).toBeNull();
      expect(checkValidationWarnings('vacancyRate', 10)).toBeNull();
    });
  });

  describe('down payment warnings', () => {
    it('warns for low down payment (<10%)', () => {
      const warning = checkValidationWarnings('downPaymentPercent', 5);

      expect(warning).not.toBeNull();
      expect(warning?.field).toBe('downPaymentPercent');
      expect(warning?.message).toContain('PMI');
    });

    it('no warning for standard down payment (20%)', () => {
      expect(checkValidationWarnings('downPaymentPercent', 20)).toBeNull();
    });

    it('no warning for high down payment (50%)', () => {
      // Note: high down payment threshold may trigger info, but 50% is at boundary
      expect(checkValidationWarnings('downPaymentPercent', 50)).toBeNull();
    });
  });

  describe('property management warnings', () => {
    it('warns for high management fee (>12%)', () => {
      const warning = checkValidationWarnings('propertyManagementPercent', 15);

      expect(warning).not.toBeNull();
      expect(warning?.field).toBe('propertyManagementPercent');
    });

    it('no warning for normal fee (8-10%)', () => {
      expect(checkValidationWarnings('propertyManagementPercent', 8)).toBeNull();
      expect(checkValidationWarnings('propertyManagementPercent', 10)).toBeNull();
    });
  });

  describe('rent increase warnings', () => {
    it('warns for aggressive rent increase (>7%)', () => {
      const warning = checkValidationWarnings('annualRentIncrease', 10);

      expect(warning).not.toBeNull();
      expect(warning?.message).toContain('aggressive');
    });

    it('no warning for normal increase (3-4%)', () => {
      expect(checkValidationWarnings('annualRentIncrease', 3)).toBeNull();
      expect(checkValidationWarnings('annualRentIncrease', 5)).toBeNull();
    });
  });

  describe('appreciation rate warnings', () => {
    it('warns for aggressive appreciation (>6%)', () => {
      const warning = checkValidationWarnings('annualAppreciationRate', 8);

      expect(warning).not.toBeNull();
      expect(warning?.message).toContain('Historical average');
    });

    it('no warning for conservative appreciation (3%)', () => {
      expect(checkValidationWarnings('annualAppreciationRate', 3)).toBeNull();
    });
  });

  describe('closing costs warnings', () => {
    it('info for low closing costs (<3%)', () => {
      const warning = checkValidationWarnings('saleClosingCostsPercent', 2);

      expect(warning).not.toBeNull();
      expect(warning?.severity).toBe('info');
      expect(warning?.message).toContain('optimistic');
    });

    it('no warning for standard costs (6%)', () => {
      expect(checkValidationWarnings('saleClosingCostsPercent', 6)).toBeNull();
    });
  });

  describe('unknown fields', () => {
    it('returns null for unknown field', () => {
      expect(checkValidationWarnings('unknownField', 999)).toBeNull();
    });
  });
});

describe('getAllValidationWarnings', () => {
  it('returns empty array for normal inputs', () => {
    const inputs = {
      interestRate: 6.5,
      vacancyRate: 5,
      downPaymentPercent: 20,
      propertyManagementPercent: 8,
      annualRentIncrease: 3,
      annualAppreciationRate: 3,
      saleClosingCostsPercent: 6,
    };

    const warnings = getAllValidationWarnings(inputs);
    expect(warnings).toHaveLength(0);
  });

  it('returns multiple warnings for risky inputs', () => {
    const inputs = {
      interestRate: 15, // High
      vacancyRate: 25, // High
      downPaymentPercent: 5, // Low
    };

    const warnings = getAllValidationWarnings(inputs);
    expect(warnings.length).toBeGreaterThanOrEqual(3);
  });

  it('ignores non-numeric values', () => {
    const inputs = {
      interestRate: 6.5,
      propertyType: 'single_family', // Non-numeric, should be ignored
    };

    const warnings = getAllValidationWarnings(inputs as Record<string, number>);
    expect(warnings).toHaveLength(0);
  });

  it('returns warnings with correct structure', () => {
    const inputs = {
      interestRate: 12, // High - should trigger warning
    };

    const warnings = getAllValidationWarnings(inputs);
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toHaveProperty('field');
    expect(warnings[0]).toHaveProperty('value');
    expect(warnings[0]).toHaveProperty('threshold');
    expect(warnings[0]).toHaveProperty('message');
    expect(warnings[0]).toHaveProperty('severity');
  });

  it('returns warnings for multiple problematic inputs', () => {
    const inputs = {
      interestRate: 15, // High - warning
      vacancyRate: 25, // High - warning
    };

    const warnings = getAllValidationWarnings(inputs);

    expect(warnings.length).toBe(2);
    expect(warnings.every((w) => w.severity === 'warning')).toBe(true);
  });
});
