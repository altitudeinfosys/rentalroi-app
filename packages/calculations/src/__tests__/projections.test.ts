/**
 * Multi-year projection tests
 *
 * Tests verify:
 * - Compounding rent increases
 * - Compounding expense increases
 * - Loan balance amortization
 * - Property appreciation
 * - Equity accumulation
 */

import { describe, it, expect } from 'vitest';
import { calculateMultiYearProjection } from '../projections';
import type { CalculationInputs } from '../types';

// Base test inputs
const baseInputs: CalculationInputs = {
  propertyType: 'single_family',
  title: 'Test Property',
  purchasePrice: 500000,
  downPaymentPercent: 20,
  interestRate: 6.5,
  loanTermYears: 30,
  closingCosts: 10000,
  repairCosts: 5000,
  monthlyRent: 3500,
  otherMonthlyIncome: 0,
  vacancyRate: 5,
  annualRentIncrease: 3,
  propertyTaxAnnual: 6000,
  insuranceAnnual: 1200,
  hoaMonthly: 0,
  maintenanceMonthly: 300,
  propertyManagementPercent: 8,
  utilitiesMonthly: 0,
  otherExpensesMonthly: 0,
  annualExpenseIncrease: 2.5,
  holdingLength: 10,
  annualAppreciationRate: 3,
  saleClosingCostsPercent: 6,
};

