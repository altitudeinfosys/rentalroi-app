/**
 * Mortgage calculation tests
 *
 * Tests verify calculations match:
 * - Bankrate Mortgage Calculator
 * - Excel PMT function
 */

import { describe, it, expect } from 'vitest';
import {
  calculateMonthlyPayment,
  generateAmortizationSchedule,
  calculateTotalInterest,
  calculateRemainingBalance,
} from '../mortgage';

describe('calculateMonthlyPayment', () => {
  it('matches Bankrate calculator for $500k at 6% for 30 years', () => {
    // Verified with Bankrate: https://www.bankrate.com/mortgages/mortgage-calculator/
    const payment = calculateMonthlyPayment(500000, 6, 30);
    expect(payment).toBe(2997.75);
  });

  it('matches Excel PMT function', () => {
    // Excel formula: =PMT(6%/12, 360, -500000)
    // Result: $2,997.75
    const payment = calculateMonthlyPayment(500000, 6, 30);
    expect(payment).toBeCloseTo(2997.75, 2);
  });

  it('calculates correctly for different loan amounts', () => {
    // $400k at 6.5% for 30 years
    const payment400k = calculateMonthlyPayment(400000, 6.5, 30);
    expect(payment400k).toBeCloseTo(2528.27, 2);

    // $250k at 5.5% for 30 years
    const payment250k = calculateMonthlyPayment(250000, 5.5, 30);
    expect(payment250k).toBeCloseTo(1419.47, 2);
  });

  it('calculates correctly for 15-year mortgage', () => {
    // $400k at 5.5% for 15 years
    const payment15yr = calculateMonthlyPayment(400000, 5.5, 15);
    // Our calculation gives $3,268.33 (verified with Excel PMT)
    expect(payment15yr).toBeCloseTo(3268.33, 2);
  });

  it('handles 0% interest rate', () => {
    // $100k at 0% for 30 years should be simple division
    const payment = calculateMonthlyPayment(100000, 0, 30);
    const expected = 100000 / (30 * 12); // $277.78
    expect(payment).toBeCloseTo(expected, 2);
  });

  it('handles high interest rates', () => {
    // $300k at 12% for 30 years
    const payment = calculateMonthlyPayment(300000, 12, 30);
    // Allow 1 decimal precision due to rounding differences between calculators
    expect(payment).toBeCloseTo(3085.84, 1);
  });

  it('returns higher payment for shorter term', () => {
    const payment30yr = calculateMonthlyPayment(400000, 6, 30);
    const payment15yr = calculateMonthlyPayment(400000, 6, 15);

    // 15-year payment should be higher than 30-year
    expect(payment15yr).toBeGreaterThan(payment30yr);
  });

  it('rounds to cents', () => {
    const payment = calculateMonthlyPayment(123456, 6.789, 27);
    // Should be rounded to 2 decimal places
    expect(payment).toBe(Math.round(payment * 100) / 100);
  });
});

