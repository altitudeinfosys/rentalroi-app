/**
 * Investment metrics calculations
 *
 * Formulas verified against:
 * - J.P. Morgan Real Estate Investment Analysis
 * - Wall Street Prep
 */

import type { InvestmentMetrics } from './types';

/**
 * Calculate Net Present Value for a given rate
 * Used internally by IRR calculation
 */
function calculateNPV(rate: number, cashFlows: number[]): number {
  let npv = 0;
  for (let i = 0; i < cashFlows.length; i++) {
    npv += cashFlows[i] / Math.pow(1 + rate, i);
  }
  return npv;
}

/**
 * Calculate Cash-on-Cash Return
 *
 * Formula: CoC Return = Annual Pre-Tax Cash Flow / Total Cash Invested
 *
 * This is a LEVERED metric (accounts for financing)
 * Typical Range: 8-12% is considered good
 *
 * Source: J.P. Morgan, Wall Street Prep
 *
 * @param annualCashFlow Annual pre-tax cash flow
 * @param totalInvestment Total cash invested (down payment + closing costs + repairs)
 * @returns Cash-on-Cash return as percentage
 *
 * @example
 * // $12,000 annual cash flow / $100,000 invested = 12%
 * calculateCashOnCashReturn(12000, 100000) // Returns 12
 */
export function calculateCashOnCashReturn(
  annualCashFlow: number,
  totalInvestment: number
): number {
  if (totalInvestment === 0) {
    return 0;
  }

  const cocReturn = (annualCashFlow / totalInvestment) * 100;
  return Math.round(cocReturn * 100) / 100;
}

/**
 * Calculate Capitalization Rate (Cap Rate)
 *
 * Formula: Cap Rate = NOI / Property Value
 *
 * This is an UNLEVERED metric (ignores financing)
 * Used to compare properties and assess value
 *
 * Typical Ranges:
 * - Class A properties: 4-6%
 * - Class B properties: 6-8%
 * - Class C properties: 8-12%
 *
 * Source: Wall Street Prep
 *
 * @param noi Annual Net Operating Income
 * @param propertyValue Current property value
 * @returns Cap rate as percentage
 *
 * @example
 * // $36,000 NOI / $500,000 property = 7.2%
 * calculateCapRate(36000, 500000) // Returns 7.2
 */
export function calculateCapRate(
  noi: number,
  propertyValue: number
): number {
  if (propertyValue === 0) {
    return 0;
  }

  const capRate = (noi / propertyValue) * 100;
  return Math.round(capRate * 100) / 100;
}

/**
 * Calculate Internal Rate of Return (IRR)
 *
 * Formula: IRR = Rate where NPV of all cash flows equals zero
 * 0 = CF₀ + CF₁/(1+IRR) + CF₂/(1+IRR)² + ... + CFₙ/(1+IRR)ⁿ
 *
 * Target IRR: 15-20% for commercial real estate
 *
 * Source: Wall Street Prep
 *
 * @param cashFlows Array of cash flows (initial investment should be negative)
 * @returns IRR as percentage, or null if cannot calculate
 *
 * @example
 * // Initial $100k investment, then 5 years of $10k, then $110k final year
 * calculateIRR([-100000, 10000, 10000, 10000, 10000, 110000]) // Returns ~7.93%
 */
