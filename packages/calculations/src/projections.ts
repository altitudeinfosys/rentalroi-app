/**
 * Multi-year projection calculations
 *
 * Calculates year-over-year property performance including:
 * - Rent increases (compounding)
 * - Expense increases (compounding)
 * - Loan amortization
 * - Property appreciation
 * - Equity buildup
 */

import type { CalculationInputs, ProjectionYear } from './types';
import { generateAmortizationSchedule, calculateMonthlyPayment } from './mortgage';
import { calculateCashOnCashReturn, calculateCapRate, calculateDSCR } from './metrics';

/**
 * Calculate multi-year property projections
 *
 * Projects property performance year-over-year with:
 * - Compounding rent increases
 * - Compounding expense increases
 * - Loan balance reduction (amortization)
 * - Property appreciation
 * - Equity accumulation
 *
 * @param inputs Complete calculation inputs
 * @returns Array of projection data for each year
 *
 * @example
 * const inputs: CalculationInputs = {
 *   purchasePrice: 500000,
 *   downPaymentPercent: 20,
 *   interestRate: 6.5,
 *   loanTermYears: 30,
 *   monthlyRent: 3500,
 *   holdingLength: 10,
 *   annualRentIncrease: 3,
 *   annualExpenseIncrease: 2.5,
 *   annualAppreciationRate: 3,
 *   // ... other fields
 * };
 * const projections = calculateMultiYearProjection(inputs);
 * console.log(projections[0]); // Year 1 data
 * console.log(projections[9]); // Year 10 data
 */
export function calculateMultiYearProjection(
  inputs: CalculationInputs
): ProjectionYear[] {
  // Calculate initial values
  const loanAmount = inputs.purchasePrice * (1 - inputs.downPaymentPercent / 100);
  const monthlyPayment = calculateMonthlyPayment(
    loanAmount,
    inputs.interestRate,
    inputs.loanTermYears
  );
  const annualMortgagePayment = monthlyPayment * 12;

  // Generate amortization schedule for the full loan term
  const amortizationSchedule = generateAmortizationSchedule(
    loanAmount,
    inputs.interestRate,
    inputs.loanTermYears
  );

  // Calculate initial investment for Cash-on-Cash calculation
  const totalInvestment =
    (inputs.purchasePrice * inputs.downPaymentPercent / 100) +
    inputs.closingCosts +
    inputs.repairCosts;

  const projections: ProjectionYear[] = [];
  let cumulativeCashFlow = 0;

  // Project for each year
  for (let year = 1; year <= inputs.holdingLength; year++) {
    // Apply compounding rent increase
    // Formula: Future Value = Present Value × (1 + rate)^years
    const monthlyRent =
      inputs.monthlyRent * Math.pow(1 + inputs.annualRentIncrease / 100, year - 1);
    const otherMonthlyIncome =
      inputs.otherMonthlyIncome * Math.pow(1 + inputs.annualRentIncrease / 100, year - 1);

    // Calculate income
    const grossMonthlyIncome = monthlyRent + otherMonthlyIncome;
    const grossAnnualIncome = grossMonthlyIncome * 12;
    const vacancyLoss = (grossAnnualIncome * inputs.vacancyRate) / 100;
    const netIncome = grossAnnualIncome - vacancyLoss;

    // Apply compounding expense increase to each expense category
    const expenseMultiplier = Math.pow(1 + inputs.annualExpenseIncrease / 100, year - 1);

    const propertyTax = inputs.propertyTaxAnnual * expenseMultiplier;
    const insurance = inputs.insuranceAnnual * expenseMultiplier;
    const hoa = inputs.hoaMonthly * 12 * expenseMultiplier;
    const maintenance = inputs.maintenanceMonthly * 12 * expenseMultiplier;
    const utilities = inputs.utilitiesMonthly * 12 * expenseMultiplier;
    const otherExpenses = inputs.otherExpensesMonthly * 12 * expenseMultiplier;

    // Management fee is based on current gross rent (after rent increases)
    const management = (grossAnnualIncome * inputs.propertyManagementPercent) / 100;

    const totalExpenses =
      propertyTax + insurance + hoa + maintenance + management + utilities + otherExpenses;

    // Calculate NOI (Net Operating Income)
    const noi = netIncome - totalExpenses;

    // Get loan data from amortization schedule
    // Note: Schedule is for full loan term, but we only project for holdingLength
    const amortYear = amortizationSchedule[year - 1];
    const principalPaid = amortYear.principal;
    const interestPaid = amortYear.interest;
    const loanBalance = amortYear.endingBalance;

    // Calculate cash flow
    const cashFlow = noi - annualMortgagePayment;
    cumulativeCashFlow += cashFlow;

    // Apply compounding appreciation
    const propertyValue =
      inputs.purchasePrice * Math.pow(1 + inputs.annualAppreciationRate / 100, year);

    // Calculate equity (property value minus loan balance)
    const equity = propertyValue - loanBalance;

    // Calculate metrics
    const cashOnCashReturn = calculateCashOnCashReturn(cashFlow, totalInvestment);
    const capRate = calculateCapRate(noi, propertyValue);
    const dscr = calculateDSCR(noi, annualMortgagePayment);

    projections.push({
      year,

      // Income
      grossIncome: Math.round(grossAnnualIncome * 100) / 100,
      vacancyLoss: Math.round(vacancyLoss * 100) / 100,
      netIncome: Math.round(netIncome * 100) / 100,

      // Expenses
      propertyTax: Math.round(propertyTax * 100) / 100,
      insurance: Math.round(insurance * 100) / 100,
      hoa: Math.round(hoa * 100) / 100,
      maintenance: Math.round(maintenance * 100) / 100,
      management: Math.round(management * 100) / 100,
      utilities: Math.round(utilities * 100) / 100,
      otherExpenses: Math.round(otherExpenses * 100) / 100,
      totalExpenses: Math.round(totalExpenses * 100) / 100,

      // Debt
      mortgagePayment: Math.round(annualMortgagePayment * 100) / 100,
      principalPaid: Math.round(principalPaid * 100) / 100,
      interestPaid: Math.round(interestPaid * 100) / 100,
      loanBalance: Math.round(loanBalance * 100) / 100,

      // Performance
      noi: Math.round(noi * 100) / 100,
      cashFlow: Math.round(cashFlow * 100) / 100,
      cumulativeCashFlow: Math.round(cumulativeCashFlow * 100) / 100,

      // Equity
      propertyValue: Math.round(propertyValue * 100) / 100,
      equity: Math.round(equity * 100) / 100,

      // Metrics
      cashOnCashReturn,
      capRate,
      dscr,
    });
  }

  return projections;
}
