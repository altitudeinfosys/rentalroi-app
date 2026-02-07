/**
 * Cash flow calculation tests
 *
 * Tests verify calculations match industry standards from:
 * - J.P. Morgan Real Estate Investment Analysis
 * - Wall Street Prep
 */

import { describe, it, expect } from 'vitest';
import {
  calculateNOI,
  calculateCashFlow,
  calculateAnnualCashFlow,
  calculateOperatingExpenses,
  isPositiveCashFlow,
} from '../cash-flow';

describe('calculateNOI', () => {
  it('calculates NOI correctly', () => {
    // $48,000 gross income - $12,000 expenses = $36,000 NOI
    const noi = calculateNOI(48000, 12000);
    expect(noi).toBe(36000);
  });

  it('excludes mortgage from NOI', () => {
    // NOI should be the same regardless of mortgage amount
    const noi1 = calculateNOI(48000, 12000);
    const noi2 = calculateNOI(48000, 12000); // Mortgage not included

    expect(noi1).toBe(noi2);
    expect(noi1).toBe(36000);
  });

  it('handles zero operating expenses', () => {
    const noi = calculateNOI(48000, 0);
    expect(noi).toBe(48000);
  });

  it('handles high operating expenses', () => {
    // Negative NOI is valid
    const noi = calculateNOI(30000, 40000);
    expect(noi).toBe(-10000);
  });

  it('rounds to cents', () => {
    const noi = calculateNOI(48123.456, 12567.891);
    expect(noi).toBe(Math.round((48123.456 - 12567.891) * 100) / 100);
  });
});

describe('calculateCashFlow', () => {
  it('includes vacancy in calculation', () => {
    // $4,000 rent, 5% vacancy, $1,000 expenses, $2,000 mortgage
    const result = calculateCashFlow(4000, 5, 1000, 2000);

    expect(result.grossIncome).toBe(4000);
    expect(result.vacancyLoss).toBe(200); // 5% of 4000
    expect(result.netIncome).toBe(3800); // 4000 - 200
    expect(result.totalExpenses).toBe(1000);
    expect(result.noi).toBe(2800); // 3800 - 1000
    expect(result.debtService).toBe(2000);
    expect(result.cashFlow).toBe(800); // 2800 - 2000
  });

  it('handles negative cash flow', () => {
    // High expenses + mortgage result in negative cash flow
    const result = calculateCashFlow(2000, 5, 1000, 2000);

    expect(result.netIncome).toBe(1900); // 2000 - 100
    expect(result.noi).toBe(900); // 1900 - 1000
    expect(result.cashFlow).toBe(-1100); // 900 - 2000
    expect(result.cashFlow).toBeLessThan(0);
  });

  it('handles zero vacancy', () => {
    const result = calculateCashFlow(3000, 0, 800, 1500);

    expect(result.vacancyLoss).toBe(0);
    expect(result.netIncome).toBe(3000);
    expect(result.cashFlow).toBe(700); // (3000 - 800) - 1500
  });

  it('handles high vacancy rate', () => {
    const result = calculateCashFlow(3000, 20, 500, 1000);

    expect(result.vacancyLoss).toBe(600); // 20% of 3000
    expect(result.netIncome).toBe(2400);
    expect(result.noi).toBe(1900); // 2400 - 500
    expect(result.cashFlow).toBe(900); // 1900 - 1000
  });

  it('calculates NOI correctly within cash flow', () => {
    const result = calculateCashFlow(4000, 5, 1000, 2000);

    // NOI should be net income minus operating expenses
    const expectedNOI = result.netIncome - result.totalExpenses;
    expect(result.noi).toBe(expectedNOI);

    // Cash flow should be NOI minus debt service
    const expectedCashFlow = result.noi - result.debtService;
    expect(result.cashFlow).toBe(expectedCashFlow);
  });

  it('matches breakdown formula', () => {
    const rent = 3500;
    const vacancy = 5;
    const expenses = 950;
    const mortgage = 2398;

    const result = calculateCashFlow(rent, vacancy, expenses, mortgage);

    // Manual calculation
    const expectedGross = rent;
    const expectedVacancy = (rent * vacancy) / 100;
    const expectedNet = expectedGross - expectedVacancy;
    const expectedNOI = expectedNet - expenses;
    const expectedCashFlow = expectedNOI - mortgage;

    expect(result.grossIncome).toBe(expectedGross);
    expect(result.vacancyLoss).toBeCloseTo(expectedVacancy, 2);
    expect(result.netIncome).toBeCloseTo(expectedNet, 2);
    expect(result.noi).toBeCloseTo(expectedNOI, 2);
    expect(result.cashFlow).toBeCloseTo(expectedCashFlow, 2);
  });

  it('handles zero mortgage payment', () => {
    const result = calculateCashFlow(3000, 5, 800, 0);

    expect(result.debtService).toBe(0);
    // Cash flow equals NOI when no mortgage
    expect(result.cashFlow).toBe(result.noi);
  });

  it('rounds all values to cents', () => {
    const result = calculateCashFlow(3333.33, 5.5, 888.88, 1777.77);

    // All values should be rounded to 2 decimals
    expect(result.grossIncome).toBe(Math.round(result.grossIncome * 100) / 100);
    expect(result.vacancyLoss).toBe(Math.round(result.vacancyLoss * 100) / 100);
    expect(result.cashFlow).toBe(Math.round(result.cashFlow * 100) / 100);
  });
});

