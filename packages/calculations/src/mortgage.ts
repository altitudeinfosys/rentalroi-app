/**
 * Mortgage calculation functions
 *
 * Formulas verified against:
 * - Bankrate Mortgage Calculator
 * - Excel PMT function
 * - Wall Street Prep
 */

import type { AmortizationYear } from './types';

/**
 * Calculate monthly mortgage payment (Principal & Interest only)
 *
 * Formula: M = P × [r × (1 + r)^n] / [(1 + r)^n - 1]
 * Where:
 *   M = Monthly payment
 *   P = Principal (loan amount)
 *   r = Monthly interest rate (annual rate / 12 / 100)
 *   n = Number of payments (years × 12)
 *
 * Source: Bankrate Mortgage Calculator
 *
 * @param principal Loan amount in dollars
 * @param annualRate Annual interest rate as percentage (e.g., 6.5 for 6.5%)
 * @param years Loan term in years (e.g., 30)
 * @returns Monthly payment amount
 *
 * @example
 * // $500,000 loan at 6% for 30 years
 * calculateMonthlyPayment(500000, 6, 30) // Returns 2997.75
 */
export function calculateMonthlyPayment(
  principal: number,
  annualRate: number,
  years: number
): number {
  // Handle edge case: 0% interest
  if (annualRate === 0) {
    return principal / (years * 12);
  }

  // Convert annual rate to monthly decimal
  const monthlyRate = annualRate / 100 / 12;

  // Total number of payments
  const numPayments = years * 12;

  // Apply mortgage payment formula
  const payment =
    principal *
    (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) /
    (Math.pow(1 + monthlyRate, numPayments) - 1);

  return Math.round(payment * 100) / 100; // Round to cents
}

/**
 * Generate year-by-year amortization schedule
 *
 * Each year shows:
 * - Beginning balance
 * - Total payments made
 * - Principal paid
 * - Interest paid
 * - Ending balance
 *
 * Note: First payments are mostly interest, later payments are mostly principal
 *
 * @param principal Initial loan amount
 * @param annualRate Annual interest rate as percentage
 * @param years Loan term in years
 * @returns Array of amortization data for each year
 *
 * @example
 * const schedule = generateAmortizationSchedule(400000, 6.5, 30);
 * console.log(schedule[0]); // Year 1 data
 * console.log(schedule[29]); // Year 30 data (final year)
 */
export function generateAmortizationSchedule(
  principal: number,
  annualRate: number,
  years: number
): AmortizationYear[] {
  const monthlyPayment = calculateMonthlyPayment(principal, annualRate, years);
  const monthlyRate = annualRate / 100 / 12;

  const schedule: AmortizationYear[] = [];
  let balance = principal;

  for (let year = 1; year <= years; year++) {
    const beginningBalance = balance;

    let yearlyPrincipal = 0;
    let yearlyInterest = 0;

    // Calculate 12 months for this year
    for (let month = 1; month <= 12; month++) {
      const interestPayment = balance * monthlyRate;
      let principalPayment = monthlyPayment - interestPayment;

      // For final payment, pay off remaining balance exactly
      if (year === years && month === 12) {
        principalPayment = balance;
      }

      yearlyInterest += interestPayment;
      yearlyPrincipal += principalPayment;

      balance -= principalPayment;

      // Prevent negative balance due to rounding
      if (balance < 0.01) {
        balance = 0;
      }
    }

    schedule.push({
      year,
      beginningBalance: Math.round(beginningBalance * 100) / 100,
      payment: Math.round(monthlyPayment * 12 * 100) / 100,
      principal: Math.round(yearlyPrincipal * 100) / 100,
      interest: Math.round(yearlyInterest * 100) / 100,
      endingBalance: Math.round(balance * 100) / 100,
    });
  }

  return schedule;
}

/**
 * Calculate total interest paid over the life of the loan
 *
 * @param principal Loan amount
 * @param annualRate Annual interest rate as percentage
 * @param years Loan term in years
 * @returns Total interest paid in dollars
 *
 * @example
 * calculateTotalInterest(500000, 6, 30) // Returns ~579,190
 */
export function calculateTotalInterest(
  principal: number,
  annualRate: number,
  years: number
): number {
  const monthlyPayment = calculateMonthlyPayment(principal, annualRate, years);
  const totalPaid = monthlyPayment * years * 12;
  const totalInterest = totalPaid - principal;

  return Math.round(totalInterest * 100) / 100;
}

/**
 * Calculate remaining loan balance at a given year
 *
 * @param principal Original loan amount
 * @param annualRate Annual interest rate as percentage
 * @param years Total loan term in years
 * @param atYear Year to calculate balance at (must be <= years)
 * @returns Remaining balance at the end of the specified year
 *
 * @example
 * calculateRemainingBalance(400000, 6.5, 30, 5) // Balance after 5 years
 */
export function calculateRemainingBalance(
  principal: number,
  annualRate: number,
  years: number,
  atYear: number
): number {
  if (atYear > years) {
    return 0;
  }

  const schedule = generateAmortizationSchedule(principal, annualRate, years);
  return schedule[atYear - 1].endingBalance;
}
