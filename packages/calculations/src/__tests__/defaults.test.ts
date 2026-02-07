/**
 * Defaults configuration tests
 *
 * Tests verify default values are reasonable for real estate calculations
 */

import { describe, it, expect } from 'vitest';
import {
  DEFAULT_VALUES,
  PROPERTY_TYPE_DEFAULTS,
  getDefaultsForPropertyType,
} from '../defaults';

describe('DEFAULT_VALUES', () => {
  describe('Financing defaults', () => {
    it('has reasonable down payment default (20%)', () => {
      expect(DEFAULT_VALUES.downPaymentPercent).toBe(20);
    });

    it('has current market interest rate', () => {
      // 2024-2025 rates typically 6-8%
      expect(DEFAULT_VALUES.interestRate).toBeGreaterThanOrEqual(5);
      expect(DEFAULT_VALUES.interestRate).toBeLessThanOrEqual(9);
    });

    it('has standard 30-year loan term', () => {
      expect(DEFAULT_VALUES.loanTermYears).toBe(30);
    });

    it('defaults closing and repair costs to 0', () => {
      expect(DEFAULT_VALUES.closingCosts).toBe(0);
      expect(DEFAULT_VALUES.repairCosts).toBe(0);
    });
  });

  describe('Income defaults', () => {
    it('has typical vacancy rate (5%)', () => {
      expect(DEFAULT_VALUES.vacancyRate).toBe(5);
    });

    it('has inflation-matching rent increase (3%)', () => {
      expect(DEFAULT_VALUES.annualRentIncrease).toBe(3);
    });

    it('defaults other income to 0', () => {
      expect(DEFAULT_VALUES.otherMonthlyIncome).toBe(0);
    });
  });

  describe('Expense defaults', () => {
    it('has standard property tax rate (~1.2%)', () => {
      expect(DEFAULT_VALUES.propertyTaxPercent).toBeGreaterThanOrEqual(1);
      expect(DEFAULT_VALUES.propertyTaxPercent).toBeLessThanOrEqual(2);
    });

    it('has standard insurance rate (~0.5%)', () => {
      expect(DEFAULT_VALUES.insurancePercent).toBeGreaterThanOrEqual(0.3);
      expect(DEFAULT_VALUES.insurancePercent).toBeLessThanOrEqual(1);
    });

    it('defaults optional expenses to 0', () => {
      expect(DEFAULT_VALUES.hoaMonthly).toBe(0);
      expect(DEFAULT_VALUES.utilitiesMonthly).toBe(0);
      expect(DEFAULT_VALUES.otherExpensesMonthly).toBe(0);
    });

    it('has reasonable expense increase (2.5%)', () => {
      expect(DEFAULT_VALUES.annualExpenseIncrease).toBe(2.5);
    });
  });

  describe('Multi-year defaults', () => {
    it('has typical holding period (5 years)', () => {
      expect(DEFAULT_VALUES.holdingLength).toBe(5);
    });

    it('has historical appreciation rate (3%)', () => {
      expect(DEFAULT_VALUES.annualAppreciationRate).toBe(3);
    });

    it('has standard selling costs (6%)', () => {
      expect(DEFAULT_VALUES.saleClosingCostsPercent).toBe(6);
    });
  });
});

describe('PROPERTY_TYPE_DEFAULTS', () => {
  it('defines defaults for all property types', () => {
    expect(PROPERTY_TYPE_DEFAULTS).toHaveProperty('single_family');
    expect(PROPERTY_TYPE_DEFAULTS).toHaveProperty('multi_family');
    expect(PROPERTY_TYPE_DEFAULTS).toHaveProperty('condo');
    expect(PROPERTY_TYPE_DEFAULTS).toHaveProperty('townhouse');
    expect(PROPERTY_TYPE_DEFAULTS).toHaveProperty('commercial');
    expect(PROPERTY_TYPE_DEFAULTS).toHaveProperty('other');
  });

  describe('single_family defaults', () => {
    it('has 5% vacancy rate', () => {
      expect(PROPERTY_TYPE_DEFAULTS.single_family.vacancyRate).toBe(5);
    });
  });

  describe('multi_family defaults', () => {
    it('has higher vacancy rate (7%)', () => {
      expect(PROPERTY_TYPE_DEFAULTS.multi_family.vacancyRate).toBe(7);
    });

    it('includes property management fee', () => {
      expect(PROPERTY_TYPE_DEFAULTS.multi_family.propertyManagementPercent).toBe(8);
    });
  });

  describe('condo defaults', () => {
    it('has 6% vacancy rate', () => {
      expect(PROPERTY_TYPE_DEFAULTS.condo.vacancyRate).toBe(6);
    });
  });

  describe('commercial defaults', () => {
    it('has higher vacancy rate (10%)', () => {
      expect(PROPERTY_TYPE_DEFAULTS.commercial.vacancyRate).toBe(10);
    });

    it('includes lower property management fee (5%)', () => {
      expect(PROPERTY_TYPE_DEFAULTS.commercial.propertyManagementPercent).toBe(5);
    });
  });
});

describe('getDefaultsForPropertyType', () => {
  it('merges base defaults with property type defaults', () => {
    const defaults = getDefaultsForPropertyType('multi_family');

    // Should have base defaults
    expect(defaults.downPaymentPercent).toBe(20);
    expect(defaults.interestRate).toBe(6.5);
    expect(defaults.loanTermYears).toBe(30);

    // Should have property type overrides
    expect(defaults.vacancyRate).toBe(7);
    expect(defaults.propertyManagementPercent).toBe(8);
  });

  it('returns base defaults for single_family', () => {
    const defaults = getDefaultsForPropertyType('single_family');

    expect(defaults.vacancyRate).toBe(5);
    expect(defaults.downPaymentPercent).toBe(20);
  });

  it('returns higher vacancy for commercial', () => {
    const defaults = getDefaultsForPropertyType('commercial');

    expect(defaults.vacancyRate).toBe(10);
  });

  it('works for all property types', () => {
    const propertyTypes = [
      'single_family',
      'multi_family',
      'condo',
      'townhouse',
      'commercial',
      'other',
    ] as const;

    propertyTypes.forEach((type) => {
      const defaults = getDefaultsForPropertyType(type);
      expect(defaults).toBeDefined();
      expect(defaults.downPaymentPercent).toBeDefined();
    });
  });
});
