import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Pencil, Home, Building2, Building, Store, Warehouse } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getCalculationServer } from '@/lib/supabase/calculations'

const propertyTypeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  single_family: Home,
  multi_family: Building2,
  condo: Building,
  townhouse: Building,
  commercial: Store,
  other: Warehouse,
}

const propertyTypeLabels: Record<string, string> = {
  single_family: 'Single Family',
  multi_family: 'Multi Family',
  condo: 'Condo',
  townhouse: 'Townhouse',
  commercial: 'Commercial',
  other: 'Other',
}

export default async function CalculationViewPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?redirect=/calculations/' + id)
  }

  const { calculation, error } = await getCalculationServer(id, user.id)

  if (error || !calculation) {
    notFound()
  }

  const Icon = propertyTypeIcons[calculation.property_type] || Home
  const typeLabel = propertyTypeLabels[calculation.property_type] || 'Property'

  const formatCurrency = (value: number | null | undefined) => {
    if (value == null) return 'N/A'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(value)
  }

  const formatPercent = (value: number | null | undefined) => {
    if (value == null) return 'N/A'
    return `${value.toFixed(2)}%`
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Unknown'
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const location = [calculation.address, calculation.city, calculation.state]
    .filter(Boolean)
    .join(', ')

  return (
    <div className="p-4 lg:p-8 max-w-4xl mx-auto">
      {/* Back link */}
      <Link
        href="/calculations"
        className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Calculations
      </Link>

      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
              <Icon className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                {calculation.title}
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                {typeLabel} {location && `• ${location}`}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                Created {formatDate(calculation.created_at)}
              </p>
            </div>
          </div>
          <Link
            href={`/calculator?id=${calculation.id}`}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
          >
            <Pencil className="w-4 h-4" />
            Edit
          </Link>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Purchase Price</p>
          <p className="text-xl font-bold text-gray-900 dark:text-white">
            {formatCurrency(calculation.purchase_price)}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Monthly Cash Flow</p>
          <p className={`text-xl font-bold ${
            (calculation.monthly_cash_flow ?? 0) >= 0
              ? 'text-green-600 dark:text-green-400'
              : 'text-red-600 dark:text-red-400'
          }`}>
            {formatCurrency(calculation.monthly_cash_flow)}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Cash-on-Cash</p>
          <p className={`text-xl font-bold ${
            (calculation.cash_on_cash_return ?? 0) > 8
              ? 'text-green-600 dark:text-green-400'
              : 'text-gray-900 dark:text-white'
          }`}>
            {formatPercent(calculation.cash_on_cash_return)}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Cap Rate</p>
          <p className={`text-xl font-bold ${
            (calculation.cap_rate ?? 0) > 6
              ? 'text-green-600 dark:text-green-400'
              : 'text-gray-900 dark:text-white'
          }`}>
            {formatPercent(calculation.cap_rate)}
          </p>
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Purchase & Financing */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Purchase & Financing
          </h2>
          <dl className="space-y-3">
            <div className="flex justify-between">
              <dt className="text-gray-600 dark:text-gray-400">Purchase Price</dt>
              <dd className="font-medium text-gray-900 dark:text-white">
                {formatCurrency(calculation.purchase_price)}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-600 dark:text-gray-400">Down Payment</dt>
              <dd className="font-medium text-gray-900 dark:text-white">
                {calculation.down_payment_percent}%
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-600 dark:text-gray-400">Interest Rate</dt>
              <dd className="font-medium text-gray-900 dark:text-white">
                {calculation.interest_rate}%
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-600 dark:text-gray-400">Loan Term</dt>
              <dd className="font-medium text-gray-900 dark:text-white">
                {calculation.loan_term_years} years
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-600 dark:text-gray-400">Closing Costs</dt>
              <dd className="font-medium text-gray-900 dark:text-white">
                {formatCurrency(calculation.closing_costs)}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-600 dark:text-gray-400">Repair Costs</dt>
              <dd className="font-medium text-gray-900 dark:text-white">
                {formatCurrency(calculation.repair_costs)}
              </dd>
            </div>
          </dl>
        </div>

        {/* Income */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Income
          </h2>
          <dl className="space-y-3">
            <div className="flex justify-between">
              <dt className="text-gray-600 dark:text-gray-400">Monthly Rent</dt>
              <dd className="font-medium text-gray-900 dark:text-white">
                {formatCurrency(calculation.monthly_rent)}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-600 dark:text-gray-400">Other Income</dt>
              <dd className="font-medium text-gray-900 dark:text-white">
                {formatCurrency(calculation.other_monthly_income)}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-600 dark:text-gray-400">Vacancy Rate</dt>
              <dd className="font-medium text-gray-900 dark:text-white">
                {calculation.vacancy_rate}%
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-600 dark:text-gray-400">Annual Rent Increase</dt>
              <dd className="font-medium text-gray-900 dark:text-white">
                {calculation.annual_rent_increase}%
              </dd>
            </div>
          </dl>
        </div>

        {/* Expenses */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Expenses
          </h2>
          <dl className="space-y-3">
            <div className="flex justify-between">
              <dt className="text-gray-600 dark:text-gray-400">Property Tax (Annual)</dt>
              <dd className="font-medium text-gray-900 dark:text-white">
                {formatCurrency(calculation.property_tax_annual)}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-600 dark:text-gray-400">Insurance (Annual)</dt>
              <dd className="font-medium text-gray-900 dark:text-white">
                {formatCurrency(calculation.insurance_annual)}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-600 dark:text-gray-400">HOA (Monthly)</dt>
              <dd className="font-medium text-gray-900 dark:text-white">
                {formatCurrency(calculation.hoa_monthly)}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-600 dark:text-gray-400">Maintenance (Monthly)</dt>
              <dd className="font-medium text-gray-900 dark:text-white">
                {formatCurrency(calculation.maintenance_monthly)}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-600 dark:text-gray-400">Property Management</dt>
              <dd className="font-medium text-gray-900 dark:text-white">
                {calculation.property_management_percent}%
              </dd>
            </div>
          </dl>
        </div>

        {/* Investment Summary */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 p-6">
          <h2 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-4">
            Investment Summary
          </h2>
          <dl className="space-y-3">
            <div className="flex justify-between">
              <dt className="text-blue-700 dark:text-blue-300">Total Investment</dt>
              <dd className="font-bold text-blue-900 dark:text-blue-100">
                {formatCurrency(calculation.total_investment)}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-blue-700 dark:text-blue-300">Monthly Mortgage</dt>
              <dd className="font-bold text-blue-900 dark:text-blue-100">
                {formatCurrency(calculation.monthly_mortgage_payment)}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-blue-700 dark:text-blue-300">Annual Cash Flow</dt>
              <dd className="font-bold text-blue-900 dark:text-blue-100">
                {formatCurrency(calculation.annual_cash_flow)}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-blue-700 dark:text-blue-300">Holding Period</dt>
              <dd className="font-bold text-blue-900 dark:text-blue-100">
                {calculation.holding_length} years
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  )
}
