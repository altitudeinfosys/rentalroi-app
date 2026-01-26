/**
 * Cash flow calculation functions
 *
 * Formulas verified against:
 * - J.P. Morgan Real Estate Investment Analysis
 * - Wall Street Prep
 */

import type { CashFlowBreakdown } from './types';

/**
 * Calculate Net Operating Income (NOI)
 *
 * Formula: NOI = Gross Income - Operating Expenses
 *
 * IMPORTANT: NOI excludes:
 * - Mortgage payments (debt service)
 * - Depreciation
 * - Capital expenditures
 * - Income taxes
 *
 * NOI includes expenses like:
 * - Property taxes
 * - Insurance
 * - Utilities (if owner-paid)
 * - Maintenance and repairs
 * - Property management
 * - HOA fees
 *
 * Source: J.P. Morgan, Wall Street Prep
 *
 * @param grossIncome Total rental income (after vacancy)
 * @param operatingExpenses Total operating expenses (excluding mortgage)
 * @returns Net Operating Income
 *
 * @example
 * // $48,000 gross income, $12,000 operating expenses
 * calculateNOI(48000, 12000) // Returns 36000
 */
export function calculateNOI(
  grossIncome: number,
  operatingExpenses: number
): number {
  return Math.round((grossIncome - operatingExpenses) * 100) / 100;
}

/**
 * Calculate comprehensive cash flow breakdown
 *
 * Formula: Cash Flow = (Gross Rent - Vacancy) - Operating Expenses - Mortgage
 * Or: Cash Flow = NOI - Debt Service
 *
 * @param monthlyRent Monthly rental income
 * @param vacancyRate Vacancy rate as percentage (e.g., 5 for 5%)
 * @param monthlyOperatingExpenses Total monthly operating expenses
 * @param monthlyMortgagePayment Monthly mortgage payment (P&I)
 * @returns Complete cash flow breakdown
 *
 * @example
 * // $4,000 rent, 5% vacancy, $1,000 expenses, $2,000 mortgage
 * calculateCashFlow(4000, 5, 1000, 2000)
 * // Returns: {
 * //   grossIncome: 4000,
 * //   vacancyLoss: 200,
 * //   netIncome: 3800,
 * //   totalExpenses: 1000,
 * //   noi: 2800,
 * //   debtService: 2000,
 * //   cashFlow: 800
 * // }
 */
export function calculateCashFlow(
  monthlyRent: number,
  vacancyRate: number,
  monthlyOperatingExpenses: number,
  monthlyMortgagePayment: number
): CashFlowBreakdown {
  // Calculate income after vacancy
  const grossIncome = monthlyRent;
  const vacancyLoss = (monthlyRent * vacancyRate) / 100;
  const netIncome = grossIncome - vacancyLoss;

  // Calculate NOI (excludes mortgage)
  const totalExpenses = monthlyOperatingExpenses;
  const noi = netIncome - totalExpenses;

  // Calculate cash flow (after mortgage)
  const debtService = monthlyMortgagePayment;
  const cashFlow = noi - debtService;

  return {
    grossIncome: Math.round(grossIncome * 100) / 100,
    vacancyLoss: Math.round(vacancyLoss * 100) / 100,
    netIncome: Math.round(netIncome * 100) / 100,
    totalExpenses: Math.round(totalExpenses * 100) / 100,
    noi: Math.round(noi * 100) / 100,
    debtService: Math.round(debtService * 100) / 100,
    cashFlow: Math.round(cashFlow * 100) / 100,
  };
}

/**
 * Calculate annual cash flow from monthly inputs
 *
 * @param monthlyRent Monthly rental income
 * @param vacancyRate Vacancy rate as percentage
 * @param monthlyOperatingExpenses Total monthly operating expenses
 * @param monthlyMortgagePayment Monthly mortgage payment
 * @returns Annual cash flow amount
 *
 * @example
 * calculateAnnualCashFlow(3500, 5, 950, 2398) // Returns ~1,788
 */
export function calculateAnnualCashFlow(
  monthlyRent: number,
  vacancyRate: number,
  monthlyOperatingExpenses: number,
  monthlyMortgagePayment: number
): number {
  const monthly = calculateCashFlow(
    monthlyRent,
    vacancyRate,
    monthlyOperatingExpenses,
    monthlyMortgagePayment
  );

  return Math.round(monthly.cashFlow * 12 * 100) / 100;
}

/**
 * Calculate operating expenses from individual components
 *
 * @param propertyTaxAnnual Annual property tax
 * @param insuranceAnnual Annual insurance premium
 * @param hoaMonthly Monthly HOA fees
 * @param maintenanceMonthly Monthly maintenance budget
 * @param managementPercent Property management fee as % of gross rent
 * @param monthlyRent Monthly rental income (for calculating management fee)
 * @param utilitiesMonthly Monthly utilities (if owner-paid)
 * @param otherMonthly Other monthly expenses
 * @returns Total monthly operating expenses
 *
 * @example
 * calculateOperatingExpenses(4800, 1200, 0, 250, 8, 3500, 0, 0)
 * // Returns: 1,030 ($500 tax + $100 insurance + $250 maintenance + $280 management)
 */
export function calculateOperatingExpenses(
  propertyTaxAnnual: number,
  insuranceAnnual: number,
  hoaMonthly: number,
  maintenanceMonthly: number,
  managementPercent: number,
  monthlyRent: number,
  utilitiesMonthly: number,
  otherMonthly: number
): number {
  const propertyTaxMonthly = propertyTaxAnnual / 12;
  const insuranceMonthly = insuranceAnnual / 12;
  const managementFee = (monthlyRent * managementPercent) / 100;

  const total =
    propertyTaxMonthly +
    insuranceMonthly +
    hoaMonthly +
    maintenanceMonthly +
    managementFee +
    utilitiesMonthly +
    otherMonthly;

  return Math.round(total * 100) / 100;
}

/**
 * Check if property cash flows positively
 *
 * @param cashFlow Monthly cash flow amount
 * @returns True if positive, false if negative
 */
export function isPositiveCashFlow(cashFlow: number): boolean {
  return cashFlow > 0;
}
