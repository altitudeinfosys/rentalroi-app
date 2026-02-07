'use client'

import Link from 'next/link'
import { Home, Building2, Building, Warehouse, Store, HelpCircle, Pencil, Trash2, Eye } from 'lucide-react'

interface CalculationCardProps {
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
  onDelete: (id: string) => void
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

export function CalculationCard({ calculation, onDelete }: CalculationCardProps) {
  const Icon = propertyTypeIcons[calculation.propertyType] || HelpCircle
  const typeLabel = propertyTypeLabels[calculation.propertyType] || 'Property'

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(value)
  }

  const formatPercent = (value: number | null | undefined) => {
    if (value == null) return 'N/A'
    return `${value.toFixed(1)}%`
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Unknown'
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const location = [calculation.city, calculation.state].filter(Boolean).join(', ')

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-shadow">
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
              {typeLabel} {location && `• ${location}`}
            </p>
            {calculation.address && (
              <p className="text-sm text-gray-500 dark:text-gray-400 truncate mt-0.5">
                {calculation.address}
              </p>
            )}
          </div>
          <div className="text-right">
            <p className="font-bold text-gray-900 dark:text-white">
              {formatCurrency(calculation.purchasePrice)}
            </p>
          </div>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-3 divide-x divide-gray-100 dark:divide-gray-700 bg-gray-50 dark:bg-gray-800/50">
        <div className="p-3 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Cash-on-Cash</p>
          <p className={`text-sm font-bold ${
            (calculation.cashOnCashReturn ?? 0) > 8
              ? 'text-green-600 dark:text-green-400'
              : (calculation.cashOnCashReturn ?? 0) > 4
              ? 'text-blue-600 dark:text-blue-400'
              : 'text-gray-900 dark:text-white'
          }`}>
            {formatPercent(calculation.cashOnCashReturn)}
          </p>
        </div>
        <div className="p-3 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Cap Rate</p>
          <p className={`text-sm font-bold ${
            (calculation.capRate ?? 0) > 6
              ? 'text-green-600 dark:text-green-400'
              : (calculation.capRate ?? 0) > 4
              ? 'text-blue-600 dark:text-blue-400'
              : 'text-gray-900 dark:text-white'
          }`}>
            {formatPercent(calculation.capRate)}
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

      {/* Footer */}
      <div className="p-3 flex items-center justify-between border-t border-gray-100 dark:border-gray-700">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Created {formatDate(calculation.createdAt)}
        </p>
        <div className="flex items-center gap-1">
          <Link
            href={`/calculations/${calculation.id}`}
            className="p-2 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors"
            title="View"
          >
            <Eye className="w-4 h-4" />
          </Link>
          <Link
            href={`/calculator?id=${calculation.id}`}
            className="p-2 text-gray-500 hover:text-green-600 dark:text-gray-400 dark:hover:text-green-400 transition-colors"
            title="Edit"
          >
            <Pencil className="w-4 h-4" />
          </Link>
          <button
            onClick={() => onDelete(calculation.id)}
            className="p-2 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 transition-colors"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
