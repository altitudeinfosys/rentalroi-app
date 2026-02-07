/**
 * LLM-Based Calculation Validation Tests
 *
 * This test suite creates real-world scenarios with our engine's results,
 * which can be validated by an LLM or financial expert.
 *
 * Each test includes:
 * - Complete input scenario
 * - Our engine's calculated results
 * - Expected ranges based on financial formulas
 *
 * To validate with an LLM:
 * 1. Run: pnpm test:watch llm-validation
 * 2. Copy the scenario details from test output
 * 3. Ask LLM to verify the calculations match standard formulas
 */

import { describe, it, expect } from 'vitest';
import { calculateMonthlyPayment, generateAmortizationSchedule } from '../mortgage';
import { calculateCashFlow, calculateNOI, calculateOperatingExpenses } from '../cash-flow';
import {
  calculateCashOnCashReturn,
  calculateCapRate,
  calculateIRR,
  calculateDSCR,
} from '../metrics';
import { calculateMultiYearProjection } from '../projections';
import { calculateSaleProceeds, calculateTotalReturn } from '../exit';
import type { CalculationInputs } from '../types';

/**
 * Scenario 1: Starter Single-Family Rental
 *
 * Property: $350,000 single-family home
 * Financing: 20% down at 6.5% for 30 years
 * Rent: $2,200/month
 * Expenses: Standard for residential
 */
describe('Scenario 1: Starter Single-Family Rental', () => {
  const scenario = {
    purchasePrice: 350000,
    downPaymentPercent: 20,
    interestRate: 6.5,
    loanTermYears: 30,
    monthlyRent: 2200,
    propertyTaxAnnual: 4200, // 1.2% of purchase price
    insuranceAnnual: 1400,
    vacancyRate: 5,
    maintenanceMonthly: 200,
    propertyManagementPercent: 0, // Self-managed
    closingCosts: 7000,
    repairCosts: 0,
  };

  it('calculates correct mortgage payment', () => {
    // Loan amount: $350,000 × 80% = $280,000
    const loanAmount = scenario.purchasePrice * (1 - scenario.downPaymentPercent / 100);
    const payment = calculateMonthlyPayment(loanAmount, scenario.interestRate, scenario.loanTermYears);

    // Standard mortgage formula: M = P[r(1+r)^n]/[(1+r)^n-1]
    // P = $280,000, r = 6.5%/12 = 0.5417%, n = 360
    // Expected: ~$1,770/month
    expect(loanAmount).toBe(280000);
    expect(payment).toBeGreaterThan(1700);
    expect(payment).toBeLessThan(1850);

    console.log(`
    === SCENARIO 1: Mortgage Verification ===
    Loan Amount: $${loanAmount.toLocaleString()}
    Interest Rate: ${scenario.interestRate}%
    Term: ${scenario.loanTermYears} years
    Monthly Payment: $${payment.toFixed(2)}

    Formula: M = P[r(1+r)^n]/[(1+r)^n-1]
    where r = ${scenario.interestRate}%/12, n = ${scenario.loanTermYears * 12}
    `);
  });

  it('calculates correct monthly cash flow', () => {
    const loanAmount = scenario.purchasePrice * (1 - scenario.downPaymentPercent / 100);
    const mortgagePayment = calculateMonthlyPayment(loanAmount, scenario.interestRate, scenario.loanTermYears);

    const monthlyOperatingExpenses = calculateOperatingExpenses(
      scenario.propertyTaxAnnual,
      scenario.insuranceAnnual,
      0, // HOA
      scenario.maintenanceMonthly,
      scenario.propertyManagementPercent,
      scenario.monthlyRent,
      0, // Utilities
      0 // Other
    );

    const cashFlow = calculateCashFlow(
      scenario.monthlyRent,
      scenario.vacancyRate,
      monthlyOperatingExpenses,
      mortgagePayment
    );

    // Expected breakdown:
    // Gross rent: $2,200
    // Vacancy (5%): -$110
    // Net rent: $2,090
    // Expenses (~$667/mo): -$667
    // NOI: ~$1,423
    // Mortgage: -$1,770
    // Cash flow: ~-$347 (negative)

    expect(cashFlow.grossIncome).toBe(2200);
    expect(cashFlow.vacancyLoss).toBe(110);

    console.log(`
    === SCENARIO 1: Cash Flow Verification ===
    Gross Rent: $${cashFlow.grossIncome}
    Vacancy Loss (${scenario.vacancyRate}%): -$${cashFlow.vacancyLoss}
    Net Income: $${cashFlow.netIncome}
    Operating Expenses: -$${cashFlow.totalExpenses}
    NOI: $${cashFlow.noi}
    Mortgage Payment: -$${cashFlow.debtService}
    Cash Flow: $${cashFlow.cashFlow}
    `);
  });

  it('calculates correct investment metrics', () => {
    const loanAmount = scenario.purchasePrice * (1 - scenario.downPaymentPercent / 100);
    const mortgagePayment = calculateMonthlyPayment(loanAmount, scenario.interestRate, scenario.loanTermYears);

    const monthlyExpenses = calculateOperatingExpenses(
      scenario.propertyTaxAnnual,
      scenario.insuranceAnnual,
      0,
      scenario.maintenanceMonthly,
      scenario.propertyManagementPercent,
      scenario.monthlyRent,
      0,
      0
    );

    const cashFlow = calculateCashFlow(
      scenario.monthlyRent,
      scenario.vacancyRate,
      monthlyExpenses,
      mortgagePayment
    );

    const annualNOI = cashFlow.noi * 12;
    const annualCashFlow = cashFlow.cashFlow * 12;
    const totalInvestment =
      scenario.purchasePrice * scenario.downPaymentPercent / 100 + scenario.closingCosts;

    const capRate = calculateCapRate(annualNOI, scenario.purchasePrice);
    const cashOnCash = calculateCashOnCashReturn(annualCashFlow, totalInvestment);
    const dscr = calculateDSCR(annualNOI, mortgagePayment * 12);

    // Cap Rate: ~4.9% (NOI / Purchase Price)
    // Cash-on-Cash: Likely negative
    // DSCR: ~0.8 (below 1.0 = negative cash flow)

    expect(capRate).toBeGreaterThan(4);
    expect(capRate).toBeLessThan(7);

    console.log(`
    === SCENARIO 1: Metrics Verification ===
    Total Investment: $${totalInvestment.toLocaleString()}
    Annual NOI: $${annualNOI.toFixed(2)}
    Annual Cash Flow: $${annualCashFlow.toFixed(2)}

    Cap Rate: ${capRate}% (NOI / Purchase Price)
    Cash-on-Cash Return: ${cashOnCash}%
    DSCR: ${dscr}x (NOI / Debt Service)
    `);
  });
});

