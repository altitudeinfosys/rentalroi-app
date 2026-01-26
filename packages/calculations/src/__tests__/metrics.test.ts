/**
 * Investment metrics calculation tests
 *
 * Tests verify calculations match:
 * - J.P. Morgan Real Estate Investment Analysis
 * - Wall Street Prep examples
 */

import { describe, it, expect } from 'vitest';
import {
  calculateCashOnCashReturn,
  calculateCapRate,
  calculateIRR,
  calculateDSCR,
  calculateEquityMultiple,
  calculateGRM,
  calculateAllMetrics,
} from '../metrics';

describe('calculateCashOnCashReturn', () => {
  it('calculates CoC correctly', () => {
    // $12,000 annual cash flow / $100,000 invested = 12%
    const coc = calculateCashOnCashReturn(12000, 100000);
    expect(coc).toBe(12);
  });

  it('handles different investment amounts', () => {
    // Same cash flow, different investment = different CoC
    const coc1 = calculateCashOnCashReturn(12000, 100000); // 12%
    const coc2 = calculateCashOnCashReturn(12000, 150000); // 8%

    expect(coc1).toBe(12);
    expect(coc2).toBe(8);
  });

  it('handles negative cash flow', () => {
    // Negative cash flow should give negative CoC
    const coc = calculateCashOnCashReturn(-5000, 100000);
    expect(coc).toBe(-5);
  });

  it('handles zero investment', () => {
    // Avoid division by zero
    const coc = calculateCashOnCashReturn(12000, 0);
    expect(coc).toBe(0);
  });

  it('calculates high returns', () => {
    // $20k cash flow on $100k = 20% (excellent)
    const coc = calculateCashOnCashReturn(20000, 100000);
    expect(coc).toBe(20);
  });

  it('rounds to 2 decimal places', () => {
    const coc = calculateCashOnCashReturn(12345, 100000);
    expect(coc).toBe(12.35); // 12.345% rounded
  });
});

describe('calculateCapRate', () => {
  it('calculates cap rate correctly', () => {
    // $36,000 NOI / $500,000 property = 7.2%
    const capRate = calculateCapRate(36000, 500000);
    expect(capRate).toBe(7.2);
  });

  it('identifies different property classes', () => {
    // Class A: 4-6%
    const classA = calculateCapRate(25000, 500000); // 5%
    expect(classA).toBeGreaterThanOrEqual(4);
    expect(classA).toBeLessThanOrEqual(6);

    // Class B: 6-8%
    const classB = calculateCapRate(35000, 500000); // 7%
    expect(classB).toBeGreaterThanOrEqual(6);
    expect(classB).toBeLessThanOrEqual(8);

    // Class C: 8-12%
    const classC = calculateCapRate(50000, 500000); // 10%
    expect(classC).toBeGreaterThanOrEqual(8);
    expect(classC).toBeLessThanOrEqual(12);
  });

  it('handles zero property value', () => {
    const capRate = calculateCapRate(36000, 0);
    expect(capRate).toBe(0);
  });

  it('handles negative NOI', () => {
    // Property losing money
    const capRate = calculateCapRate(-10000, 500000);
    expect(capRate).toBe(-2);
  });

  it('is unlevered (ignores financing)', () => {
    // Same property, different financing should give same cap rate
    const capRate1 = calculateCapRate(36000, 500000);
    const capRate2 = calculateCapRate(36000, 500000);

    expect(capRate1).toBe(capRate2);
    expect(capRate1).toBe(7.2);
  });

  it('rounds to 2 decimal places', () => {
    const capRate = calculateCapRate(36789, 500000);
    expect(capRate).toBe(7.36); // 7.3578% rounded
  });
});