describe('calculateAnnualCashFlow', () => {
  it('multiplies monthly cash flow by 12', () => {
    const annual = calculateAnnualCashFlow(3500, 5, 950, 2398);

    // Calculate expected
    const monthly = calculateCashFlow(3500, 5, 950, 2398);
    const expected = monthly.cashFlow * 12;

    expect(annual).toBeCloseTo(expected, 2);
  });

  it('handles negative annual cash flow', () => {
    const annual = calculateAnnualCashFlow(2000, 10, 1000, 2000);

    expect(annual).toBeLessThan(0);
  });

  it('returns zero for break-even property', () => {
    // Rent exactly covers expenses + mortgage after vacancy
    const annual = calculateAnnualCashFlow(3000, 0, 1000, 2000);

    expect(annual).toBe(0);
  });
});

describe('calculateOperatingExpenses', () => {
  it('sums all expense components correctly', () => {
    const expenses = calculateOperatingExpenses(
      4800, // Property tax (annual)
      1200, // Insurance (annual)
      0, // HOA (monthly)
      250, // Maintenance (monthly)
      8, // Management (%)
      3500, // Monthly rent
      0, // Utilities (monthly)
      0 // Other (monthly)
    );

    // Expected breakdown:
    // Property tax: $4,800 / 12 = $400
    // Insurance: $1,200 / 12 = $100
    // HOA: $0
    // Maintenance: $250
    // Management: $3,500 × 8% = $280
    // Utilities: $0
    // Other: $0
    // Total: $1,030

    expect(expenses).toBe(1030);
  });

  it('converts annual expenses to monthly', () => {
    const expenses = calculateOperatingExpenses(
      6000, // $500/month
      2400, // $200/month
      0,
      0,
      0,
      0,
      0,
      0
    );

    expect(expenses).toBe(700); // $500 + $200
  });

  it('calculates management fee as percentage of rent', () => {
    const expenses = calculateOperatingExpenses(
      0,
      0,
      0,
      0,
      10, // 10% management fee
      3000, // $3,000 rent
      0,
      0
    );

    expect(expenses).toBe(300); // 10% of $3,000
  });

  it('includes all expense types', () => {
    const expenses = calculateOperatingExpenses(
      3600, // $300/mo tax
      1200, // $100/mo insurance
      200, // $200/mo HOA
      150, // $150/mo maintenance
      8, // 8% management
      2500, // $2,500 rent (8% = $200)
      100, // $100/mo utilities
      50 // $50/mo other
    );

    // Total: $300 + $100 + $200 + $150 + $200 + $100 + $50 = $1,100
    expect(expenses).toBe(1100);
  });

  it('handles zero for all optional expenses', () => {
    const expenses = calculateOperatingExpenses(
      4800, // Only required: property tax
      1200, // Only required: insurance
      0,
      0,
      0,
      0,
      0,
      0
    );

    expect(expenses).toBe(500); // ($4800 + $1200) / 12
  });

  it('rounds to cents', () => {
    const expenses = calculateOperatingExpenses(
      4567.89, // Odd annual amount
      1234.56,
      123.45,
      67.89,
      8.5,
      3333.33,
      0,
      0
    );

    expect(expenses).toBe(Math.round(expenses * 100) / 100);
  });
});

describe('isPositiveCashFlow', () => {
  it('returns true for positive cash flow', () => {
    expect(isPositiveCashFlow(100)).toBe(true);
    expect(isPositiveCashFlow(0.01)).toBe(true);
    expect(isPositiveCashFlow(1000)).toBe(true);
  });

  it('returns false for negative cash flow', () => {
    expect(isPositiveCashFlow(-100)).toBe(false);
    expect(isPositiveCashFlow(-0.01)).toBe(false);
    expect(isPositiveCashFlow(-1000)).toBe(false);
  });

  it('returns false for zero (break-even)', () => {
    expect(isPositiveCashFlow(0)).toBe(false);
  });
});
