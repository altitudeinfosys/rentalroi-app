'use client';

import React, { useState, useMemo } from 'react';
import { useFormContext } from 'react-hook-form';
import { useSearchParams } from 'next/navigation';
import { CalculationInputs } from '@repo/calculations';
import {
  calculateMonthlyPayment,
  calculateCashFlow,
  calculateCashOnCashReturn,
  calculateCapRate,
  calculateDSCR,
  calculateGRM,
  calculateMultiYearProjection,
  calculateSaleProceeds,
  calculateTotalReturn,
  generateAmortizationSchedule,
} from '@repo/calculations';
import { MetricsCard, MetricsGrid } from './metrics-card';
import { ResultsChart, CHART_COLORS, formatPercentage } from './results-chart';
import { ResultsTable } from './results-table';
import { SaveCalculationButton } from './save-calculation-button';
import { ShareButton } from './share-button';
import { ToastContainer } from '@/components/ui/toast';
import { useToast } from '@/lib/hooks/use-toast';
import type { CalculatorFormData } from '@/lib/validation/calculator-schema';
import type { ComputedResults } from '@/lib/mappers/calculation-mapper';

type TabId = 'first-year' | 'multi-year' | 'metrics' | 'assumptions' | 'amortization';

interface Tab {
  id: TabId;
  label: string;
  icon: string;
}

const TABS: Tab[] = [
  { id: 'first-year', label: 'First Year', icon: '📊' },
  { id: 'multi-year', label: 'Projections', icon: '📈' },
  { id: 'metrics', label: 'Metrics', icon: '🎯' },
  { id: 'assumptions', label: 'Summary', icon: '📋' },
  { id: 'amortization', label: 'Amortization', icon: '💰' },
];

/**
 * Step 5: Results Component
 *
 * Displays comprehensive calculation results across 4 tabs
 */
