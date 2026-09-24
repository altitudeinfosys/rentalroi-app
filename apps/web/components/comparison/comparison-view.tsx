'use client'

import { useMemo } from 'react'
import { ArrowLeft, Trophy } from 'lucide-react'
import {
  calculateMonthlyPayment,
  calculateCashFlow,
  calculateCashOnCashReturn,
  calculateCapRate,
  calculateDSCR,
  calculateGRM,
  calculateMultiYearProjection,
} from '@repo/calculations'
import type { CalculatorFormData } from '@/lib/validation/calculator-schema'
import type { ProjectionYear } from '@repo/calculations'
import { ResultsChart, CHART_COLORS, type ChartDataPoint } from '@/components/calculator/results-chart'
import { ExportPdfButton } from './export-pdf-button'

// Colors for up to 4 properties
const PROPERTY_COLORS = [CHART_COLORS.primary, CHART_COLORS.success, CHART_COLORS.warning, CHART_COLORS.purple]

interface PropertyData {
  id: string
  formData: CalculatorFormData
}

interface ComputedProperty {
  id: string
  title: string
  formData: CalculatorFormData
  purchasePrice: number
  monthlyPayment: number
  totalInvestment: number
  monthlyCashFlow: number
  annualCashFlow: number
  cashOnCashReturn: number
  capRate: number
  dscr: number
  grm: number
  monthlyGrossIncome: number
  monthlyOperatingExpenses: number
  vacancyLoss: number
  noi: number
  projections: ProjectionYear[]
}

function computeProperty(prop: PropertyData): ComputedProperty {
  const f = prop.formData
  const loanAmount = f.purchasePrice * (1 - f.downPaymentPercent / 100)
  const monthlyPayment = calculateMonthlyPayment(loanAmount, f.interestRate, f.loanTermYears)

  const propertyManagementFee =
    f.propertyManagementMode === 'dollar'
      ? (f.propertyManagementMonthly || 0)
      : (f.monthlyRent * f.propertyManagementPercent) / 100

  const monthlyOperatingExpenses =
    f.propertyTaxAnnual / 12 +
    f.insuranceAnnual / 12 +
    f.hoaMonthly +
    f.maintenanceMonthly +
    propertyManagementFee +
    f.utilitiesMonthly +
    f.otherExpensesMonthly

  const cashFlow = calculateCashFlow(f.monthlyRent, f.vacancyRate, monthlyOperatingExpenses, monthlyPayment, f.otherMonthlyIncome || 0)

  const downPayment = f.purchasePrice * (f.downPaymentPercent / 100)
  const totalInvestment = downPayment + f.closingCosts + f.repairCosts

  const annualCashFlow = cashFlow.cashFlow * 12
  const annualNOI = cashFlow.noi * 12
  const annualDebtService = monthlyPayment * 12
  const annualRent = f.monthlyRent * 12

  const projections = calculateMultiYearProjection(f as any)

  return {
    id: prop.id,
    title: f.title,
    formData: f,
    purchasePrice: f.purchasePrice,
    monthlyPayment,
    totalInvestment,
    monthlyCashFlow: cashFlow.cashFlow,
    annualCashFlow,
    cashOnCashReturn: calculateCashOnCashReturn(annualCashFlow, totalInvestment),
    capRate: calculateCapRate(annualNOI, f.purchasePrice),
    dscr: calculateDSCR(annualNOI, annualDebtService),
    grm: calculateGRM(f.purchasePrice, annualRent),
    monthlyGrossIncome: cashFlow.grossIncome,
    monthlyOperatingExpenses,
    vacancyLoss: cashFlow.vacancyLoss,
    noi: cashFlow.noi,
    projections,
  }
}

// Determine which property "wins" for a metric
function getBestIndex(values: number[], higherIsBetter: boolean): number {
  if (values.length === 0) return -1
  let bestIdx = 0
  for (let i = 1; i < values.length; i++) {
    if (higherIsBetter ? values[i] > values[bestIdx] : values[i] < values[bestIdx]) {
      bestIdx = i
    }
  }
  return bestIdx
}

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v)

const formatPercent = (v: number) => `${v.toFixed(2)}%`
const formatRatio = (v: number) => v.toFixed(2)