describe('generateAmortizationSchedule', () => {
  it('generates correct number of years', () => {
    const schedule = generateAmortizationSchedule(400000, 6.5, 30);
    expect(schedule).toHaveLength(30);
  });

  it('first payment is mostly interest', () => {
    const schedule = generateAmortizationSchedule(400000, 6.5, 30);
    const firstYear = schedule[0];

    // First year should have more interest than principal
    expect(firstYear.interest).toBeGreaterThan(firstYear.principal);

    // For this loan, first year interest should be ~$25,868
    expect(firstYear.interest).toBeCloseTo(25868, 0); // Within $1
  });

  it('last payment is mostly principal', () => {
    const schedule = generateAmortizationSchedule(400000, 6.5, 30);
    const lastYear = schedule[schedule.length - 1];

    // Last year should have more principal than interest
    expect(lastYear.principal).toBeGreaterThan(lastYear.interest);
  });

  it('loan balance reaches zero at term end', () => {
    const schedule = generateAmortizationSchedule(400000, 6.5, 30);
    const lastYear = schedule[schedule.length - 1];

    // Final balance should be zero (or very close due to rounding)
    expect(lastYear.endingBalance).toBeCloseTo(0, 2);
  });

  it('each year beginning balance equals previous ending balance', () => {
    const schedule = generateAmortizationSchedule(400000, 6.5, 30);

    for (let i = 1; i < schedule.length; i++) {
      const prevEndingBalance = schedule[i - 1].endingBalance;
      const currentBeginningBalance = schedule[i].beginningBalance;

      expect(currentBeginningBalance).toBeCloseTo(prevEndingBalance, 2);
    }
  });

  it('principal + interest = total payment each year', () => {
    const schedule = generateAmortizationSchedule(400000, 6.5, 30);

    // Check all years except the last (which pays off remaining balance)
    for (let i = 0; i < schedule.length - 1; i++) {
      const year = schedule[i];
      const sum = year.principal + year.interest;
      expect(sum).toBeCloseTo(year.payment, 2);
    }

    // Final year may differ slightly as it pays off exact remaining balance
    const finalYear = schedule[schedule.length - 1];
    expect(finalYear.endingBalance).toBe(0);
  });

  it('beginning balance - principal paid = ending balance', () => {
    const schedule = generateAmortizationSchedule(400000, 6.5, 30);

    schedule.forEach((year) => {
      const calculatedEnding = year.beginningBalance - year.principal;
      // Allow for small rounding differences, especially in later years
      expect(calculatedEnding).toBeCloseTo(year.endingBalance, 1);
    });
  });

  it('balance decreases each year', () => {
    const schedule = generateAmortizationSchedule(400000, 6.5, 30);

    for (let i = 1; i < schedule.length; i++) {
      expect(schedule[i].beginningBalance).toBeLessThan(
        schedule[i - 1].beginningBalance
      );
    }
  });

  it('handles 0% interest correctly', () => {
    const schedule = generateAmortizationSchedule(100000, 0, 10);

    // With 0% interest, all payment should be principal
    schedule.forEach((year) => {
      expect(year.interest).toBeCloseTo(0, 2);
      expect(year.principal).toBeCloseTo(year.payment, 2);
    });

    // Each year should pay down 1/10 of the loan
    const expectedYearlyPrincipal = 100000 / 10;
    schedule.forEach((year) => {
      expect(year.principal).toBeCloseTo(expectedYearlyPrincipal, 2);
    });
  });
});

describe('calculateTotalInterest', () => {
  it('calculates total interest for 30-year loan', () => {
    // $500k at 6% for 30 years
    const totalInterest = calculateTotalInterest(500000, 6, 30);

    // Total payments: $2,997.75 × 360 = $1,079,190
    // Total interest: $1,079,190 - $500,000 = $579,190
    expect(totalInterest).toBeCloseTo(579190, 0);
  });

  it('returns zero interest for 0% rate', () => {
    const totalInterest = calculateTotalInterest(100000, 0, 30);
    expect(totalInterest).toBeCloseTo(0, 2);
  });

  it('shorter term pays less interest', () => {
    const interest30yr = calculateTotalInterest(400000, 6.5, 30);
    const interest15yr = calculateTotalInterest(400000, 6.5, 15);

    // 15-year should pay significantly less interest
    expect(interest15yr).toBeLessThan(interest30yr);
  });

  it('higher rate pays more interest', () => {
    const interest6pct = calculateTotalInterest(400000, 6, 30);
    const interest8pct = calculateTotalInterest(400000, 8, 30);

    expect(interest8pct).toBeGreaterThan(interest6pct);
  });
});

describe('calculateRemainingBalance', () => {
  it('returns correct balance after 5 years', () => {
    // $400k at 6.5% for 30 years
    const balance = calculateRemainingBalance(400000, 6.5, 30, 5);

    // After 5 years, should have paid down roughly $26k principal
    // Remaining balance should be ~$374k
    expect(balance).toBeCloseTo(374444, 0); // Within $1
    expect(balance).toBeLessThan(400000);
    expect(balance).toBeGreaterThan(360000);
  });

  it('returns zero after full term', () => {
    const balance = calculateRemainingBalance(400000, 6.5, 30, 30);
    expect(balance).toBeCloseTo(0, 2);
  });

  it('returns zero for years beyond term', () => {
    const balance = calculateRemainingBalance(400000, 6.5, 30, 35);
    expect(balance).toBe(0);
  });

  it('balance decreases over time', () => {
    const balance5yr = calculateRemainingBalance(400000, 6.5, 30, 5);
    const balance10yr = calculateRemainingBalance(400000, 6.5, 30, 10);
    const balance15yr = calculateRemainingBalance(400000, 6.5, 30, 15);

    expect(balance10yr).toBeLessThan(balance5yr);
    expect(balance15yr).toBeLessThan(balance10yr);
  });

  it('matches amortization schedule', () => {
    const schedule = generateAmortizationSchedule(400000, 6.5, 30);
    const balanceAt10 = calculateRemainingBalance(400000, 6.5, 30, 10);

    expect(balanceAt10).toBeCloseTo(schedule[9].endingBalance, 2);
  });
});