export function Step5Results() {
  const [activeTab, setActiveTab] = useState<TabId>('first-year');
  const { watch } = useFormContext<CalculationInputs>();
  const searchParams = useSearchParams();
  const calculationId = searchParams.get('id');
  const { toasts, removeToast, success, error } = useToast();

  // Get all form values
  const values = watch();

  // Calculate all results
  const results = useMemo(() => {
    // Mortgage calculation
    const loanAmount = values.purchasePrice * (1 - values.downPaymentPercent / 100);
    const monthlyPayment = calculateMonthlyPayment(
      loanAmount,
      values.interestRate,
      values.loanTermYears
    );

    // Property management: use dollar value if in dollar mode, otherwise calculate from percent
    const propertyManagementFee = (values as any).propertyManagementMode === 'dollar'
      ? ((values as any).propertyManagementMonthly || 0)
      : (values.monthlyRent * values.propertyManagementPercent / 100);

    // Operating expenses (monthly)
    const monthlyOperatingExpenses =
      values.propertyTaxAnnual / 12 +
      values.insuranceAnnual / 12 +
      values.hoaMonthly +
      values.maintenanceMonthly +
      propertyManagementFee +
      values.utilitiesMonthly +
      values.otherExpensesMonthly;

    // Cash flow
    const cashFlow = calculateCashFlow(
      values.monthlyRent,
      values.vacancyRate,
      monthlyOperatingExpenses,
      monthlyPayment
    );

    // Investment metrics
    const downPayment = values.purchasePrice * (values.downPaymentPercent / 100);
    const closingCosts = values.closingCosts;
    const repairCosts = values.repairCosts;
    const totalInvestment = downPayment + closingCosts + repairCosts;

    // Calculate individual metrics
    const annualCashFlow = cashFlow.cashFlow * 12;
    const annualNOI = cashFlow.noi * 12;
    const annualDebtService = monthlyPayment * 12;
    const annualRent = values.monthlyRent * 12;

    const metrics = {
      cashOnCashReturn: calculateCashOnCashReturn(annualCashFlow, totalInvestment),
      capRate: calculateCapRate(annualNOI, values.purchasePrice),
      dscr: calculateDSCR(annualNOI, annualDebtService),
      grm: calculateGRM(values.purchasePrice, annualRent),
    };

    // Multi-year projections
    const projections = calculateMultiYearProjection(values);

    // Exit scenario
    const finalProjection = projections[projections.length - 1];
    const saleProceeds = calculateSaleProceeds(
      finalProjection.propertyValue,
      values.saleClosingCostsPercent,
      finalProjection.loanBalance
    );

    // Calculate cumulative cash flow
    const cumulativeCashFlow = projections.reduce((sum, p) => sum + p.cashFlow, 0);

    // Build cash flows array for IRR: initial investment (negative), then annual cash flows
    const cashFlows = [-totalInvestment, ...projections.map((p) => p.cashFlow)];
    // Add sale proceeds to final year
    cashFlows[cashFlows.length - 1] += saleProceeds.netProceeds;

    const totalReturn = calculateTotalReturn(
      cumulativeCashFlow,
      saleProceeds.netProceeds,
      totalInvestment,
      cashFlows
    );

    // Generate amortization schedule
    const amortizationSchedule = generateAmortizationSchedule(
      loanAmount,
      values.interestRate,
      values.loanTermYears
    );

    return {
      loanAmount,
      downPayment,
      closingCosts,
      repairCosts,
      totalInvestment,
      monthlyPayment,
      monthlyOperatingExpenses,
      cashFlow,
      metrics,
      projections,
      saleProceeds,
      totalReturn,
      amortizationSchedule,
    };
  }, [values]);

  // Prepare computed results for saving
  const computedResults: ComputedResults = useMemo(() => ({
    totalInvestment: results.totalInvestment,
    monthlyMortgagePayment: results.monthlyPayment,
    monthlyGrossIncome: results.cashFlow.grossIncome,
    monthlyExpenses: results.monthlyOperatingExpenses,
    monthlyCashFlow: results.cashFlow.cashFlow,
    annualCashFlow: results.cashFlow.cashFlow * 12,
    cashOnCashReturn: results.metrics.cashOnCashReturn,
    capRate: results.metrics.capRate,
  }), [results]);

  // Map CalculationInputs to CalculatorFormData for saving
  const formDataForSave: CalculatorFormData = useMemo(() => ({
    propertyType: values.propertyType || 'single_family',
    title: values.title || 'Untitled Property',
    address: values.address,
    city: values.city,
    state: values.state,
    zipCode: values.zipCode,
    bedrooms: values.bedrooms,
    bathrooms: values.bathrooms,
    squareFeet: values.squareFeet,
    purchasePrice: values.purchasePrice,
    downPaymentPercent: values.downPaymentPercent,
    closingCosts: values.closingCosts,
    repairCosts: values.repairCosts,
    interestRate: values.interestRate,
    loanTermYears: values.loanTermYears,
    monthlyRent: values.monthlyRent,
    otherMonthlyIncome: values.otherMonthlyIncome,
    vacancyRate: values.vacancyRate,
    annualRentIncrease: values.annualRentIncrease,
    propertyTaxAnnual: values.propertyTaxAnnual,
    insuranceAnnual: values.insuranceAnnual,
    hoaMonthly: values.hoaMonthly,
    maintenanceMonthly: values.maintenanceMonthly,
    propertyManagementPercent: values.propertyManagementPercent,
    utilitiesMonthly: values.utilitiesMonthly,
    otherExpensesMonthly: values.otherExpensesMonthly,
    annualExpenseIncrease: values.annualExpenseIncrease,
    holdingLength: values.holdingLength,
    annualAppreciationRate: values.annualAppreciationRate,
    saleClosingCostsPercent: values.saleClosingCostsPercent,
  }), [values]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Investment Analysis
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Complete analysis and {values.holdingLength}-year projection
          </p>
        </div>
        <div className="flex gap-2">
          <ShareButton
            calculationId={calculationId}
            onSuccess={(url) => success('Link copied!', 'Expires in 30 days.')}
            onError={(err) => error('Failed to share', err)}
          />
          <SaveCalculationButton
            formData={formDataForSave}
            results={computedResults}
            calculationId={calculationId}
            onSuccess={() => success('Calculation saved!', 'Your analysis has been saved to your account.')}
            onError={(err) => error('Failed to save', err)}
          />
        </div>
      </div>

      {/* Toast notifications */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-4" aria-label="Tabs">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="min-h-[600px]">
        {activeTab === 'first-year' && <Tab1FirstYear values={values} results={results} />}
        {activeTab === 'multi-year' && <Tab2MultiYear values={values} results={results} />}
        {activeTab === 'metrics' && <Tab3Metrics values={values} results={results} />}
        {activeTab === 'assumptions' && <Tab4Assumptions values={values} />}
        {activeTab === 'amortization' && <Tab5Amortization values={values} results={results} />}
      </div>
    </div>
  );
}

/**
 * Tab 1: First Year Analysis
 */
function Tab1FirstYear({
  values,
  results,
}: {
  values: CalculationInputs;
  results: any;
}) {
  // Monthly breakdown data for chart
  const monthlyData = useMemo(() => {
    const months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];

    return months.map((month) => ({
      label: month,
      income: results.cashFlow.netIncome,
      expenses: results.monthlyOperatingExpenses,
      debtService: results.monthlyPayment,
      cashFlow: results.cashFlow.cashFlow,
    }));
  }, [results]);

  // Income vs Expenses breakdown
  const incomeExpensesData = [
    {
      label: 'Monthly Rent',
      value: results.cashFlow.grossIncome,
    },
    {
      label: 'Vacancy Loss',
      value: -results.cashFlow.vacancyLoss,
    },
    {
      label: 'Operating Expenses',
      value: -results.monthlyOperatingExpenses,
    },
    {
      label: 'Mortgage Payment',
      value: -results.monthlyPayment,
    },
  ];

  return (
    <div className="space-y-8">
      {/* Key First Year Metrics */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Key Monthly Metrics
        </h3>
        <MetricsGrid>
          <MetricsCard
            label="Monthly Cash Flow"
            value={results.cashFlow.cashFlow}
            type="currency"
            suffix="/mo"
            helpText="Net income after all expenses and mortgage payment"
          />
          <MetricsCard
            label="Annual Cash Flow"
            value={results.cashFlow.cashFlow * 12}
            type="currency"
            suffix="/year"
            helpText="Total cash flow for the first year"
          />
          <MetricsCard
            label="Cash-on-Cash Return"
            value={results.metrics.cashOnCashReturn}
            type="percentage"
            color={results.metrics.cashOnCashReturn > 8 ? 'green' : results.metrics.cashOnCashReturn > 4 ? 'blue' : 'red'}
            helpText="Annual cash flow divided by total investment (>8% is good)"
          />
          <MetricsCard
            label="Cap Rate"
            value={results.metrics.capRate}
            type="percentage"
            color={results.metrics.capRate > 6 ? 'green' : results.metrics.capRate > 4 ? 'blue' : 'red'}
            helpText="NOI divided by purchase price (>6% is good)"
          />
        </MetricsGrid>
      </div>

      {/* Monthly Cash Flow Chart */}
      <ResultsChart
        type="bar"
        data={monthlyData}
        series={[
          { dataKey: 'cashFlow', name: 'Net Cash Flow', color: CHART_COLORS.primary },
        ]}
        title="Monthly Cash Flow (First Year)"
        height={300}
        showGrid={true}
      />

      {/* Income & Expense Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Income Breakdown */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Monthly Income
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Gross Rent</span>
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                ${results.cashFlow.grossIncome.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center text-red-600 dark:text-red-400">
              <span className="text-sm">Vacancy Loss ({values.vacancyRate}%)</span>
              <span className="text-sm font-semibold">
                -${results.cashFlow.vacancyLoss.toFixed(2)}
              </span>
            </div>
            <div className="pt-3 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                Net Income
              </span>
              <span className="text-sm font-bold text-green-600 dark:text-green-400">
                ${results.cashFlow.netIncome.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Expense Breakdown */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Monthly Expenses
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Property Tax</span>
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                ${(values.propertyTaxAnnual / 12).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Insurance</span>
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                ${(values.insuranceAnnual / 12).toFixed(2)}
              </span>
            </div>
            {values.hoaMonthly > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">HOA Fees</span>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  ${values.hoaMonthly.toFixed(2)}
                </span>
              </div>
            )}
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Maintenance</span>
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                ${values.maintenanceMonthly.toFixed(2)}
              </span>
            </div>
            {((values as any).propertyManagementMonthly > 0 || values.propertyManagementPercent > 0) && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Property Management
                </span>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  ${((values as any).propertyManagementMode === 'dollar'
                    ? ((values as any).propertyManagementMonthly || 0)
                    : (values.monthlyRent * values.propertyManagementPercent / 100)
                  ).toFixed(2)}
                </span>
              </div>
            )}
            <div className="pt-3 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                Total Operating
              </span>
              <span className="text-sm font-bold text-red-600 dark:text-red-400">
                ${results.monthlyOperatingExpenses.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                Mortgage Payment
              </span>
              <span className="text-sm font-bold text-red-600 dark:text-red-400">
                ${results.monthlyPayment.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Purchase Summary */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 p-6">
        <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-4">
          Purchase Summary
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-sm text-blue-700 dark:text-blue-300 mb-1">Purchase Price</p>
            <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
              ${values.purchasePrice.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-sm text-blue-700 dark:text-blue-300 mb-1">
              Down Payment ({values.downPaymentPercent}%)
            </p>
            <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
              ${results.downPayment.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-sm text-blue-700 dark:text-blue-300 mb-1">Total Investment</p>
            <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
              ${results.totalInvestment.toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Tab 2: Multi-Year Projections
 */
function Tab2MultiYear({ values, results }: { values: CalculationInputs; results: any }) {
  // Prepare chart data
  const chartData = useMemo(() => {
    return results.projections.map((p: any) => ({
      label: `Year ${p.year}`,
      propertyValue: p.propertyValue,
      equity: p.equity,
      loanBalance: p.loanBalance,
      cashFlow: p.cashFlow,
    }));
  }, [results.projections]);

  // Prepare table columns
  const tableColumns = [
    { key: 'year', header: 'Year', type: 'number' as const, sortable: true, align: 'left' as const, width: '80px' },
    { key: 'cashFlow', header: 'Cash Flow', type: 'currency' as const, sortable: true, align: 'right' as const },
    { key: 'propertyValue', header: 'Property Value', type: 'currency' as const, sortable: true, align: 'right' as const },
    { key: 'loanBalance', header: 'Loan Balance', type: 'currency' as const, sortable: true, align: 'right' as const },
    { key: 'equity', header: 'Equity', type: 'currency' as const, sortable: true, align: 'right' as const },
    { key: 'noi', header: 'NOI', type: 'currency' as const, sortable: true, align: 'right' as const },
    { key: 'roi', header: 'ROI', type: 'percentage' as const, sortable: true, align: 'right' as const },
  ];

  return (
    <div className="space-y-8">
      {/* Exit Scenario Summary */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg border border-green-200 dark:border-green-800 p-6">
        <h3 className="text-lg font-semibold text-green-900 dark:text-green-100 mb-4">
          Exit Scenario - Year {values.holdingLength}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div>
            <p className="text-sm text-green-700 dark:text-green-300 mb-1">Sale Price</p>
            <p className="text-2xl font-bold text-green-900 dark:text-green-100">
              ${Math.round(results.saleProceeds.salePrice).toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-sm text-green-700 dark:text-green-300 mb-1">Net Proceeds</p>
            <p className="text-2xl font-bold text-green-900 dark:text-green-100">
              ${Math.round(results.saleProceeds.netProceeds).toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-sm text-green-700 dark:text-green-300 mb-1">Total Profit</p>
            <p className="text-2xl font-bold text-green-900 dark:text-green-100">
              ${Math.round(results.totalReturn.totalReturn - results.totalReturn.totalInvestment).toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-sm text-green-700 dark:text-green-300 mb-1">Total ROI</p>
            <p className="text-2xl font-bold text-green-900 dark:text-green-100">
              {(((results.totalReturn.totalReturn - results.totalReturn.totalInvestment) / results.totalReturn.totalInvestment) * 100).toFixed(2)}%
            </p>
          </div>
        </div>
      </div>

      {/* Property Value & Equity Chart */}
      <ResultsChart
        type="line"
        data={chartData}
        series={[
          { dataKey: 'propertyValue', name: 'Property Value', color: CHART_COLORS.primary, strokeWidth: 3 },
          { dataKey: 'equity', name: 'Your Equity', color: CHART_COLORS.success, strokeWidth: 3 },
          { dataKey: 'loanBalance', name: 'Loan Balance', color: CHART_COLORS.danger, strokeWidth: 2 },
        ]}
        title="Property Value & Equity Growth"
        height={350}
        showGrid={true}
      />

      {/* Annual Cash Flow Chart */}
      <ResultsChart
        type="bar"
        data={chartData}
        series={[
          { dataKey: 'cashFlow', name: 'Annual Cash Flow', color: CHART_COLORS.success },
        ]}
        title="Annual Cash Flow Over Time"
        height={300}
        showGrid={true}
      />

      {/* Year-by-Year Data Table */}
      <ResultsTable
        data={results.projections}
        columns={tableColumns}
        title={`${values.holdingLength}-Year Projection Details`}
        showExport={true}
        stickyHeader={true}
        maxHeight="500px"
      />

      {/* Assumptions */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Projection Assumptions
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Annual Appreciation</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">
              {values.annualAppreciationRate}%
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Annual Rent Increase</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">
              {values.annualRentIncrease}%
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Annual Expense Increase</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">
              {values.annualExpenseIncrease}%
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Tab 3: Advanced Metrics
 */
function Tab3Metrics({ values, results }: { values: CalculationInputs; results: any }) {
  return (
    <div className="space-y-8">
      {/* Key Investment Metrics */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Key Investment Metrics
        </h3>
        <MetricsGrid>
          <MetricsCard
            label="Cash-on-Cash Return"
            value={results.metrics.cashOnCashReturn}
            type="percentage"
            color={results.metrics.cashOnCashReturn > 8 ? 'green' : results.metrics.cashOnCashReturn > 4 ? 'blue' : 'red'}
            helpText="Annual cash flow / Total investment. >8% is good for rental properties."
          />
          <MetricsCard
            label="Cap Rate"
            value={results.metrics.capRate}
            type="percentage"
            color={results.metrics.capRate > 6 ? 'green' : results.metrics.capRate > 4 ? 'blue' : 'red'}
            helpText="NOI / Property value. Measures property performance independent of financing."
          />
          <MetricsCard
            label="DSCR"
            value={results.metrics.dscr}
            type="ratio"
            color={results.metrics.dscr >= 1.25 ? 'green' : results.metrics.dscr >= 1.0 ? 'blue' : 'red'}
            helpText="Debt Service Coverage Ratio. NOI / Annual debt payment. >1.25 is lender minimum."
          />
          <MetricsCard
            label="GRM"
            value={results.metrics.grm}
            type="ratio"
            color={results.metrics.grm <= 10 ? 'green' : results.metrics.grm <= 15 ? 'blue' : 'red'}
            helpText="Gross Rent Multiplier. Price / Annual rent. Lower is better. 6-10 is typical."
          />
        </MetricsGrid>
      </div>

      {/* Performance Indicators */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cash Flow Analysis */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Cash Flow Analysis
          </h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-gray-600 dark:text-gray-400">Monthly</span>
                <span className={`text-lg font-bold ${results.cashFlow.cashFlow >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  ${results.cashFlow.cashFlow.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-gray-600 dark:text-gray-400">Annual</span>
                <span className={`text-lg font-bold ${results.cashFlow.cashFlow * 12 >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  ${(results.cashFlow.cashFlow * 12).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">{values.holdingLength}-Year Total</span>
                <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                  ${results.totalReturn.totalCashFlow.toFixed(2)}
                </span>
              </div>
            </div>
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {results.cashFlow.cashFlow > 0
                  ? '✅ Property generates positive cash flow'
                  : '⚠️ Property has negative cash flow (cash drag)'}
              </p>
            </div>
          </div>
        </div>

        {/* Investment Quality */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Investment Quality
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Cash Flow</span>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                results.cashFlow.cashFlow > 0
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                  : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
              }`}>
                {results.cashFlow.cashFlow > 0 ? 'Positive' : 'Negative'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">CoC Return</span>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                results.metrics.cashOnCashReturn > 8
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                  : results.metrics.cashOnCashReturn > 4
                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                  : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
              }`}>
                {results.metrics.cashOnCashReturn > 8 ? 'Excellent' : results.metrics.cashOnCashReturn > 4 ? 'Good' : 'Poor'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Cap Rate</span>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                results.metrics.capRate > 6
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                  : results.metrics.capRate > 4
                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                  : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
              }`}>
                {results.metrics.capRate > 6 ? 'Excellent' : results.metrics.capRate > 4 ? 'Good' : 'Poor'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">DSCR</span>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                results.metrics.dscr >= 1.25
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                  : results.metrics.dscr >= 1.0
                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                  : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
              }`}>
                {results.metrics.dscr >= 1.25 ? 'Strong' : results.metrics.dscr >= 1.0 ? 'Acceptable' : 'Weak'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Break-Even Analysis */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 p-6">
        <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-4">
          Break-Even Analysis
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-blue-700 dark:text-blue-300 mb-2">
              Monthly Rent Needed to Break Even
            </p>
            <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
              ${(results.monthlyOperatingExpenses + results.monthlyPayment).toFixed(2)}
            </p>
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
              Operating expenses + mortgage payment
            </p>
          </div>
          <div>
            <p className="text-sm text-blue-700 dark:text-blue-300 mb-2">
              Current Monthly Margin
            </p>
            <p className={`text-2xl font-bold ${results.cashFlow.cashFlow >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              ${results.cashFlow.cashFlow.toFixed(2)}
            </p>
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
              {results.cashFlow.cashFlow >= 0
                ? `${((results.cashFlow.cashFlow / results.cashFlow.netIncome) * 100).toFixed(1)}% profit margin`
                : 'Monthly shortfall'}
            </p>
          </div>
        </div>
      </div>

      {/* Metric Definitions */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Metric Definitions
        </h3>
        <div className="space-y-3 text-sm">
          <div>
            <p className="font-semibold text-gray-900 dark:text-white">Cash-on-Cash Return (CoC)</p>
            <p className="text-gray-600 dark:text-gray-400">
              Annual pre-tax cash flow divided by total cash invested. Measures levered return.
            </p>
          </div>
          <div>
            <p className="font-semibold text-gray-900 dark:text-white">Capitalization Rate (Cap Rate)</p>
            <p className="text-gray-600 dark:text-gray-400">
              Net Operating Income divided by property value. Measures unlevered property performance.
            </p>
          </div>
          <div>
            <p className="font-semibold text-gray-900 dark:text-white">Debt Service Coverage Ratio (DSCR)</p>
            <p className="text-gray-600 dark:text-gray-400">
              NOI divided by annual debt payments. Shows ability to cover mortgage. Lenders typically require 1.25x minimum.
            </p>
          </div>
          <div>
            <p className="font-semibold text-gray-900 dark:text-white">Gross Rent Multiplier (GRM)</p>
            <p className="text-gray-600 dark:text-gray-400">
              Property price divided by gross annual rent. Quick comparison tool. Lower is better. 6-10 is typical for residential.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Tab 4: Assumptions Summary
 */
function Tab4Assumptions({ values }: { values: CalculationInputs }) {
  return (
    <div className="space-y-8">
      <div className="text-center mb-4">
        <p className="text-gray-600 dark:text-gray-400">
          Review all inputs used in this calculation. Values are saved in your browser.
        </p>
      </div>

      {/* Property Details */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <span>🏠</span>
          Property Details
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600 dark:text-gray-400">Property Title</span>
            <span className="text-sm font-semibold text-gray-900 dark:text-white">
              {values.title || 'Untitled Property'}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600 dark:text-gray-400">Property Type</span>
            <span className="text-sm font-semibold text-gray-900 dark:text-white capitalize">
              {values.propertyType.replace('_', ' ')}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600 dark:text-gray-400">Address</span>
            <span className="text-sm font-semibold text-gray-900 dark:text-white">
              {values.address || 'Not provided'}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600 dark:text-gray-400">Holding Period</span>
            <span className="text-sm font-semibold text-gray-900 dark:text-white">
              {values.holdingLength} years
            </span>
          </div>
        </div>
      </div>

      {/* Purchase & Financing */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <span>💰</span>
          Purchase & Financing
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600 dark:text-gray-400">Purchase Price</span>
            <span className="text-sm font-semibold text-gray-900 dark:text-white">
              ${values.purchasePrice.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600 dark:text-gray-400">Down Payment</span>
            <span className="text-sm font-semibold text-gray-900 dark:text-white">
              {values.downPaymentPercent}% (${(values.purchasePrice * values.downPaymentPercent / 100).toLocaleString()})
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600 dark:text-gray-400">Closing Costs</span>
            <span className="text-sm font-semibold text-gray-900 dark:text-white">
              ${values.closingCosts.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600 dark:text-gray-400">Repair Costs</span>
            <span className="text-sm font-semibold text-gray-900 dark:text-white">
              ${values.repairCosts.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600 dark:text-gray-400">Interest Rate</span>
            <span className="text-sm font-semibold text-gray-900 dark:text-white">
              {values.interestRate}%
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600 dark:text-gray-400">Loan Term</span>
            <span className="text-sm font-semibold text-gray-900 dark:text-white">
              {values.loanTermYears} years
            </span>
          </div>
        </div>
      </div>

      {/* Income */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <span>💵</span>
          Income
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600 dark:text-gray-400">Monthly Rent</span>
            <span className="text-sm font-semibold text-gray-900 dark:text-white">
              ${values.monthlyRent.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600 dark:text-gray-400">Vacancy Rate</span>
            <span className="text-sm font-semibold text-gray-900 dark:text-white">
              {values.vacancyRate}%
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600 dark:text-gray-400">Annual Rent Increase</span>
            <span className="text-sm font-semibold text-gray-900 dark:text-white">
              {values.annualRentIncrease}%
            </span>
          </div>
        </div>
      </div>

      {/* Operating Expenses */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <span>📊</span>
          Operating Expenses
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600 dark:text-gray-400">Property Tax (Annual)</span>
            <span className="text-sm font-semibold text-gray-900 dark:text-white">
              ${values.propertyTaxAnnual.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600 dark:text-gray-400">Insurance (Annual)</span>
            <span className="text-sm font-semibold text-gray-900 dark:text-white">
              ${values.insuranceAnnual.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600 dark:text-gray-400">HOA Fees (Monthly)</span>
            <span className="text-sm font-semibold text-gray-900 dark:text-white">
              ${values.hoaMonthly.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600 dark:text-gray-400">Maintenance (Monthly)</span>
            <span className="text-sm font-semibold text-gray-900 dark:text-white">
              ${values.maintenanceMonthly.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600 dark:text-gray-400">Property Management (%)</span>
            <span className="text-sm font-semibold text-gray-900 dark:text-white">
              {values.propertyManagementPercent}%
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600 dark:text-gray-400">Utilities (Monthly)</span>
            <span className="text-sm font-semibold text-gray-900 dark:text-white">
              ${values.utilitiesMonthly.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600 dark:text-gray-400">Other Expenses (Monthly)</span>
            <span className="text-sm font-semibold text-gray-900 dark:text-white">
              ${values.otherExpensesMonthly.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600 dark:text-gray-400">Annual Expense Increase</span>
            <span className="text-sm font-semibold text-gray-900 dark:text-white">
              {values.annualExpenseIncrease}%
            </span>
          </div>
        </div>
      </div>

      {/* Exit Strategy */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <span>🎯</span>
          Exit Strategy
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600 dark:text-gray-400">Holding Length</span>
            <span className="text-sm font-semibold text-gray-900 dark:text-white">
              {values.holdingLength} years
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600 dark:text-gray-400">Annual Appreciation</span>
            <span className="text-sm font-semibold text-gray-900 dark:text-white">
              {values.annualAppreciationRate}%
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600 dark:text-gray-400">Selling Costs</span>
            <span className="text-sm font-semibold text-gray-900 dark:text-white">
              {values.sellingCostPercent}%
            </span>
          </div>
        </div>
      </div>

      {/* Notes */}
      {values.notes && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800 p-6">
          <h3 className="text-lg font-semibold text-yellow-900 dark:text-yellow-100 mb-2">
            Notes
          </h3>
          <p className="text-sm text-yellow-800 dark:text-yellow-200 whitespace-pre-wrap">
            {values.notes}
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * Tab 5: Loan Amortization Schedule
 */
function Tab5Amortization({
  values,
  results,
}: {
  values: CalculationInputs;
  results: any;
}) {
  const amortization = results.amortizationSchedule;

  // Prepare table data
  const tableData = amortization.map((year: any) => ({
    year: year.year,
    beginningBalance: year.beginningBalance,
    payment: year.payment,
    principal: year.principal,
    interest: year.interest,
    endingBalance: year.endingBalance,
  }));

  const tableColumns = [
    { key: 'year', header: 'Year', align: 'center' as const, width: '80px' },
    {
      key: 'beginningBalance',
      header: 'Beginning Balance',
      format: (val: number) => `$${Math.round(val).toLocaleString()}`,
      align: 'right' as const,
    },
    {
      key: 'payment',
      header: 'Annual Payment',
      format: (val: number) => `$${Math.round(val).toLocaleString()}`,
      align: 'right' as const,
    },
    {
      key: 'principal',
      header: 'Principal',
      format: (val: number) => `$${Math.round(val).toLocaleString()}`,
      align: 'right' as const,
    },
    {
      key: 'interest',
      header: 'Interest',
      format: (val: number) => `$${Math.round(val).toLocaleString()}`,
      align: 'right' as const,
    },
    {
      key: 'endingBalance',
      header: 'Ending Balance',
      format: (val: number) => `$${Math.round(val).toLocaleString()}`,
      align: 'right' as const,
    },
  ];

  // Calculate totals
  const totalPayment = amortization.reduce((sum: number, year: any) => sum + year.payment, 0);
  const totalPrincipal = amortization.reduce((sum: number, year: any) => sum + year.principal, 0);
  const totalInterest = amortization.reduce((sum: number, year: any) => sum + year.interest, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          Loan Amortization Schedule
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Year-by-year breakdown of your {values.loanTermYears}-year mortgage
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Loan Amount</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            ${Math.round(results.loanAmount).toLocaleString()}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Payments</p>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            ${Math.round(totalPayment).toLocaleString()}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Interest</p>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400">
            ${Math.round(totalInterest).toLocaleString()}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Interest Rate</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {values.interestRate.toFixed(2)}%
          </p>
        </div>
      </div>

      {/* Principal vs Interest Chart */}
      <ResultsChart
        type="area"
        data={amortization.map((year: any) => ({
          year: `Year ${year.year}`,
          Principal: year.principal,
          Interest: year.interest,
        }))}
        series={[
          { dataKey: 'Principal', name: 'Principal', color: CHART_COLORS.success },
          { dataKey: 'Interest', name: 'Interest', color: CHART_COLORS.danger },
        ]}
        title="Annual Principal vs Interest"
        height={350}
        showGrid={true}
      />

      {/* Amortization Table */}
      <ResultsTable
        data={tableData}
        columns={tableColumns}
        title="Complete Amortization Schedule"
        showExport={true}
        stickyHeader={true}
        maxHeight="600px"
      />

      {/* Column Explanations */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 p-6">
        <h4 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-4">
          📖 Column Explanations
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800 dark:text-blue-200">
          <div>
            <p className="font-semibold mb-1">Beginning Balance</p>
            <p>The loan amount you owe at the start of the year</p>
          </div>
          <div>
            <p className="font-semibold mb-1">Annual Payment</p>
            <p>Total amount you pay to the lender this year (12 × monthly payment)</p>
          </div>
          <div>
            <p className="font-semibold mb-1">Principal</p>
            <p>Portion of your payment that reduces the loan balance</p>
          </div>
          <div>
            <p className="font-semibold mb-1">Interest</p>
            <p>Portion of your payment that goes to the lender as interest charges</p>
          </div>
          <div>
            <p className="font-semibold mb-1">Ending Balance</p>
            <p>The loan amount you owe at the end of the year (Beginning - Principal)</p>
          </div>
          <div className="bg-blue-100 dark:bg-blue-800/30 rounded p-3">
            <p className="font-semibold mb-1">✓ Key Formula</p>
            <p className="text-xs">Payment = Principal + Interest</p>
          </div>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800 p-6">
        <h4 className="text-lg font-semibold text-purple-900 dark:text-purple-100 mb-3">
          💡 Understanding Amortization
        </h4>
        <div className="space-y-2 text-sm text-purple-800 dark:text-purple-200">
          <p>
            • <strong>Early years:</strong> Most of your payment goes toward interest ({' '}
            {((amortization[0].interest / amortization[0].payment) * 100).toFixed(0)}% in Year 1)
          </p>
          <p>
            • <strong>Later years:</strong> More of your payment reduces the principal ({' '}
            {(
              (amortization[amortization.length - 1].principal /
                amortization[amortization.length - 1].payment) *
              100
            ).toFixed(0)}
            % in Year {values.loanTermYears})
          </p>
          <p>
            • <strong>Total interest:</strong> You'll pay $
            {Math.round(totalInterest).toLocaleString()} in interest over {values.loanTermYears}{' '}
            years (
            {((totalInterest / totalPayment) * 100).toFixed(1)}% of total payments)
          </p>
          <p>
            • <strong>Cost of borrowing:</strong> For every $1 borrowed, you'll pay $
            {(totalPayment / results.loanAmount).toFixed(2)} total
          </p>
        </div>
      </div>
    </div>
  );
}
