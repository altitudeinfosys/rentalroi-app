'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { ChevronDown, ChevronUp, ExternalLink } from 'lucide-react'
import type { DbCalculation } from '@/lib/mappers/calculation-mapper'
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
} from '@repo/calculations'

interface SharedCalculationViewProps {
  calculation: DbCalculation
  expiresAt: Date
}

export function SharedCalculationView({ calculation, expiresAt }: SharedCalculationViewProps) {
  const [showInputs, setShowInputs] = useState(false)

  // Calculate all results from the stored inputs
  const results = useMemo(() => {
    const loanAmount = calculation.purchase_price * (1 - calculation.down_payment_percent / 100)
    const monthlyPayment = calculateMonthlyPayment(
      loanAmount,
      calculation.interest_rate,
      calculation.loan_term_years
    )

    const monthlyOperatingExpenses =
      calculation.property_tax_annual / 12 +
      calculation.insurance_annual / 12 +
      calculation.hoa_monthly +
      calculation.maintenance_monthly +
      (calculation.monthly_rent * calculation.property_management_percent / 100) +
      calculation.utilities_monthly +
      calculation.other_expenses_monthly

    const cashFlow = calculateCashFlow(
      calculation.monthly_rent,
      calculation.vacancy_rate,
      monthlyOperatingExpenses,
      monthlyPayment
    )

    const downPayment = calculation.purchase_price * (calculation.down_payment_percent / 100)
    const totalInvestment = downPayment + calculation.closing_costs + calculation.repair_costs

    const annualCashFlow = cashFlow.cashFlow * 12
    const annualNOI = cashFlow.noi * 12
    const annualDebtService = monthlyPayment * 12

    const metrics = {
      cashOnCashReturn: calculateCashOnCashReturn(annualCashFlow, totalInvestment),
      capRate: calculateCapRate(annualNOI, calculation.purchase_price),
      dscr: calculateDSCR(annualNOI, annualDebtService),
      grm: calculateGRM(calculation.purchase_price, calculation.monthly_rent * 12),
    }

    // Multi-year projections
    const projectionInputs = {
      purchasePrice: calculation.purchase_price,
      downPaymentPercent: calculation.down_payment_percent,
      interestRate: calculation.interest_rate,
      loanTermYears: calculation.loan_term_years,
      closingCosts: calculation.closing_costs,
      repairCosts: calculation.repair_costs,
      monthlyRent: calculation.monthly_rent,
      otherMonthlyIncome: calculation.other_monthly_income,
      vacancyRate: calculation.vacancy_rate,
      annualRentIncrease: calculation.annual_rent_increase,
      propertyTaxAnnual: calculation.property_tax_annual,
      insuranceAnnual: calculation.insurance_annual,
      hoaMonthly: calculation.hoa_monthly,
      maintenanceMonthly: calculation.maintenance_monthly,
      propertyManagementPercent: calculation.property_management_percent,
      utilitiesMonthly: calculation.utilities_monthly,
      otherExpensesMonthly: calculation.other_expenses_monthly,
      annualExpenseIncrease: calculation.annual_expense_increase,
      holdingLength: calculation.holding_length,
      annualAppreciationRate: calculation.annual_appreciation_rate,
      saleClosingCostsPercent: calculation.sale_closing_costs_percent,
      propertyType: calculation.property_type as any,
      title: calculation.title,
    }

    const projections = calculateMultiYearProjection(projectionInputs)
    const finalProjection = projections[projections.length - 1]
    const saleProceeds = calculateSaleProceeds(
      finalProjection.propertyValue,
      calculation.sale_closing_costs_percent,
      finalProjection.loanBalance
    )

    const cumulativeCashFlow = projections.reduce((sum, p) => sum + p.cashFlow, 0)
    const cashFlows = [-totalInvestment, ...projections.map((p) => p.cashFlow)]
    cashFlows[cashFlows.length - 1] += saleProceeds.netProceeds

    const totalReturn = calculateTotalReturn(
      cumulativeCashFlow,
      saleProceeds.netProceeds,
      totalInvestment,
      cashFlows
    )

    return {
      loanAmount,
      downPayment,
      totalInvestment,
      monthlyPayment,
      monthlyOperatingExpenses,
      cashFlow,
      metrics,
      projections,
      saleProceeds,
      totalReturn,
    }
  }, [calculation])

  const formatCurrency = (value: number) =>
    value.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })

  const formatPercent = (value: number) => `${value.toFixed(2)}%`

  const getPropertyAddress = () => {
    const parts = [calculation.address, calculation.city, calculation.state].filter(Boolean)
    return parts.length > 0 ? parts.join(', ') : null
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-sm font-medium rounded-full">
            Shared Calculation
          </span>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Expires {expiresAt.toLocaleDateString()}
          </span>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          {calculation.title}
        </h1>
        {getPropertyAddress() && (
          <p className="text-lg text-gray-600 dark:text-gray-400">
            {getPropertyAddress()}
          </p>
        )}
        <p className="text-sm text-gray-500 dark:text-gray-500 mt-1 capitalize">
          {calculation.property_type.replace('_', ' ')}
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <MetricCard
          label="Monthly Cash Flow"
          value={formatCurrency(results.cashFlow.cashFlow)}
          color={results.cashFlow.cashFlow >= 0 ? 'green' : 'red'}
        />
        <MetricCard
          label="Cash-on-Cash"
          value={formatPercent(results.metrics.cashOnCashReturn)}
          color={results.metrics.cashOnCashReturn > 8 ? 'green' : results.metrics.cashOnCashReturn > 4 ? 'blue' : 'red'}
        />
        <MetricCard
          label="Cap Rate"
          value={formatPercent(results.metrics.capRate)}
          color={results.metrics.capRate > 6 ? 'green' : results.metrics.capRate > 4 ? 'blue' : 'red'}
        />
        <MetricCard
          label="Purchase Price"
          value={formatCurrency(calculation.purchase_price)}
          color="gray"
        />
      </div>

      {/* Investment Summary */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Investment Summary
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Investment</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {formatCurrency(results.totalInvestment)}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500">
              Down payment + closing + repairs
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Annual Cash Flow</p>
            <p className={`text-2xl font-bold ${results.cashFlow.cashFlow >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {formatCurrency(results.cashFlow.cashFlow * 12)}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500">
              First year
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
              {calculation.holding_length}-Year Total Return
            </p>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {formatCurrency(results.totalReturn.totalReturn)}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500">
              Cash flow + sale proceeds
            </p>
          </div>
        </div>
      </div>

      {/* Exit Scenario */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg border border-green-200 dark:border-green-800 p-6 mb-6">
        <h2 className="text-lg font-semibold text-green-900 dark:text-green-100 mb-4">
          Exit Scenario (Year {calculation.holding_length})
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-green-700 dark:text-green-300">Projected Sale Price</p>
            <p className="text-xl font-bold text-green-900 dark:text-green-100">
              {formatCurrency(results.saleProceeds.salePrice)}
            </p>
          </div>
          <div>
            <p className="text-sm text-green-700 dark:text-green-300">Net Proceeds</p>
            <p className="text-xl font-bold text-green-900 dark:text-green-100">
              {formatCurrency(results.saleProceeds.netProceeds)}
            </p>
          </div>
          <div>
            <p className="text-sm text-green-700 dark:text-green-300">Total Profit</p>
            <p className="text-xl font-bold text-green-900 dark:text-green-100">
              {formatCurrency(results.totalReturn.totalReturn - results.totalReturn.totalInvestment)}
            </p>
          </div>
          <div>
            <p className="text-sm text-green-700 dark:text-green-300">IRR</p>
            <p className="text-xl font-bold text-green-900 dark:text-green-100">
              {formatPercent(results.totalReturn.irr)}
            </p>
          </div>
        </div>
      </div>

      {/* Collapsible Inputs */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 mb-8">
        <button
          onClick={() => setShowInputs(!showInputs)}
          className="w-full flex items-center justify-between p-4 text-left"
        >
          <span className="font-semibold text-gray-900 dark:text-white">
            View All Inputs & Assumptions
          </span>
          {showInputs ? (
            <ChevronUp className="w-5 h-5 text-gray-500" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-500" />
          )}
        </button>

        {showInputs && (
          <div className="border-t border-gray-200 dark:border-gray-700 p-6 space-y-6">
            {/* Purchase & Financing */}
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Purchase & Financing</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <InputRow label="Purchase Price" value={formatCurrency(calculation.purchase_price)} />
                <InputRow label="Down Payment" value={`${calculation.down_payment_percent}%`} />
                <InputRow label="Loan Amount" value={formatCurrency(results.loanAmount)} />
                <InputRow label="Interest Rate" value={`${calculation.interest_rate}%`} />
                <InputRow label="Loan Term" value={`${calculation.loan_term_years} years`} />
                <InputRow label="Closing Costs" value={formatCurrency(calculation.closing_costs)} />
                <InputRow label="Repair Costs" value={formatCurrency(calculation.repair_costs)} />
              </div>
            </div>

            {/* Income */}
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Income</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <InputRow label="Monthly Rent" value={formatCurrency(calculation.monthly_rent)} />
                <InputRow label="Vacancy Rate" value={`${calculation.vacancy_rate}%`} />
                <InputRow label="Annual Rent Increase" value={`${calculation.annual_rent_increase}%`} />
              </div>
            </div>

            {/* Expenses */}
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Operating Expenses</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <InputRow label="Property Tax (Annual)" value={formatCurrency(calculation.property_tax_annual)} />
                <InputRow label="Insurance (Annual)" value={formatCurrency(calculation.insurance_annual)} />
                <InputRow label="HOA (Monthly)" value={formatCurrency(calculation.hoa_monthly)} />
                <InputRow label="Maintenance (Monthly)" value={formatCurrency(calculation.maintenance_monthly)} />
                <InputRow label="Property Management" value={`${calculation.property_management_percent}%`} />
                <InputRow label="Utilities (Monthly)" value={formatCurrency(calculation.utilities_monthly)} />
              </div>
            </div>

            {/* Assumptions */}
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Multi-Year Assumptions</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <InputRow label="Holding Period" value={`${calculation.holding_length} years`} />
                <InputRow label="Annual Appreciation" value={`${calculation.annual_appreciation_rate}%`} />
                <InputRow label="Annual Expense Increase" value={`${calculation.annual_expense_increase}%`} />
                <InputRow label="Sale Closing Costs" value={`${calculation.sale_closing_costs_percent}%`} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* CTA */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 p-6 text-center">
        <h2 className="text-xl font-bold text-blue-900 dark:text-blue-100 mb-2">
          Want to analyze your own property?
        </h2>
        <p className="text-blue-700 dark:text-blue-300 mb-4">
          Create your free account to run unlimited rental property calculations.
        </p>
        <Link
          href="/signup"
          className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
        >
          Get Started Free
          <ExternalLink className="w-4 h-4" />
        </Link>
      </div>
    </div>
  )
}

function MetricCard({
  label,
  value,
  color,
}: {
  label: string
  value: string
  color: 'green' | 'red' | 'blue' | 'gray'
}) {
  const colorClasses = {
    green: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
    red: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
    blue: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
    gray: 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700',
  }

  const valueClasses = {
    green: 'text-green-700 dark:text-green-300',
    red: 'text-red-700 dark:text-red-300',
    blue: 'text-blue-700 dark:text-blue-300',
    gray: 'text-gray-900 dark:text-white',
  }

  return (
    <div className={`rounded-lg border p-4 ${colorClasses[color]}`}>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{label}</p>
      <p className={`text-xl font-bold ${valueClasses[color]}`}>{value}</p>
    </div>
  )
}

function InputRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center py-1">
      <span className="text-gray-600 dark:text-gray-400">{label}</span>
      <span className="font-medium text-gray-900 dark:text-white">{value}</span>
    </div>
  )
}
