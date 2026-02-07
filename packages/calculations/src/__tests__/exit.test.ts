/**
 * Sale/exit calculation tests
 *
 * Tests verify calculations for property sale proceeds and total investment returns
 */

import { describe, it, expect } from 'vitest';
import { calculateSaleProceeds, calculateTotalReturn } from '../exit';

describe('calculateSaleProceeds', () => {
  it('calculates net proceeds correctly', () => {
    // Sell $600k property with 6% costs and $300k loan balance
    // Selling costs: $36k (6% of $600k)
    // Net proceeds: $600k - $36k - $300k = $264k
    const proceeds = calculateSaleProceeds(600000, 6, 300000);

    expect(proceeds.salePrice).toBe(600000);
    expect(proceeds.sellingCosts).toBe(36000);
    expect(proceeds.loanPayoff).toBe(300000);
    expect(proceeds.netProceeds).toBe(264000);
  });

  it('handles different sale prices', () => {
    // Lower sale price
    const proceeds1 = calculateSaleProceeds(400000, 6, 200000);
    expect(proceeds1.netProceeds).toBe(176000); // 400k - 24k - 200k

    // Higher sale price
    const proceeds2 = calculateSaleProceeds(800000, 6, 300000);
    expect(proceeds2.netProceeds).toBe(452000); // 800k - 48k - 300k
  });

  it('handles 6% selling costs (standard)', () => {
    // 6% is typical agent commission
    const proceeds = calculateSaleProceeds(500000, 6, 250000);
    expect(proceeds.sellingCosts).toBe(30000); // 6% of $500k
    expect(proceeds.netProceeds).toBe(220000); // 500k - 30k - 250k
  });

  it('handles 7% selling costs', () => {
    // Some markets have higher commissions
    const proceeds = calculateSaleProceeds(500000, 7, 250000);
    expect(proceeds.sellingCosts).toBe(35000); // 7% of $500k
    expect(proceeds.netProceeds).toBe(215000); // 500k - 35k - 250k
  });

  it('handles 8% selling costs', () => {
    // Higher costs including transfer taxes
    const proceeds = calculateSaleProceeds(500000, 8, 250000);
    expect(proceeds.sellingCosts).toBe(40000); // 8% of $500k
    expect(proceeds.netProceeds).toBe(210000); // 500k - 40k - 250k
  });

  it('handles high remaining loan balance', () => {
    // Property with minimal equity
    const proceeds = calculateSaleProceeds(500000, 6, 450000);
    expect(proceeds.netProceeds).toBe(20000); // 500k - 30k - 450k (small profit)
  });

  it('handles low remaining loan balance', () => {
    // Property nearly paid off
    const proceeds = calculateSaleProceeds(500000, 6, 50000);
    expect(proceeds.netProceeds).toBe(420000); // 500k - 30k - 50k (large profit)
  });

  it('handles no remaining loan balance', () => {
    // Property fully paid off
    const proceeds = calculateSaleProceeds(500000, 6, 0);
    expect(proceeds.netProceeds).toBe(470000); // 500k - 30k - 0
  });

  it('handles underwater property (negative proceeds)', () => {
    // Sale price less than loan + costs
    const proceeds = calculateSaleProceeds(300000, 6, 350000);
    expect(proceeds.netProceeds).toBe(-68000); // 300k - 18k - 350k (loss)
    expect(proceeds.netProceeds).toBeLessThan(0);
  });

  it('handles appreciated property', () => {
    // Purchased $500k, sold $650k after 5 years
    // Remaining loan $380k (paid down from $400k)
    const proceeds = calculateSaleProceeds(650000, 6, 380000);
    expect(proceeds.salePrice).toBe(650000);
    expect(proceeds.sellingCosts).toBe(39000); // 6% of $650k
    expect(proceeds.netProceeds).toBe(231000); // 650k - 39k - 380k
  });

  it('handles break-even scenario', () => {
    // Net proceeds close to zero
    const proceeds = calculateSaleProceeds(350000, 6, 329000);
    expect(proceeds.netProceeds).toBeCloseTo(0, 0); // ~0
  });

  it('rounds all values to cents', () => {
    // Ensure proper rounding
    const proceeds = calculateSaleProceeds(567890.12, 6.5, 234567.89);

    expect(proceeds.salePrice).toBe(567890.12);
    expect(proceeds.sellingCosts).toBe(36912.86); // 6.5% of 567890.12
    expect(proceeds.loanPayoff).toBe(234567.89);
    expect(proceeds.netProceeds).toBe(296409.37); // Rounded to cents
  });

  it('calculates correctly with zero selling costs', () => {
    // Unusual but possible (FSBO or special arrangement)
    const proceeds = calculateSaleProceeds(500000, 0, 300000);
    expect(proceeds.sellingCosts).toBe(0);
    expect(proceeds.netProceeds).toBe(200000);
  });
});

