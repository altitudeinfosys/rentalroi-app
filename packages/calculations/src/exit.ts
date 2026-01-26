/**
 * Sale/exit calculation functions
 *
 * Formulas for calculating property sale proceeds and total investment returns
 */

import type { SaleProceeds, TotalReturn } from './types';
import { calculateIRR, calculateEquityMultiple } from './metrics';

/**
 * Calculate net proceeds from property sale
 *
 * Formula: Net Proceeds = Sale Price - Selling Costs - Loan Payoff
 *
 * Selling costs typically include:
 * - Real estate agent commissions (6-8%)
 * - Title and escrow fees
 * - Transfer taxes
 * - Other closing costs
 *
 * @param salePrice Property sale price
 * @param sellingCostsPercent Selling costs as percentage (e.g., 6 for 6%)
 * @param loanPayoff Remaining loan balance at time of sale
 * @returns SaleProceeds object with breakdown
 *
 * @example
 * // Sell $600k property with 6% costs and $300k loan balance
 * calculateSaleProceeds(600000, 6, 300000)
 * // Returns: { salePrice: 600000, sellingCosts: 36000, loanPayoff: 300000, netProceeds: 264000 }
 */
export function calculateSaleProceeds(
  salePrice: number,
  sellingCostsPercent: number,
  loanPayoff: number
): SaleProceeds {
  const sellingCosts = salePrice * (sellingCostsPercent / 100);
  const netProceeds = salePrice - sellingCosts - loanPayoff;

  return {
    salePrice: Math.round(salePrice * 100) / 100,
    sellingCosts: Math.round(sellingCosts * 100) / 100,
    loanPayoff: Math.round(loanPayoff * 100) / 100,
    netProceeds: Math.round(netProceeds * 100) / 100,
  };
}

/**
 * Calculate complete investment return analysis
 *
 * Analyzes total return from:
 * - Cumulative cash flow over holding period
 * - Net proceeds from property sale
 * - Equity multiple (total return / total investment)
 * - Internal Rate of Return (IRR) for complete investment lifecycle
 *
 * @param cumulativeCashFlow Sum of all annual cash flows during holding period
 * @param saleProceeds Net proceeds from property sale
 * @param totalInvestment Total cash invested (down payment + closing costs + repairs)
 * @param cashFlows Array of cash flows including initial investment (negative) and all annual flows plus sale proceeds in final year
 * @returns TotalReturn object with complete analysis
 *
 * @example
 * // Investment: $100k initial, $40k cumulative cash flow, $150k net sale proceeds
 * // Cash flows: [-100k, 8k, 8k, 8k, 8k, 158k (8k + 150k)]
 * calculateTotalReturn(40000, 150000, 100000, [-100000, 8000, 8000, 8000, 8000, 158000])
 * // Returns: {
 * //   totalCashFlow: 40000,
 * //   saleProceeds: 150000,
 * //   totalReturn: 190000,
 * //   totalInvestment: 100000,
 * //   equityMultiple: 1.9,
 * //   irr: ~15%
 * // }
 */
export function calculateTotalReturn(
  cumulativeCashFlow: number,
  saleProceeds: number,
  totalInvestment: number,
  cashFlows: number[]
): TotalReturn {
  const totalReturn = cumulativeCashFlow + saleProceeds;
  const equityMultiple = calculateEquityMultiple(totalReturn, totalInvestment);
  const irr = calculateIRR(cashFlows) || 0;

  return {
    totalCashFlow: Math.round(cumulativeCashFlow * 100) / 100,
    saleProceeds: Math.round(saleProceeds * 100) / 100,
    totalReturn: Math.round(totalReturn * 100) / 100,
    totalInvestment: Math.round(totalInvestment * 100) / 100,
    equityMultiple: equityMultiple,
    irr: irr,
  };
}