export function calculateIRR(cashFlows: number[]): number | null {
  try {
    // Need at least 2 cash flows
    if (cashFlows.length < 2) {
      return null;
    }

    // Check for valid cash flow pattern (mix of positive and negative)
    const hasPositive = cashFlows.some((cf) => cf > 0);
    const hasNegative = cashFlows.some((cf) => cf < 0);
    if (!hasPositive || !hasNegative) {
      return null;
    }

    // Newton-Raphson method to find IRR
    let rate = 0.1; // Start with 10% guess
    const maxIterations = 1000;
    const tolerance = 0.00001;

    for (let iteration = 0; iteration < maxIterations; iteration++) {
      // Calculate NPV and its derivative
      let npv = 0;
      let npvDerivative = 0;

      for (let i = 0; i < cashFlows.length; i++) {
        const discountFactor = Math.pow(1 + rate, i);
        npv += cashFlows[i] / discountFactor;
        npvDerivative -= (i * cashFlows[i]) / (discountFactor * (1 + rate));
      }

      // Check for convergence
      if (Math.abs(npv) < tolerance) {
        const irrPercent = rate * 100;
        return Math.round(irrPercent * 100) / 100;
      }

      // Newton-Raphson: new_rate = old_rate - f(rate)/f'(rate)
      if (Math.abs(npvDerivative) < 0.0000001) {
        // Derivative too small, can't continue
        return null;
      }

      rate = rate - npv / npvDerivative;

      // Check for invalid rate
      if (!isFinite(rate) || isNaN(rate)) {
        return null;
      }
    }

    // Didn't converge
    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Calculate Debt Service Coverage Ratio (DSCR)
 *
 * Formula: DSCR = NOI / Annual Debt Service
 *
 * Interpretation:
 * - < 1.0 = Cannot cover debt payments
 * - = 1.0 = Break-even
 * - > 1.25 = Typical lender minimum
 * - > 2.0 = Preferred by commercial lenders
 *
 * Source: J.P. Morgan
 *
 * @param noi Annual Net Operating Income
 * @param annualDebtService Annual mortgage payments (P&I)
 * @returns DSCR as ratio
 *
 * @example
 * // $36,000 NOI / $30,000 annual debt = 1.2x
 * calculateDSCR(36000, 30000) // Returns 1.2
 */
export function calculateDSCR(
  noi: number,
  annualDebtService: number
): number {
  if (annualDebtService === 0) {
    // No debt means infinite coverage (return a high number)
    return noi > 0 ? 999.99 : 0;
  }

  const dscr = noi / annualDebtService;
  return Math.round(dscr * 100) / 100;
}

/**
 * Calculate Equity Multiple
 *
 * Formula: Equity Multiple = Total Distributions / Total Equity Invested
 *
 * Includes: All cash distributions + sale proceeds
 * Typical: 1.5x - 2.0x for 5-7 year hold
 *
 * LIMITATION: Does NOT account for time value of money
 * (Use IRR for time-adjusted returns)
 *
 * Source: Wall Street Prep
 *
 * @param totalDistributions Sum of all cash flows + sale proceeds
 * @param totalInvestment Initial equity invested
 * @returns Equity multiple as ratio
 *
 * @example
 * // $150,000 total returned / $100,000 invested = 1.5x
 * calculateEquityMultiple(150000, 100000) // Returns 1.5
 */
export function calculateEquityMultiple(
  totalDistributions: number,
  totalInvestment: number
): number {
  if (totalInvestment === 0) {
    return 0;
  }

  const multiple = totalDistributions / totalInvestment;
  return Math.round(multiple * 100) / 100;
}

/**
 * Calculate Gross Rent Multiplier (GRM)
 *
 * Formula: GRM = Property Price / Gross Annual Rent
 *
 * Typical: 6-10 is considered good for residential
 * Use: Quick comparison tool only
 *
 * LIMITATIONS:
 * - Ignores expenses
 * - Ignores vacancy
 * - Ignores financing
 * - Only useful for comparing similar properties
 *
 * Source: Wall Street Prep
 *
 * @param propertyPrice Purchase or current value
 * @param annualRent Gross annual rental income
 * @returns GRM as ratio
 *
 * @example
 * // $500,000 property / $42,000 rent = 11.9 GRM
 * calculateGRM(500000, 42000) // Returns 11.9
 */
export function calculateGRM(
  propertyPrice: number,
  annualRent: number
): number {
  if (annualRent === 0) {
    return 0;
  }

  const grm = propertyPrice / annualRent;
  return Math.round(grm * 10) / 10;
}

/**
 * Calculate all investment metrics at once
 *
 * @param annualCashFlow Annual pre-tax cash flow
 * @param annualNOI Annual Net Operating Income
 * @param annualDebtService Annual mortgage payments
 * @param propertyValue Current property value
 * @param totalInvestment Total cash invested
 * @param cashFlows Array of cash flows for IRR calculation
 * @param totalDistributions Total cash returned (for equity multiple)
 * @param annualRent Gross annual rent
 * @returns Object with all metrics
 */
export function calculateAllMetrics(
  annualCashFlow: number,
  annualNOI: number,
  annualDebtService: number,
  propertyValue: number,
  totalInvestment: number,
  cashFlows: number[],
  totalDistributions: number,
  annualRent: number
): InvestmentMetrics {
  return {
    cashOnCashReturn: calculateCashOnCashReturn(annualCashFlow, totalInvestment),
    capRate: calculateCapRate(annualNOI, propertyValue),
    dscr: calculateDSCR(annualNOI, annualDebtService),
    grm: calculateGRM(propertyValue, annualRent),
    equityMultiple: calculateEquityMultiple(totalDistributions, totalInvestment),
    irr: calculateIRR(cashFlows) || 0,
  };
}