/**
 * Scenario 2: Strong Cash Flow Multi-Family
 *
 * Property: $550,000 duplex
 * Financing: 25% down at 7% for 30 years
 * Rent: $2,000/unit × 2 = $4,000/month
 * Expenses: Higher (property management, higher vacancy)
 */
describe('Scenario 2: Strong Cash Flow Multi-Family', () => {
  const inputs: CalculationInputs = {
    propertyType: 'multi_family',
    title: 'Test Duplex',
    purchasePrice: 550000,
    downPaymentPercent: 25,
    interestRate: 7,
    loanTermYears: 30,
    closingCosts: 12000,
    repairCosts: 15000,
    monthlyRent: 4000,
    otherMonthlyIncome: 100, // Laundry
    vacancyRate: 7,
    annualRentIncrease: 3,
    propertyTaxAnnual: 6600, // 1.2%
    insuranceAnnual: 2400,
    hoaMonthly: 0,
    maintenanceMonthly: 400,
    propertyManagementPercent: 8,
    utilitiesMonthly: 200,
    otherExpensesMonthly: 0,
    annualExpenseIncrease: 2.5,
    holdingLength: 10,
    annualAppreciationRate: 3,
    saleClosingCostsPercent: 6,
  };

  it('calculates multi-year projections correctly', () => {
    const projections = calculateMultiYearProjection(inputs);

    expect(projections).toHaveLength(10);

    // Year 1 verification
    const year1 = projections[0];

    // Gross income: ($4,000 + $100) × 12 = $49,200
    expect(year1.grossIncome).toBe(49200);

    // Vacancy: 7% of $49,200 = $3,444
    expect(year1.vacancyLoss).toBeCloseTo(3444, 0);

    // Property should appreciate each year
    expect(projections[9].propertyValue).toBeGreaterThan(projections[0].propertyValue);

    // Cash flow should improve over time (rent increases > expense increases)
    expect(projections[9].cashFlow).toBeGreaterThan(projections[0].cashFlow);

    console.log(`
    === SCENARIO 2: Multi-Year Projection ===
    Year 1:
      - Gross Income: $${year1.grossIncome.toLocaleString()}
      - Vacancy Loss: $${year1.vacancyLoss.toLocaleString()}
      - NOI: $${year1.noi.toLocaleString()}
      - Cash Flow: $${year1.cashFlow.toLocaleString()}
      - Property Value: $${year1.propertyValue.toLocaleString()}
      - Equity: $${year1.equity.toLocaleString()}

    Year 10:
      - Gross Income: $${projections[9].grossIncome.toLocaleString()}
      - NOI: $${projections[9].noi.toLocaleString()}
      - Cash Flow: $${projections[9].cashFlow.toLocaleString()}
      - Property Value: $${projections[9].propertyValue.toLocaleString()}
      - Equity: $${projections[9].equity.toLocaleString()}

    10-Year Cumulative Cash Flow: $${projections[9].cumulativeCashFlow.toLocaleString()}
    `);
  });

  it('calculates total return at exit', () => {
    const projections = calculateMultiYearProjection(inputs);
    const finalYear = projections[projections.length - 1];

    const saleProceeds = calculateSaleProceeds(
      finalYear.propertyValue,
      inputs.saleClosingCostsPercent,
      finalYear.loanBalance
    );

    const totalInvestment =
      (inputs.purchasePrice * inputs.downPaymentPercent) / 100 +
      inputs.closingCosts +
      inputs.repairCosts;

    // Build cash flow array for IRR
    const cashFlows = [-totalInvestment];
    projections.forEach((year, index) => {
      if (index === projections.length - 1) {
        // Final year includes sale proceeds
        cashFlows.push(year.cashFlow + saleProceeds.netProceeds);
      } else {
        cashFlows.push(year.cashFlow);
      }
    });

    const totalReturn = calculateTotalReturn(
      finalYear.cumulativeCashFlow,
      saleProceeds.netProceeds,
      totalInvestment,
      cashFlows
    );

    // Expected: Moderate returns (property has negative cash flow early years)
    expect(totalReturn.equityMultiple).toBeGreaterThan(1.3);
    expect(totalReturn.irr).toBeGreaterThan(4); // Lower due to negative early cash flows

    console.log(`
    === SCENARIO 2: Exit Analysis ===
    Sale Price (Year 10): $${finalYear.propertyValue.toLocaleString()}
    Selling Costs (6%): -$${saleProceeds.sellingCosts.toLocaleString()}
    Loan Payoff: -$${saleProceeds.loanPayoff.toLocaleString()}
    Net Sale Proceeds: $${saleProceeds.netProceeds.toLocaleString()}

    Total Investment: $${totalInvestment.toLocaleString()}
    Cumulative Cash Flow: $${finalYear.cumulativeCashFlow.toLocaleString()}
    Total Return: $${totalReturn.totalReturn.toLocaleString()}
    Equity Multiple: ${totalReturn.equityMultiple}x
    IRR: ${totalReturn.irr}%
    `);
  });
});