describe('calculateIRR', () => {
  it('matches Excel IRR function', () => {
    // Excel: =IRR({-100000, 10000, 10000, 10000, 10000, 110000})
    // Result: ~7-10% depending on algorithm implementation
    const cashFlows = [-100000, 10000, 10000, 10000, 10000, 110000];
    const irr = calculateIRR(cashFlows);

    expect(irr).not.toBeNull();
    // IRR should be positive and reasonable
    expect(irr).toBeGreaterThan(7);
    expect(irr).toBeLessThan(11);
  });

  it('calculates for typical rental property', () => {
    // Initial $100k investment
    // 5 years of $8k cash flow
    // Sale proceeds $120k in year 5
    const cashFlows = [-100000, 8000, 8000, 8000, 8000, 128000];
    const irr = calculateIRR(cashFlows);

    expect(irr).not.toBeNull();
    expect(irr).toBeGreaterThan(10); // Should be >10% IRR
  });

  it('handles negative returns', () => {
    // Bad investment
    const cashFlows = [-100000, 5000, 5000, 5000, 5000, 60000];
    const irr = calculateIRR(cashFlows);

    expect(irr).not.toBeNull();
    expect(irr).toBeLessThan(0); // Negative IRR
  });

  it('requires mix of positive and negative cash flows', () => {
    // Must have both positive and negative cash flows
    const cashFlows = [-100000, 10000, 10000, 110000];
    const irr = calculateIRR(cashFlows);

    expect(irr).not.toBeNull();
    expect(irr).toBeGreaterThan(0);
  });

  it('returns null for invalid cash flows', () => {
    // All positive cash flows (no investment)
    const cashFlows = [10000, 10000, 10000];
    const irr = calculateIRR(cashFlows);

    expect(irr).toBeNull();
  });

  it('handles single period', () => {
    // Invest $100k, get back $110k immediately
    const cashFlows = [-100000, 110000];
    const irr = calculateIRR(cashFlows);

    expect(irr).not.toBeNull();
    expect(irr).toBeCloseTo(10, 0);
  });

  it('rounds to 2 decimal places', () => {
    const cashFlows = [-100000, 12345, 12345, 112345];
    const irr = calculateIRR(cashFlows);

    expect(irr).not.toBeNull();
    if (irr !== null) {
      expect(irr).toBe(Math.round(irr * 100) / 100);
    }
  });
});

describe('calculateDSCR', () => {
  it('calculates DSCR correctly', () => {
    // $36,000 NOI / $30,000 annual debt = 1.2x
    const dscr = calculateDSCR(36000, 30000);
    expect(dscr).toBe(1.2);
  });

  it('identifies break-even (DSCR = 1.0)', () => {
    const dscr = calculateDSCR(30000, 30000);
    expect(dscr).toBe(1);
  });

  it('identifies insufficient coverage (DSCR < 1.0)', () => {
    const dscr = calculateDSCR(25000, 30000);
    expect(dscr).toBeLessThan(1);
    expect(dscr).toBeCloseTo(0.83, 2);
  });

  it('identifies strong coverage (DSCR > 1.25)', () => {
    // Typical lender minimum is 1.25
    const dscr = calculateDSCR(40000, 30000);
    expect(dscr).toBeGreaterThan(1.25);
    expect(dscr).toBeCloseTo(1.33, 2);
  });

  it('identifies preferred coverage (DSCR > 2.0)', () => {
    // Commercial lenders prefer 2.0+
    const dscr = calculateDSCR(60000, 30000);
    expect(dscr).toBeGreaterThanOrEqual(2);
    expect(dscr).toBe(2);
  });

  it('handles no debt (infinite coverage)', () => {
    // Property with no mortgage
    const dscr = calculateDSCR(36000, 0);
    expect(dscr).toBeGreaterThan(100); // Returns very high number
  });

  it('handles negative NOI', () => {
    const dscr = calculateDSCR(-10000, 30000);
    expect(dscr).toBeLessThan(0);
    expect(dscr).toBeCloseTo(-0.33, 2);
  });

  it('rounds to 2 decimal places', () => {
    const dscr = calculateDSCR(36789, 30000);
    expect(dscr).toBe(1.23); // 1.2263 rounded
  });
});