interface ComparisonViewProps {
  properties: PropertyData[]
  onBack: () => void
}

export function ComparisonView({ properties, onBack }: ComparisonViewProps) {
  const computed = useMemo(() => properties.map(computeProperty), [properties])
  const count = computed.length

  // Metrics for comparison
  const metrics: { label: string; values: string[]; raw: number[]; higherIsBetter: boolean }[] = useMemo(() => [
    { label: 'Purchase Price', values: computed.map((p) => formatCurrency(p.purchasePrice)), raw: computed.map((p) => p.purchasePrice), higherIsBetter: false },
    { label: 'Total Investment', values: computed.map((p) => formatCurrency(p.totalInvestment)), raw: computed.map((p) => p.totalInvestment), higherIsBetter: false },
    { label: 'Monthly Cash Flow', values: computed.map((p) => formatCurrency(p.monthlyCashFlow)), raw: computed.map((p) => p.monthlyCashFlow), higherIsBetter: true },
    { label: 'Annual Cash Flow', values: computed.map((p) => formatCurrency(p.annualCashFlow)), raw: computed.map((p) => p.annualCashFlow), higherIsBetter: true },
    { label: 'Cash-on-Cash Return', values: computed.map((p) => formatPercent(p.cashOnCashReturn)), raw: computed.map((p) => p.cashOnCashReturn), higherIsBetter: true },
    { label: 'Cap Rate', values: computed.map((p) => formatPercent(p.capRate)), raw: computed.map((p) => p.capRate), higherIsBetter: true },
    { label: 'DSCR', values: computed.map((p) => formatRatio(p.dscr)), raw: computed.map((p) => p.dscr), higherIsBetter: true },
    { label: 'GRM', values: computed.map((p) => formatRatio(p.grm)), raw: computed.map((p) => p.grm), higherIsBetter: false },
  ], [computed])

  // Monthly breakdown
  const monthlyBreakdown: { label: string; values: string[]; raw: number[] }[] = useMemo(() => [
    { label: 'Gross Income', values: computed.map((p) => formatCurrency(p.monthlyGrossIncome)), raw: computed.map((p) => p.monthlyGrossIncome) },
    { label: 'Vacancy Loss', values: computed.map((p) => formatCurrency(-p.vacancyLoss)), raw: computed.map((p) => p.vacancyLoss) },
    { label: 'Operating Expenses', values: computed.map((p) => formatCurrency(-p.monthlyOperatingExpenses)), raw: computed.map((p) => p.monthlyOperatingExpenses) },
    { label: 'NOI', values: computed.map((p) => formatCurrency(p.noi)), raw: computed.map((p) => p.noi) },
    { label: 'Mortgage Payment', values: computed.map((p) => formatCurrency(-p.monthlyPayment)), raw: computed.map((p) => p.monthlyPayment) },
    { label: 'Net Cash Flow', values: computed.map((p) => formatCurrency(p.monthlyCashFlow)), raw: computed.map((p) => p.monthlyCashFlow) },
  ], [computed])

  // Projection chart data
  const maxYears = Math.max(...computed.map((p) => p.projections.length))
  const projectionChartData = useMemo((): ChartDataPoint[] => {
    const data: ChartDataPoint[] = []
    for (let y = 0; y < maxYears; y++) {
      const point: ChartDataPoint = { label: `Year ${y + 1}` }
      computed.forEach((p, i) => {
        if (y < p.projections.length) {
          point[`cf_${i}`] = Math.round(p.projections[y].cashFlow)
        }
      })
      data.push(point)
    }
    return data
  }, [computed, maxYears])

  const projectionSeries = computed.map((p, i) => ({
    dataKey: `cf_${i}`,
    name: p.title,
    color: PROPERTY_COLORS[i],
    strokeWidth: 2,
  }))

  // Equity chart data
  const equityChartData = useMemo((): ChartDataPoint[] => {
    const data: ChartDataPoint[] = []
    for (let y = 0; y < maxYears; y++) {
      const point: ChartDataPoint = { label: `Year ${y + 1}` }
      computed.forEach((p, i) => {
        if (y < p.projections.length) {
          point[`eq_${i}`] = Math.round(p.projections[y].equity)
        }
      })
      data.push(point)
    }
    return data
  }, [computed, maxYears])

  const equitySeries = computed.map((p, i) => ({
    dataKey: `eq_${i}`,
    name: p.title,
    color: PROPERTY_COLORS[i],
    strokeWidth: 2,
  }))

  // Winner summary
  const winnerMetrics = useMemo(() => {
    const items = [
      { label: 'Best Cash Flow', idx: getBestIndex(computed.map((p) => p.monthlyCashFlow), true) },
      { label: 'Best CoC Return', idx: getBestIndex(computed.map((p) => p.cashOnCashReturn), true) },
      { label: 'Best Cap Rate', idx: getBestIndex(computed.map((p) => p.capRate), true) },
      { label: 'Lowest Price', idx: getBestIndex(computed.map((p) => p.purchasePrice), false) },
      { label: 'Best DSCR', idx: getBestIndex(computed.map((p) => p.dscr), true) },
    ]
    return items
  }, [computed])

  // Detailed inputs table
  const inputCategories: { category: string; rows: { label: string; values: string[] }[] }[] = useMemo(() => [
    {
      category: 'Property Details',
      rows: [
        { label: 'Type', values: computed.map((p) => p.formData.propertyType.replace('_', ' ')) },
        { label: 'Address', values: computed.map((p) => [p.formData.address, p.formData.city, p.formData.state].filter(Boolean).join(', ') || 'N/A') },
        { label: 'Bedrooms', values: computed.map((p) => p.formData.bedrooms?.toString() || 'N/A') },
        { label: 'Bathrooms', values: computed.map((p) => p.formData.bathrooms?.toString() || 'N/A') },
        { label: 'Sq. Ft.', values: computed.map((p) => p.formData.squareFeet?.toLocaleString() || 'N/A') },
      ],
    },
    {
      category: 'Financing',
      rows: [
        { label: 'Down Payment', values: computed.map((p) => `${p.formData.downPaymentPercent}%`) },
        { label: 'Interest Rate', values: computed.map((p) => `${p.formData.interestRate}%`) },
        { label: 'Loan Term', values: computed.map((p) => `${p.formData.loanTermYears} years`) },
        { label: 'Closing Costs', values: computed.map((p) => formatCurrency(p.formData.closingCosts)) },
        { label: 'Repair Costs', values: computed.map((p) => formatCurrency(p.formData.repairCosts)) },
      ],
    },
    {
      category: 'Income',
      rows: [
        { label: 'Monthly Rent', values: computed.map((p) => formatCurrency(p.formData.monthlyRent)) },
        { label: 'Other Income', values: computed.map((p) => formatCurrency(p.formData.otherMonthlyIncome)) },
        { label: 'Vacancy Rate', values: computed.map((p) => `${p.formData.vacancyRate}%`) },
        { label: 'Annual Rent Increase', values: computed.map((p) => `${p.formData.annualRentIncrease}%`) },
      ],
    },
    {
      category: 'Expenses',
      rows: [
        { label: 'Property Tax', values: computed.map((p) => formatCurrency(p.formData.propertyTaxAnnual) + '/yr') },
        { label: 'Insurance', values: computed.map((p) => formatCurrency(p.formData.insuranceAnnual) + '/yr') },
        { label: 'HOA', values: computed.map((p) => formatCurrency(p.formData.hoaMonthly) + '/mo') },
        { label: 'Maintenance', values: computed.map((p) => formatCurrency(p.formData.maintenanceMonthly) + '/mo') },
        { label: 'Mgmt Fee', values: computed.map((p) => p.formData.propertyManagementMode === 'dollar' ? formatCurrency(p.formData.propertyManagementMonthly || 0) + '/mo' : `${p.formData.propertyManagementPercent}%`) },
        { label: 'Utilities', values: computed.map((p) => formatCurrency(p.formData.utilitiesMonthly) + '/mo') },
      ],
    },
  ], [computed])

  // Grid columns class
  const gridCols = count === 2 ? 'grid-cols-2' : count === 3 ? 'grid-cols-3' : 'grid-cols-4'

  return (
    <div className="space-y-6 print-full-width">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 no-print">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Selection
        </button>
        <ExportPdfButton />
      </div>

      {/* Print-only title */}
      <div className="hidden print-visible">
        <h1 className="text-2xl font-bold mb-1">Property Comparison</h1>
        <p className="text-gray-600 text-sm">Generated by RentalROI</p>
      </div>

      {/* Property Headers */}
      <div className="avoid-break bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-5">
        <div className={`grid ${gridCols} gap-4`}>
          {computed.map((p, i) => (
            <div key={p.id} className="text-center">
              <div
                className="inline-block w-3 h-3 rounded-full mb-2"
                style={{ backgroundColor: PROPERTY_COLORS[i] }}
              />
              <h3 className="font-semibold text-gray-900 dark:text-white text-sm truncate">
                {p.title}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {formatCurrency(p.purchasePrice)}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="avoid-break bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-4 border-b border-gray-100 dark:border-gray-700">
          <h2 className="font-semibold text-gray-900 dark:text-white">Key Metrics</h2>
        </div>
        <div className="divide-y divide-gray-100 dark:divide-gray-700">
          {metrics.map((m) => {
            const bestIdx = getBestIndex(m.raw, m.higherIsBetter)
            return (
              <div key={m.label} className={`grid grid-cols-[160px_1fr] items-center`}>
                <div className="px-4 py-3 text-sm font-medium text-gray-600 dark:text-gray-400">
                  {m.label}
                </div>
                <div className={`grid ${gridCols} divide-x divide-gray-100 dark:divide-gray-700`}>
                  {m.values.map((v, i) => (
                    <div
                      key={i}
                      className={`px-4 py-3 text-sm text-center font-semibold ${
                        i === bestIdx
                          ? 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/10'
                          : 'text-gray-900 dark:text-white'
                      }`}
                    >
                      {v}
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Monthly Breakdown */}
      <div className="avoid-break bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-4 border-b border-gray-100 dark:border-gray-700">
          <h2 className="font-semibold text-gray-900 dark:text-white">Monthly Breakdown</h2>
        </div>
        <div className="divide-y divide-gray-100 dark:divide-gray-700">
          {monthlyBreakdown.map((m) => (
            <div key={m.label} className={`grid grid-cols-[160px_1fr] items-center`}>
              <div className="px-4 py-3 text-sm font-medium text-gray-600 dark:text-gray-400">
                {m.label}
              </div>
              <div className={`grid ${gridCols} divide-x divide-gray-100 dark:divide-gray-700`}>
                {m.values.map((v, i) => (
                  <div key={i} className="px-4 py-3 text-sm text-center text-gray-900 dark:text-white">
                    {v}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Projection Charts */}
      <div className="avoid-break page-break">
        <ResultsChart
          type="line"
          data={projectionChartData}
          series={projectionSeries}
          title="Annual Cash Flow Projection"
          height={300}
        />
      </div>

      <div className="avoid-break">
        <ResultsChart
          type="area"
          data={equityChartData}
          series={equitySeries}
          title="Equity Buildup"
          height={300}
        />
      </div>

      {/* Detailed Inputs */}
      <div className="page-break">
        {inputCategories.map((cat) => (
          <div key={cat.category} className="avoid-break mb-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-4 border-b border-gray-100 dark:border-gray-700">
              <h2 className="font-semibold text-gray-900 dark:text-white">{cat.category}</h2>
            </div>
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {cat.rows.map((row) => (
                <div key={row.label} className={`grid grid-cols-[160px_1fr] items-center`}>
                  <div className="px-4 py-2.5 text-sm text-gray-600 dark:text-gray-400">
                    {row.label}
                  </div>
                  <div className={`grid ${gridCols} divide-x divide-gray-100 dark:divide-gray-700`}>
                    {row.values.map((v, i) => (
                      <div key={i} className="px-4 py-2.5 text-sm text-center text-gray-900 dark:text-white capitalize">
                        {v}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Winner Summary */}
      <div className="avoid-break bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-500" />
          <h2 className="font-semibold text-gray-900 dark:text-white">Winner Summary</h2>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {winnerMetrics.map((w) => (
              <div key={w.label} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: PROPERTY_COLORS[w.idx] }}
                />
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{w.label}</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {computed[w.idx]?.title || 'N/A'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