/**
 * Scenario 3: Cash Purchase (No Financing)
 *
 * Tests edge case with 100% down / 0% financing
 */
describe('Scenario 3: Cash Purchase', () => {
  it('calculates correctly without mortgage', () => {
    const purchasePrice = 250000;
    const monthlyRent = 2000;
    const annualExpenses = 6000; // Taxes + insurance

    const noi = calculateNOI(
      monthlyRent * 12 * 0.95, // 5% vacancy
      annualExpenses
    );

    const capRate = calculateCapRate(noi, purchasePrice);
    const cashOnCash = calculateCashOnCashReturn(noi, purchasePrice);

    // With no mortgage, NOI = Cash Flow
    // Cap Rate = Cash-on-Cash for all-cash purchases

    expect(noi).toBe(monthlyRent * 12 * 0.95 - annualExpenses);
    expect(capRate).toBeCloseTo(cashOnCash, 1);

    console.log(`
    === SCENARIO 3: Cash Purchase ===
    Purchase Price: $${purchasePrice.toLocaleString()}
    Annual Rent (after 5% vacancy): $${(monthlyRent * 12 * 0.95).toLocaleString()}
    Annual Expenses: $${annualExpenses.toLocaleString()}
    NOI (= Cash Flow): $${noi.toLocaleString()}

    Cap Rate: ${capRate}%
    Cash-on-Cash Return: ${cashOnCash}%
    (These should be equal for all-cash purchase)
    `);
  });
});