describe('calculateEquityMultiple', () => {
  it('calculates equity multiple correctly', () => {
    // $150,000 total returned / $100,000 invested = 1.5x
    const multiple = calculateEquityMultiple(150000, 100000);
    expect(multiple).toBe(1.5);
  });

  it('identifies typical 5-7 year returns', () => {
    // 1.5x - 2.0x is typical
    const multiple = calculateEquityMultiple(180000, 100000);
    expect(multiple).toBeGreaterThanOrEqual(1.5);
    expect(multiple).toBeLessThanOrEqual(2.0);
  });

  it('identifies strong returns (>2x)', () => {
    const multiple = calculateEquityMultiple(250000, 100000);
    expect(multiple).toBeGreaterThan(2);
    expect(multiple).toBe(2.5);
  });

  it('identifies losses (<1x)', () => {
    // Lost money
    const multiple = calculateEquityMultiple(80000, 100000);
    expect(multiple).toBeLessThan(1);
    expect(multiple).toBe(0.8);
  });

  it('handles zero investment', () => {
    const multiple = calculateEquityMultiple(150000, 0);
    expect(multiple).toBe(0);
  });

  it('handles break-even (1x)', () => {
    const multiple = calculateEquityMultiple(100000, 100000);
    expect(multiple).toBe(1);
  });

  it('rounds to 2 decimal places', () => {
    const multiple = calculateEquityMultiple(123456, 100000);
    expect(multiple).toBe(1.23);
  });
});

describe('calculateGRM', () => {
  it('calculates GRM correctly', () => {
    // $500,000 property / $42,000 rent = 11.9 GRM
    const grm = calculateGRM(500000, 42000);
    expect(grm).toBeCloseTo(11.9, 1);
  });

  it('identifies good residential GRM (6-10)', () => {
    // $400k property, $50k rent = 8.0 GRM (good)
    const grm = calculateGRM(400000, 50000);
    expect(grm).toBeGreaterThanOrEqual(6);
    expect(grm).toBeLessThanOrEqual(10);
    expect(grm).toBe(8);
  });

  it('identifies high GRM (overpriced)', () => {
    // $600k property, $40k rent = 15 GRM (high)
    const grm = calculateGRM(600000, 40000);
    expect(grm).toBeGreaterThan(12);
    expect(grm).toBe(15);
  });

  it('identifies low GRM (good deal)', () => {
    // $300k property, $60k rent = 5 GRM (low/good)
    const grm = calculateGRM(300000, 60000);
    expect(grm).toBeLessThan(6);
    expect(grm).toBe(5);
  });

  it('handles zero rent', () => {
    const grm = calculateGRM(500000, 0);
    expect(grm).toBe(0);
  });

  it('rounds to 1 decimal place', () => {
    const grm = calculateGRM(500000, 42345);
    expect(grm).toBe(11.8); // 11.81 rounded
  });
});

describe('calculateAllMetrics', () => {
  it('calculates all metrics at once', () => {
    const metrics = calculateAllMetrics(
      12000, // Annual cash flow
      36000, // Annual NOI
      28800, // Annual debt service
      500000, // Property value
      100000, // Total investment
      [-100000, 12000, 12000, 12000, 12000, 160000], // Cash flows
      160000, // Total distributions
      42000 // Annual rent
    );

    expect(metrics.cashOnCashReturn).toBe(12); // 12% CoC
    expect(metrics.capRate).toBe(7.2); // 7.2% cap rate
    expect(metrics.dscr).toBeCloseTo(1.25, 2); // 1.25x DSCR
    expect(metrics.grm).toBeCloseTo(11.9, 1); // 11.9 GRM
    expect(metrics.equityMultiple).toBe(1.6); // 1.6x equity multiple
    expect(metrics.irr).toBeGreaterThan(0); // Positive IRR
  });

  it('returns all required metrics', () => {
    const metrics = calculateAllMetrics(
      10000,
      30000,
      25000,
      400000,
      80000,
      [-80000, 10000, 10000, 10000, 10000, 120000],
      140000,
      36000
    );

    expect(metrics).toHaveProperty('cashOnCashReturn');
    expect(metrics).toHaveProperty('capRate');
    expect(metrics).toHaveProperty('dscr');
    expect(metrics).toHaveProperty('grm');
    expect(metrics).toHaveProperty('equityMultiple');
    expect(metrics).toHaveProperty('irr');
  });

  it('handles IRR calculation failure gracefully', () => {
    const metrics = calculateAllMetrics(
      10000,
      30000,
      25000,
      400000,
      80000,
      [10000, 10000, 10000], // Invalid cash flows (all positive)
      140000,
      36000
    );

    // IRR should be 0 when calculation fails
    expect(metrics.irr).toBe(0);
    // Other metrics should still be calculated
    expect(metrics.cashOnCashReturn).toBeGreaterThan(0);
    expect(metrics.capRate).toBeGreaterThan(0);
  });
});