describe('calculateMultiYearProjection', () => {
  describe('Basic projection structure', () => {
    it('returns correct number of years', () => {
      const projections = calculateMultiYearProjection(baseInputs);
      expect(projections).toHaveLength(10);
    });

    it('numbers years correctly from 1 to holdingLength', () => {
      const projections = calculateMultiYearProjection(baseInputs);
      projections.forEach((year, index) => {
        expect(year.year).toBe(index + 1);
      });
    });

    it('works with single year projection', () => {
      const inputs = { ...baseInputs, holdingLength: 1 };
      const projections = calculateMultiYearProjection(inputs);
      expect(projections).toHaveLength(1);
      expect(projections[0].year).toBe(1);
    });
  });

  describe('Compounding rent increases', () => {
    it('applies 3% annual rent increase correctly', () => {
      const projections = calculateMultiYearProjection(baseInputs);

      // Year 1: Base rent = $3,500/month = $42,000/year
      const year1GrossIncome = 3500 * 12;
      expect(projections[0].grossIncome).toBeCloseTo(year1GrossIncome, 2);

      // Year 2: $3,500 × 1.03 = $3,605/month = $43,260/year
      const year2GrossIncome = 3500 * 1.03 * 12;
      expect(projections[1].grossIncome).toBeCloseTo(year2GrossIncome, 2);

      // Year 3: $3,500 × 1.03² = $3,713.15/month = $44,557.80/year
      const year3GrossIncome = 3500 * Math.pow(1.03, 2) * 12;
      expect(projections[2].grossIncome).toBeCloseTo(year3GrossIncome, 2);

      // Year 10: $3,500 × 1.03⁹ = $4,567.39/month = $54,808.66/year
      const year10GrossIncome = 3500 * Math.pow(1.03, 9) * 12;
      expect(projections[9].grossIncome).toBeCloseTo(year10GrossIncome, 2);
    });

    it('handles zero rent increase', () => {
      const inputs = { ...baseInputs, annualRentIncrease: 0 };
      const projections = calculateMultiYearProjection(inputs);

      // All years should have same gross income
      const baseGrossIncome = 3500 * 12;
      projections.forEach((year) => {
        expect(year.grossIncome).toBeCloseTo(baseGrossIncome, 2);
      });
    });

    it('applies rent increase to otherMonthlyIncome', () => {
      const inputs = { ...baseInputs, otherMonthlyIncome: 500 };
      const projections = calculateMultiYearProjection(inputs);

      // Year 1: ($3,500 + $500) × 12 = $48,000
      expect(projections[0].grossIncome).toBeCloseTo(4000 * 12, 2);

      // Year 2: ($3,500 + $500) × 1.03 × 12 = $49,440
      expect(projections[1].grossIncome).toBeCloseTo(4000 * 1.03 * 12, 2);
    });
  });

  describe('Compounding expense increases', () => {
    it('applies 2.5% annual expense increase to property tax', () => {
      const projections = calculateMultiYearProjection(baseInputs);

      // Year 1: $6,000
      expect(projections[0].propertyTax).toBeCloseTo(6000, 2);

      // Year 2: $6,000 × 1.025 = $6,150
      expect(projections[1].propertyTax).toBeCloseTo(6000 * 1.025, 2);

      // Year 10: $6,000 × 1.025⁹ = $7,531.07
      expect(projections[9].propertyTax).toBeCloseTo(6000 * Math.pow(1.025, 9), 2);
    });

    it('applies expense increase to all expense categories', () => {
      const inputs = {
        ...baseInputs,
        hoaMonthly: 100,
        utilitiesMonthly: 150,
        otherExpensesMonthly: 50,
      };
      const projections = calculateMultiYearProjection(inputs);

      // Year 1
      expect(projections[0].hoa).toBeCloseTo(100 * 12, 2);
      expect(projections[0].utilities).toBeCloseTo(150 * 12, 2);
      expect(projections[0].otherExpenses).toBeCloseTo(50 * 12, 2);

      // Year 3: Apply 2.5% compound increase for 2 years
      const multiplier = Math.pow(1.025, 2);
      expect(projections[2].hoa).toBeCloseTo(100 * 12 * multiplier, 2);
      expect(projections[2].utilities).toBeCloseTo(150 * 12 * multiplier, 2);
      expect(projections[2].otherExpenses).toBeCloseTo(50 * 12 * multiplier, 2);
    });

    it('handles zero expense increase', () => {
      const inputs = { ...baseInputs, annualExpenseIncrease: 0 };
      const projections = calculateMultiYearProjection(inputs);

      // Property tax should stay constant
      projections.forEach((year) => {
        expect(year.propertyTax).toBeCloseTo(6000, 2);
      });
    });

    it('updates management fee based on increasing rent', () => {
      const projections = calculateMultiYearProjection(baseInputs);

      // Management is 8% of gross income
      // Year 1: $42,000 × 8% = $3,360
      expect(projections[0].management).toBeCloseTo(42000 * 0.08, 2);

      // Year 2: Rent increases to $43,260, so management = $43,260 × 8% = $3,460.80
      const year2GrossIncome = 3500 * 1.03 * 12;
      expect(projections[1].management).toBeCloseTo(year2GrossIncome * 0.08, 2);
    });
  });

  describe('Loan balance amortization', () => {
    it('decreases loan balance each year', () => {
      const projections = calculateMultiYearProjection(baseInputs);

      // Loan balance should decrease each year
      for (let i = 1; i < projections.length; i++) {
        expect(projections[i].loanBalance).toBeLessThan(
          projections[i - 1].loanBalance
        );
      }
    });

    it('has correct initial loan balance', () => {
      const projections = calculateMultiYearProjection(baseInputs);

      // Initial loan = $500,000 × 80% = $400,000
      // Year 1 ending balance should be less than initial
      expect(projections[0].loanBalance).toBeLessThan(400000);
      expect(projections[0].loanBalance).toBeGreaterThan(390000);
    });

    it('principal paid increases over time', () => {
      const projections = calculateMultiYearProjection(baseInputs);

      // In amortization, principal paid increases each year
      // Year 10 principal should be > Year 1 principal
      expect(projections[9].principalPaid).toBeGreaterThan(
        projections[0].principalPaid
      );
    });

    it('interest paid decreases over time', () => {
      const projections = calculateMultiYearProjection(baseInputs);

      // In amortization, interest paid decreases each year
      // Year 10 interest should be < Year 1 interest
      expect(projections[9].interestPaid).toBeLessThan(
        projections[0].interestPaid
      );
    });

    it('mortgage payment stays constant', () => {
      const projections = calculateMultiYearProjection(baseInputs);

      // Fixed-rate mortgage payment should be same every year
      const payment = projections[0].mortgagePayment;
      projections.forEach((year) => {
        expect(year.mortgagePayment).toBeCloseTo(payment, 2);
      });
    });

    it('principal + interest equals mortgage payment', () => {
      const projections = calculateMultiYearProjection(baseInputs);

      projections.forEach((year) => {
        const sum = year.principalPaid + year.interestPaid;
        expect(sum).toBeCloseTo(year.mortgagePayment, 2);
      });
    });
  });

  describe('Property appreciation', () => {
    it('applies 3% annual appreciation correctly', () => {
      const projections = calculateMultiYearProjection(baseInputs);

      // Year 1: $500,000 × 1.03 = $515,000
      expect(projections[0].propertyValue).toBeCloseTo(500000 * 1.03, 2);

      // Year 2: $500,000 × 1.03² = $530,450
      expect(projections[1].propertyValue).toBeCloseTo(
        500000 * Math.pow(1.03, 2),
        2
      );

      // Year 10: $500,000 × 1.03¹⁰ = $671,958.09
      expect(projections[9].propertyValue).toBeCloseTo(
        500000 * Math.pow(1.03, 10),
        2
      );
    });

    it('handles zero appreciation', () => {
      const inputs = { ...baseInputs, annualAppreciationRate: 0 };
      const projections = calculateMultiYearProjection(inputs);

      // Property value should stay at purchase price
      projections.forEach((year) => {
        expect(year.propertyValue).toBeCloseTo(500000, 2);
      });
    });

    it('handles negative appreciation (depreciation)', () => {
      const inputs = { ...baseInputs, annualAppreciationRate: -2 };
      const projections = calculateMultiYearProjection(inputs);

      // Year 1: $500,000 × 0.98 = $490,000
      expect(projections[0].propertyValue).toBeCloseTo(500000 * 0.98, 2);

      // Year 5: $500,000 × 0.98⁵ = $461,683.65
      expect(projections[4].propertyValue).toBeCloseTo(
        500000 * Math.pow(0.98, 5),
        2
      );
    });
  });

  describe('Equity accumulation', () => {
    it('calculates equity as property value minus loan balance', () => {
      const projections = calculateMultiYearProjection(baseInputs);

      projections.forEach((year) => {
        const expectedEquity = year.propertyValue - year.loanBalance;
        expect(year.equity).toBeCloseTo(expectedEquity, 2);
      });
    });

    it('equity increases over time', () => {
      const projections = calculateMultiYearProjection(baseInputs);

      // Equity should increase each year (appreciation + principal paydown)
      for (let i = 1; i < projections.length; i++) {
        expect(projections[i].equity).toBeGreaterThan(projections[i - 1].equity);
      }
    });

    it('initial equity approximately equals down payment', () => {
      const projections = calculateMultiYearProjection(baseInputs);

      // Down payment = $500,000 × 20% = $100,000
      // Year 1 equity = appreciated value - loan balance after year 1
      // Should be approximately down payment + appreciation + principal paid
      const downPayment = 500000 * 0.2;
      const year1Equity = projections[0].equity;

      // Year 1 equity should be greater than down payment
      // (due to appreciation and principal paydown)
      expect(year1Equity).toBeGreaterThan(downPayment);
      expect(year1Equity).toBeCloseTo(downPayment + 15000 + 5000, -4); // Rough estimate
    });
  });

  describe('Cash flow calculations', () => {
    it('calculates NOI correctly', () => {
      const projections = calculateMultiYearProjection(baseInputs);

      projections.forEach((year) => {
        const expectedNOI = year.netIncome - year.totalExpenses;
        expect(year.noi).toBeCloseTo(expectedNOI, 1);
      });
    });

    it('calculates cash flow as NOI minus mortgage payment', () => {
      const projections = calculateMultiYearProjection(baseInputs);

      projections.forEach((year) => {
        const expectedCashFlow = year.noi - year.mortgagePayment;
        expect(year.cashFlow).toBeCloseTo(expectedCashFlow, 2);
      });
    });

    it('tracks cumulative cash flow correctly', () => {
      const projections = calculateMultiYearProjection(baseInputs);

      let expectedCumulative = 0;
      projections.forEach((year) => {
        expectedCumulative += year.cashFlow;
        expect(year.cumulativeCashFlow).toBeCloseTo(expectedCumulative, 1);
      });
    });

    it('cash flow improves over time with rent increases', () => {
      const projections = calculateMultiYearProjection(baseInputs);

      // With rent increasing faster than expenses, cash flow should improve
      // (assuming positive cash flow to start)
      if (projections[0].cashFlow > 0) {
        expect(projections[9].cashFlow).toBeGreaterThan(projections[0].cashFlow);
      }
    });
  });

  describe('Investment metrics', () => {
    it('calculates cash-on-cash return', () => {
      const projections = calculateMultiYearProjection(baseInputs);

      // Total investment = $100,000 down + $10,000 closing + $5,000 repairs = $115,000
      const totalInvestment = 115000;

      projections.forEach((year) => {
        const expectedCoCReturn = (year.cashFlow / totalInvestment) * 100;
        expect(year.cashOnCashReturn).toBeCloseTo(expectedCoCReturn, 2);
      });
    });

    it('calculates cap rate', () => {
      const projections = calculateMultiYearProjection(baseInputs);

      projections.forEach((year) => {
        const expectedCapRate = (year.noi / year.propertyValue) * 100;
        expect(year.capRate).toBeCloseTo(expectedCapRate, 2);
      });
    });

    it('calculates DSCR', () => {
      const projections = calculateMultiYearProjection(baseInputs);

      projections.forEach((year) => {
        const expectedDSCR = year.noi / year.mortgagePayment;
        expect(year.dscr).toBeCloseTo(expectedDSCR, 2);
      });
    });
  });

  describe('Vacancy calculation', () => {
    it('applies vacancy rate to gross income', () => {
      const projections = calculateMultiYearProjection(baseInputs);

      projections.forEach((year) => {
        const expectedVacancyLoss = (year.grossIncome * 5) / 100;
        expect(year.vacancyLoss).toBeCloseTo(expectedVacancyLoss, 2);
      });
    });

    it('net income equals gross income minus vacancy', () => {
      const projections = calculateMultiYearProjection(baseInputs);

      projections.forEach((year) => {
        const expectedNetIncome = year.grossIncome - year.vacancyLoss;
        expect(year.netIncome).toBeCloseTo(expectedNetIncome, 1);
      });
    });
  });

  describe('Edge cases', () => {
    it('handles zero down payment (100% financing)', () => {
      const inputs = { ...baseInputs, downPaymentPercent: 0 };
      const projections = calculateMultiYearProjection(inputs);

      expect(projections).toHaveLength(10);
      // Initial loan balance should equal purchase price
      expect(projections[0].loanBalance).toBeCloseTo(
        500000 - projections[0].principalPaid,
        2
      );
    });

    it('handles high down payment (90%)', () => {
      const inputs = { ...baseInputs, downPaymentPercent: 90 };
      const projections = calculateMultiYearProjection(inputs);

      expect(projections).toHaveLength(10);
      // Small loan amount
      const loanAmount = 500000 * 0.1;
      expect(projections[0].loanBalance).toBeLessThan(loanAmount);
    });

    it('handles very short loan term', () => {
      const inputs = { ...baseInputs, loanTermYears: 15, holdingLength: 5 };
      const projections = calculateMultiYearProjection(inputs);

      expect(projections).toHaveLength(5);
      // Higher principal payments with shorter term
      expect(projections[0].principalPaid).toBeGreaterThan(10000);
    });

    it('handles long holding period', () => {
      const inputs = { ...baseInputs, holdingLength: 30 };
      const projections = calculateMultiYearProjection(inputs);

      expect(projections).toHaveLength(30);
      // Loan should be paid off by year 30
      expect(projections[29].loanBalance).toBeCloseTo(0, 0);
    });
  });

  describe('Total expense calculation', () => {
    it('sums all expense categories correctly', () => {
      const inputs = {
        ...baseInputs,
        hoaMonthly: 100,
        utilitiesMonthly: 150,
        otherExpensesMonthly: 50,
      };
      const projections = calculateMultiYearProjection(inputs);

      projections.forEach((year) => {
        const sum =
          year.propertyTax +
          year.insurance +
          year.hoa +
          year.maintenance +
          year.management +
          year.utilities +
          year.otherExpenses;

        expect(year.totalExpenses).toBeCloseTo(sum, 1);
      });
    });
  });
});