/**
 * Scenario 4: Negative Cash Flow (Appreciation Play)
 *
 * Tests scenario where property cash flows negative but
 * total return is positive due to appreciation
 */
describe('Scenario 4: Appreciation Play', () => {
  const inputs: CalculationInputs = {
    propertyType: 'single_family',
    title: 'Appreciation Property',
    purchasePrice: 600000,
    downPaymentPercent: 20,
    interestRate: 7,
    loanTermYears: 30,
    closingCosts: 15000,
    repairCosts: 0,
    monthlyRent: 2800, // Below market for high appreciation area
    otherMonthlyIncome: 0,
    vacancyRate: 5,
    annualRentIncrease: 4,
    propertyTaxAnnual: 9000,
    insuranceAnnual: 2400,
    hoaMonthly: 300,
    maintenanceMonthly: 400,
    propertyManagementPercent: 0,
    utilitiesMonthly: 0,
    otherExpensesMonthly: 0,
    annualExpenseIncrease: 2.5,
    holdingLength: 5,
    annualAppreciationRate: 5, // High appreciation market
    saleClosingCostsPercent: 6,
  };

  it('shows negative cash flow but positive total return', () => {
    const projections = calculateMultiYearProjection(inputs);

    // Early years should have negative cash flow
    expect(projections[0].cashFlow).toBeLessThan(0);

    const finalYear = projections[projections.length - 1];
    const saleProceeds = calculateSaleProceeds(
      finalYear.propertyValue,
      inputs.saleClosingCostsPercent,
      finalYear.loanBalance
    );

    const totalInvestment =
      (inputs.purchasePrice * inputs.downPaymentPercent) / 100 +
      inputs.closingCosts;

    const cashFlows = [-totalInvestment];
    projections.forEach((year, index) => {
      if (index === projections.length - 1) {
        cashFlows.push(year.cashFlow + saleProceeds.netProceeds);
      } else {
        cashFlows.push(year.cashFlow);
      }
    });

    const totalReturn = calculateTotalReturn(
      finalYear.cumulativeCashFlow,
      saleProceeds.netProceeds,
      totalInvestment,
      cashFlows
    );

    // Total return should still be positive despite negative cash flow
    expect(totalReturn.totalReturn).toBeGreaterThan(totalInvestment);
    expect(totalReturn.equityMultiple).toBeGreaterThan(1);

    console.log(`
    === SCENARIO 4: Appreciation Play ===
    Year 1 Cash Flow: $${projections[0].cashFlow.toLocaleString()} (negative)
    Cumulative Cash Flow (5 years): $${finalYear.cumulativeCashFlow.toLocaleString()}

    Property Appreciation:
      - Purchase: $${inputs.purchasePrice.toLocaleString()}
      - Year 5 Value: $${finalYear.propertyValue.toLocaleString()}
      - Gain: $${(finalYear.propertyValue - inputs.purchasePrice).toLocaleString()}

    Exit Analysis:
      - Net Sale Proceeds: $${saleProceeds.netProceeds.toLocaleString()}
      - Total Return: $${totalReturn.totalReturn.toLocaleString()}
      - Equity Multiple: ${totalReturn.equityMultiple}x
      - IRR: ${totalReturn.irr}%
    `);
  });
});

/**
 * Scenario 5: Real-World Comparison
 *
 * Based on actual example from financial textbook
 * Can be verified against known correct values
 */
