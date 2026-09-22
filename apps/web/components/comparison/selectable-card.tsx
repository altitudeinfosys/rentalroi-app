'use client'

import { Home, Building2, Building, Warehouse, Store, HelpCircle, Check } from 'lucide-react'

interface SelectableCardProps {
  calculation: {
    id: string
    title: string
    propertyType: string
    address?: string | null
    city?: string | null
    state?: string | null
    purchasePrice: number
    monthlyCashFlow?: number | null
    cashOnCashReturn?: number | null
    capRate?: number | null
    createdAt?: string
  }
  selected: boolean
  onToggle: (id: string) => void
  disabled?: boolean
}

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

export function SelectableCard({ calculation, selected, onToggle, disabled }: SelectableCardProps) {
  const Icon = propertyTypeIcons[calculation.propertyType] || HelpCircle
  const typeLabel = propertyTypeLabels[calculation.propertyType] || 'Property'

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(value)

  const formatPercent = (value: number | null | undefined) => {
    if (value == null) return 'N/A'
    return `${value.toFixed(1)}%`
  }

  const location = [calculation.city, calculation.state].filter(Boolean).join(', ')

  return (
    <button
      type="button"
      onClick={() => onToggle(calculation.id)}
      disabled={disabled && !selected}
      className={`
        w-full text-left rounded-lg border-2 overflow-hidden transition-all
        ${
          selected
            ? 'border-blue-500 ring-2 ring-blue-200 dark:ring-blue-800'
            : disabled
            ? 'border-gray-200 dark:border-gray-700 opacity-50 cursor-not-allowed'
            : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-md cursor-pointer'
        }
        bg-white dark:bg-gray-800
      `}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
            <Icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 dark:text-white truncate">
              {calculation.title}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {typeLabel} {location && `\u2022 ${location}`}
            </p>
          </div>
          {/* Checkbox */}
          <div
            className={`
              w-6 h-6 rounded-md border-2 flex items-center justify-center flex-shrink-0
              ${
                selected
                  ? 'bg-blue-600 border-blue-600'
                  : 'border-gray-300 dark:border-gray-600'
              }
            `}
          >
            {selected && <Check className="w-4 h-4 text-white" />}
          </div>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-3 divide-x divide-gray-100 dark:divide-gray-700 bg-gray-50 dark:bg-gray-800/50">
        <div className="p-3 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Price</p>
          <p className="text-sm font-bold text-gray-900 dark:text-white">
            {formatCurrency(calculation.purchasePrice)}
          </p>
        </div>
        <div className="p-3 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">CoC</p>
          <p className={`text-sm font-bold ${
            (calculation.cashOnCashReturn ?? 0) > 8
              ? 'text-green-600 dark:text-green-400'
              : 'text-gray-900 dark:text-white'
          }`}>
            {formatPercent(calculation.cashOnCashReturn)}
          </p>
        </div>
        <div className="p-3 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Monthly CF</p>
          <p className={`text-sm font-bold ${
            (calculation.monthlyCashFlow ?? 0) > 0
              ? 'text-green-600 dark:text-green-400'
              : 'text-red-600 dark:text-red-400'
          }`}>
            {calculation.monthlyCashFlow != null
              ? formatCurrency(calculation.monthlyCashFlow)
              : 'N/A'}
          </p>
        </div>
      </div>
    </button>
  )
}