describe('calculateTotalReturn', () => {
  it('calculates total return correctly', () => {
    // Investment: $100k initial
    // Cumulative cash flow: $40k over 5 years
    // Sale proceeds: $150k net
    const totalReturn = calculateTotalReturn(
      40000,
      150000,
      100000,
      [-100000, 8000, 8000, 8000, 8000, 158000] // Last year includes sale
    );

    expect(totalReturn.totalCashFlow).toBe(40000);
    expect(totalReturn.saleProceeds).toBe(150000);
    expect(totalReturn.totalReturn).toBe(190000); // 40k + 150k
    expect(totalReturn.totalInvestment).toBe(100000);
    expect(totalReturn.equityMultiple).toBe(1.9); // 190k / 100k
    expect(totalReturn.irr).toBeGreaterThan(0);
  });

  it('includes cumulative cash flow in return', () => {
    // Higher cash flow increases total return
    const return1 = calculateTotalReturn(
      20000,
      150000,
      100000,
      [-100000, 5000, 5000, 5000, 5000, 155000]
    );
    const return2 = calculateTotalReturn(
      60000,
      150000,
      100000,
      [-100000, 15000, 15000, 15000, 15000, 165000]
    );

    expect(return1.totalReturn).toBe(170000); // 20k + 150k
    expect(return2.totalReturn).toBe(210000); // 60k + 150k
    expect(return2.totalReturn).toBeGreaterThan(return1.totalReturn);
  });

  it('calculates equity multiple correctly', () => {
    // 2x return is strong performance
    const totalReturn = calculateTotalReturn(
      50000,
      150000,
      100000,
      [-100000, 10000, 10000, 10000, 10000, 160000]
    );

    expect(totalReturn.equityMultiple).toBe(2); // 200k / 100k = 2x
  });

  it('identifies break-even investment (1x)', () => {
    // Just got initial investment back
    const totalReturn = calculateTotalReturn(
      0,
      100000,
      100000,
      [-100000, 0, 0, 0, 0, 100000]
    );

    expect(totalReturn.totalReturn).toBe(100000);
    expect(totalReturn.equityMultiple).toBe(1); // Break-even
  });

  it('identifies losing investment (<1x)', () => {
    // Lost money on investment
    const totalReturn = calculateTotalReturn(
      10000,
      60000,
      100000,
      [-100000, 2000, 2000, 2000, 2000, 62000]
    );

    expect(totalReturn.totalReturn).toBe(70000); // 10k + 60k
    expect(totalReturn.equityMultiple).toBe(0.7); // Lost 30%
    expect(totalReturn.equityMultiple).toBeLessThan(1);
  });

  it('identifies strong investment (>2x)', () => {
    // Excellent returns
    const totalReturn = calculateTotalReturn(
      80000,
      200000,
      100000,
      [-100000, 16000, 16000, 16000, 16000, 216000]
    );

    expect(totalReturn.totalReturn).toBe(280000); // 80k + 200k
    expect(totalReturn.equityMultiple).toBe(2.8); // Strong 2.8x return
    expect(totalReturn.equityMultiple).toBeGreaterThan(2);
  });

  it('calculates IRR for complete lifecycle', () => {
    // Typical rental property: 5 year hold, good returns
    const totalReturn = calculateTotalReturn(
      40000, // $8k per year for 5 years
      150000, // Net sale proceeds
      100000, // Initial investment
      [-100000, 8000, 8000, 8000, 8000, 158000] // Year 5: cash flow + sale
    );

    expect(totalReturn.irr).not.toBeNull();
    expect(totalReturn.irr).toBeGreaterThan(10); // Should be >10% IRR
    expect(totalReturn.irr).toBeLessThan(30); // Reasonable upper bound
  });

  it('calculates IRR with negative cash flow years', () => {
    // Property with initial negative cash flow, then positive
    const totalReturn = calculateTotalReturn(
      5000, // Net $5k after some negative years
      120000, // Sale proceeds
      100000, // Initial investment
      [-100000, -3000, -2000, 5000, 5000, 125000] // Improving cash flow
    );

    expect(totalReturn.totalCashFlow).toBe(5000);
    expect(totalReturn.totalReturn).toBe(125000); // 5k + 120k
    expect(totalReturn.irr).toBeGreaterThan(0); // Should still be positive overall
  });

  it('handles zero cash flow (appreciation only)', () => {
    // Property breaks even on cash flow, profit from sale only
    const totalReturn = calculateTotalReturn(
      0, // Break-even cash flow
      180000, // All profit from appreciation
      100000,
      [-100000, 0, 0, 0, 0, 180000]
    );

    expect(totalReturn.totalReturn).toBe(180000);
    expect(totalReturn.equityMultiple).toBe(1.8);
    expect(totalReturn.irr).toBeGreaterThan(0);
  });

  it('handles negative total return (bad investment)', () => {
    // Lost money overall
    const totalReturn = calculateTotalReturn(
      -10000, // Negative cumulative cash flow
      60000, // Sale at loss
      100000,
      [-100000, -2000, -2000, -2000, -2000, 58000]
    );

    expect(totalReturn.totalReturn).toBe(50000); // -10k + 60k
    expect(totalReturn.equityMultiple).toBe(0.5); // Lost 50%
    expect(totalReturn.irr).toBeLessThan(0); // Negative IRR
  });

  it('handles high investment amount', () => {
    // Larger property investment
    const totalReturn = calculateTotalReturn(
      120000, // $24k/year for 5 years
      500000, // Large sale proceeds
      300000, // Large initial investment
      [-300000, 24000, 24000, 24000, 24000, 524000]
    );

    expect(totalReturn.totalReturn).toBe(620000);
    expect(totalReturn.equityMultiple).toBeCloseTo(2.07, 2);
  });

  it('handles different holding periods', () => {
    // 3 year hold
    const return3yr = calculateTotalReturn(
      24000, // $8k/year for 3 years
      130000,
      100000,
      [-100000, 8000, 8000, 138000]
    );

    // 7 year hold
    const return7yr = calculateTotalReturn(
      56000, // $8k/year for 7 years
      180000,
      100000,
      [-100000, 8000, 8000, 8000, 8000, 8000, 8000, 188000]
    );

    expect(return3yr.totalReturn).toBe(154000);
    expect(return7yr.totalReturn).toBe(236000);
    expect(return7yr.totalReturn).toBeGreaterThan(return3yr.totalReturn);
  });

  it('rounds all values to cents', () => {
    const totalReturn = calculateTotalReturn(
      12345.67,
      123456.78,
      98765.43,
      [-98765.43, 2469.13, 2469.13, 2469.13, 2469.13, 125925.91]
    );

    expect(totalReturn.totalCashFlow).toBe(12345.67);
    expect(totalReturn.saleProceeds).toBe(123456.78);
    expect(totalReturn.totalReturn).toBe(135802.45); // Rounded
    expect(totalReturn.totalInvestment).toBe(98765.43);
  });

  it('handles IRR calculation failure gracefully', () => {
    // Invalid cash flows (all positive)
    const totalReturn = calculateTotalReturn(
      40000,
      150000,
      100000,
      [10000, 10000, 10000] // Invalid: all positive
    );

    // IRR should be 0 when calculation fails
    expect(totalReturn.irr).toBe(0);
    // Other values should still be calculated
    expect(totalReturn.totalReturn).toBe(190000);
    expect(totalReturn.equityMultiple).toBe(1.9);
  });

  it('calculates realistic example: 5-year rental', () => {
    // Purchase: $500k property
    // Down payment: $100k (20%)
    // Closing costs: $10k
    // Repairs: $15k
    // Total investment: $125k
    //
    // Annual cash flow: $8k/year
    // Cumulative cash flow: $40k over 5 years
    //
    // Sale after 5 years:
    // Appreciated value: $600k
    // Loan payoff: $365k (paid down from $400k)
    // Selling costs: $36k (6%)
    // Net proceeds: $199k
    //
    // Total return: $40k + $199k = $239k on $125k investment
    const totalReturn = calculateTotalReturn(
      40000,
      199000,
      125000,
      [-125000, 8000, 8000, 8000, 8000, 207000]
    );

    expect(totalReturn.totalCashFlow).toBe(40000);
    expect(totalReturn.saleProceeds).toBe(199000);
    expect(totalReturn.totalReturn).toBe(239000);
    expect(totalReturn.totalInvestment).toBe(125000);
    expect(totalReturn.equityMultiple).toBeCloseTo(1.91, 2); // 1.91x return
    expect(totalReturn.irr).toBeGreaterThan(12); // >12% IRR (strong)
    expect(totalReturn.irr).toBeLessThan(16); // <16% IRR (realistic)
  });
});