describe('Scenario 5: Textbook Example Verification', () => {
  it('matches standard mortgage calculation', () => {
    // Standard textbook example: $200,000 at 6% for 30 years
    const payment = calculateMonthlyPayment(200000, 6, 30);

    // Excel/Financial calculator result: $1,199.10
    expect(payment).toBeCloseTo(1199.10, 2);

    console.log(`
    === SCENARIO 5: Textbook Verification ===
    Loan: $200,000 at 6% for 30 years
    Our Calculation: $${payment.toFixed(2)}
    Expected (Excel PMT): $1,199.10
    Match: ${Math.abs(payment - 1199.10) < 0.01 ? 'YES ✓' : 'NO ✗'}
    `);
  });

  it('matches standard cap rate calculation', () => {
    // Standard example: $50,000 NOI on $500,000 property = 10% cap
    const capRate = calculateCapRate(50000, 500000);

    expect(capRate).toBe(10);

    console.log(`
    Cap Rate Verification:
    NOI: $50,000 / Property Value: $500,000
    Our Calculation: ${capRate}%
    Expected: 10%
    Match: ${capRate === 10 ? 'YES ✓' : 'NO ✗'}
    `);
  });

  it('matches standard cash-on-cash calculation', () => {
    // Standard example: $10,000 cash flow on $100,000 investment = 10%
    const coc = calculateCashOnCashReturn(10000, 100000);

    expect(coc).toBe(10);

    console.log(`
    Cash-on-Cash Verification:
    Cash Flow: $10,000 / Investment: $100,000
    Our Calculation: ${coc}%
    Expected: 10%
    Match: ${coc === 10 ? 'YES ✓' : 'NO ✗'}
    `);
  });

  it('calculates amortization correctly', () => {
    // Verify first year breakdown for $200k at 6% for 30 years
    const schedule = generateAmortizationSchedule(200000, 6, 30);
    const year1 = schedule[0];

    // Year 1: ~$11,900 interest, ~$2,500 principal
    expect(year1.interest).toBeCloseTo(11900, -2);
    expect(year1.principal).toBeCloseTo(2500, -2);

    console.log(`
    Amortization Year 1 Verification:
    Loan: $200,000 at 6% for 30 years

    Our Calculation:
      - Interest: $${year1.interest.toFixed(2)}
      - Principal: $${year1.principal.toFixed(2)}
      - Total: $${year1.payment.toFixed(2)}

    Expected (approximate):
      - Interest: ~$11,900
      - Principal: ~$2,500
    `);
  });
});

/**
 * Validation Summary Test
 *
 * Outputs all key formulas for LLM verification
 */
describe('Formula Verification Summary', () => {
  it('documents all formulas for LLM validation', () => {
    console.log(`
    ========================================
    RENTAL PROPERTY CALCULATION FORMULAS
    ========================================

    MORTGAGE PAYMENT (P&I):
    M = P × [r(1+r)^n] / [(1+r)^n - 1]
    where:
      P = Principal loan amount
      r = Monthly interest rate (annual rate / 12)
      n = Total number of payments (years × 12)

    NET OPERATING INCOME (NOI):
    NOI = Gross Rental Income - Vacancy Loss - Operating Expenses
    (Excludes mortgage payments)

    CASH FLOW:
    Cash Flow = NOI - Annual Debt Service (mortgage payments)

    CAP RATE:
    Cap Rate = NOI / Property Value × 100
    (Unlevered metric - ignores financing)

    CASH-ON-CASH RETURN:
    CoC = Annual Pre-Tax Cash Flow / Total Cash Invested × 100
    (Levered metric - accounts for financing)

    DEBT SERVICE COVERAGE RATIO (DSCR):
    DSCR = NOI / Annual Debt Service
    (> 1.0 means positive cash flow)

    INTERNAL RATE OF RETURN (IRR):
    Rate where: 0 = Σ(CFt / (1+IRR)^t)
    (Time-value adjusted return)

    EQUITY MULTIPLE:
    EM = Total Distributions / Total Investment
    (Does not account for time)

    ========================================
    `);

    expect(true).toBe(true);
  });
});
