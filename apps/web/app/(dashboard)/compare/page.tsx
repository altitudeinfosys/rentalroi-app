'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2, GitCompareArrows } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { getCalculations, getCalculation } from '@/lib/supabase/calculations'
import { dbToForm } from '@/lib/mappers/calculation-mapper'
import { SelectableCard } from '@/components/comparison/selectable-card'
import { ComparisonView } from '@/components/comparison/comparison-view'
import { CalculationsGridSkeleton } from '@/components/calculations/calculation-card-skeleton'
import type { User } from '@supabase/supabase-js'
import type { CalculatorFormData } from '@/lib/validation/calculator-schema'

interface CalculationSummary {
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

interface PropertyData {
  id: string
  formData: CalculatorFormData
}

const MAX_COMPARE = 4
const MIN_COMPARE = 2

function CompareContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [user, setUser] = useState<User | null>(null)
  const [calculations, setCalculations] = useState<CalculationSummary[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [mode, setMode] = useState<'select' | 'compare'>('select')
  const [comparisonData, setComparisonData] = useState<PropertyData[]>([])
  const [isLoadingComparison, setIsLoadingComparison] = useState(false)

  // Load user
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.push('/login?redirect=/compare')
        return
      }
      setUser(user)
    })
  }, [router])

  // Parse pre-selected IDs from URL
  useEffect(() => {
    const idsParam = searchParams.get('ids')
    if (idsParam) {
      const ids = idsParam.split(',').filter(Boolean)
      setSelectedIds(new Set(ids.slice(0, MAX_COMPARE)))
    }
  }, [searchParams])

  // Load calculations
  const loadCalculations = useCallback(async () => {
    if (!user) return
    const result = await getCalculations(user.id, { limit: 100 })
    if (!('error' in result) || !result.error) {
      setCalculations(result.calculations)
    }
    setIsLoading(false)
  }, [user])

  useEffect(() => {
    if (user) {
      loadCalculations()
    }
  }, [user, loadCalculations])

  // Auto-compare if IDs came from URL and we have data
  useEffect(() => {
    if (selectedIds.size >= MIN_COMPARE && calculations.length > 0 && searchParams.get('ids')) {
      // Verify all selected IDs exist in calculations
      const allExist = Array.from(selectedIds).every((id) =>
        calculations.some((c) => c.id === id)
      )
      if (allExist && mode === 'select') {
        handleCompare()
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [calculations, selectedIds])

  const handleToggle = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else if (next.size < MAX_COMPARE) {
        next.add(id)
      }
      return next
    })
  }

  const handleCompare = async () => {
    if (!user || selectedIds.size < MIN_COMPARE) return

    setIsLoadingComparison(true)
    const ids = Array.from(selectedIds)

    try {
      const results = await Promise.all(
        ids.map((id) => getCalculation(id, user.id))
      )

      const propertyData: PropertyData[] = results
        .filter((r) => r.calculation)
        .map((r) => ({
          id: r.calculation!.id!,
          formData: dbToForm(r.calculation!),
        }))

      if (propertyData.length >= MIN_COMPARE) {
        setComparisonData(propertyData)
        setMode('compare')
      }
    } catch {
      console.error('Error loading comparison data')
    } finally {
      setIsLoadingComparison(false)
    }
  }

  const handleBack = () => {
    setMode('select')
    setComparisonData([])
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  // Comparison view
  if (mode === 'compare' && comparisonData.length >= MIN_COMPARE) {
    return (
      <div className="p-4 lg:p-8 max-w-7xl mx-auto">
        <ComparisonView properties={comparisonData} onBack={handleBack} />
      </div>
    )
  }

  // Selection view
  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <GitCompareArrows className="w-7 h-7 text-blue-600 dark:text-blue-400" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Compare Properties
          </h1>
        </div>
        <p className="text-gray-600 dark:text-gray-400">
          Select {MIN_COMPARE} to {MAX_COMPARE} properties to compare side by side
        </p>
      </div>

      {/* Content */}
      {isLoading ? (
        <CalculationsGridSkeleton count={6} />
      ) : calculations.length === 0 ? (
        <div className="text-center py-16">
          <GitCompareArrows className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            No calculations yet
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Save at least {MIN_COMPARE} calculations to start comparing
          </p>
          <button
            onClick={() => router.push('/calculator')}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
          >
            Create Calculation
          </button>
        </div>
      ) : (
        <>
          {/* Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {calculations.map((calc) => (
              <SelectableCard
                key={calc.id}
                calculation={calc}
                selected={selectedIds.has(calc.id)}
                onToggle={handleToggle}
                disabled={selectedIds.size >= MAX_COMPARE}
              />
            ))}
          </div>

          {/* Sticky Bottom Bar */}
          {selectedIds.size > 0 && (
            <div className="no-print fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-lg">
              <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {selectedIds.size} of {MAX_COMPARE} selected
                  </span>
                  <button
                    onClick={() => setSelectedIds(new Set())}
                    className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    Clear
                  </button>
                </div>
                <button
                  onClick={handleCompare}
                  disabled={selectedIds.size < MIN_COMPARE || isLoadingComparison}
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:dark:bg-gray-600 text-white font-semibold rounded-lg transition-colors disabled:cursor-not-allowed"
                >
                  {isLoadingComparison ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <GitCompareArrows className="w-4 h-4" />
                      Compare
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default function ComparePage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      }
    >
      <CompareContent />
    </Suspense>
  )
}
