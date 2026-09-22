'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Loader2, GitCompareArrows } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { getCalculations, deleteCalculation } from '@/lib/supabase/calculations'
import { CalculationCard } from '@/components/calculations/calculation-card'
import { SelectableCard } from '@/components/comparison/selectable-card'
import { CalculationsGridSkeleton } from '@/components/calculations/calculation-card-skeleton'
import { EmptyState } from '@/components/calculations/empty-state'
import { DeleteDialog } from '@/components/calculations/delete-dialog'
import { ToastContainer } from '@/components/ui/toast'
import { useToast } from '@/lib/hooks/use-toast'
import type { User } from '@supabase/supabase-js'

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

export default function CalculationsPage() {
  const router = useRouter()
  const { toasts, removeToast, success, error } = useToast()

  const [user, setUser] = useState<User | null>(null)
  const [calculations, setCalculations] = useState<CalculationSummary[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [isLoadingMore, setIsLoadingMore] = useState(false)

  // Delete dialog state
  const [deleteTarget, setDeleteTarget] = useState<CalculationSummary | null>(null)

  // Compare mode state
  const [compareMode, setCompareMode] = useState(false)
  const [compareIds, setCompareIds] = useState<Set<string>>(new Set())

  const ITEMS_PER_PAGE = 12

  // Load user
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.push('/login?redirect=/calculations')
        return
      }
      setUser(user)
    })
  }, [router])

  // Load calculations
  const loadCalculations = useCallback(async (pageNum: number, append: boolean = false) => {
    if (!user) return

    const offset = pageNum * ITEMS_PER_PAGE

    const result = await getCalculations(user.id, {
      limit: ITEMS_PER_PAGE,
      offset,
    })

    if ('error' in result && result.error) {
      error('Failed to load calculations', result.error)
      return
    }

    if (append) {
      setCalculations((prev) => [...prev, ...result.calculations])
    } else {
      setCalculations(result.calculations)
    }
    setTotal(result.total)
  }, [user, error])

  useEffect(() => {
    if (user) {
      setIsLoading(true)
      loadCalculations(0).finally(() => setIsLoading(false))
    }
  }, [user, loadCalculations])

  const handleLoadMore = async () => {
    const nextPage = page + 1
    setIsLoadingMore(true)
    await loadCalculations(nextPage, true)
    setPage(nextPage)
    setIsLoadingMore(false)
  }

  const handleDelete = async () => {
    if (!deleteTarget || !user) return

    const result = await deleteCalculation(deleteTarget.id, user.id)

    if ('error' in result) {
      error('Failed to delete', result.error)
      setDeleteTarget(null)
      return
    }

    success('Calculation deleted', `"${deleteTarget.title}" has been removed.`)
    setCalculations((prev) => prev.filter((c) => c.id !== deleteTarget.id))
    setTotal((prev) => prev - 1)
    setDeleteTarget(null)
  }

  const handleCompareToggle = (id: string) => {
    setCompareIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else if (next.size < 4) {
        next.add(id)
      }
      return next
    })
  }

  const handleGoCompare = () => {
    const ids = Array.from(compareIds).join(',')
    router.push(`/compare?ids=${ids}`)
  }

  const hasMore = calculations.length < total

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
            My Calculations
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {total === 0
              ? 'No saved calculations'
              : `${total} calculation${total === 1 ? '' : 's'} saved`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {calculations.length >= 2 && (
            <button
              onClick={() => {
                setCompareMode(!compareMode)
                setCompareIds(new Set())
              }}
              className={`inline-flex items-center gap-2 px-4 py-2 font-semibold rounded-lg transition-colors text-sm ${
                compareMode
                  ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 border border-blue-300 dark:border-blue-700'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              <GitCompareArrows className="w-4 h-4" />
              Compare
            </button>
          )}
          <Link
            href="/calculator"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
          >
            <Plus className="w-5 h-5" />
            New Calculation
          </Link>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <CalculationsGridSkeleton count={6} />
      ) : calculations.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          {/* Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {calculations.map((calc) =>
              compareMode ? (
                <SelectableCard
                  key={calc.id}
                  calculation={calc}
                  selected={compareIds.has(calc.id)}
                  onToggle={handleCompareToggle}
                  disabled={compareIds.size >= 4}
                />
              ) : (
                <CalculationCard
                  key={calc.id}
                  calculation={calc}
                  onDelete={() => setDeleteTarget(calc)}
                />
              )
            )}
          </div>

          {/* Compare Sticky Bar */}
          {compareMode && compareIds.size > 0 && (
            <div className="fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-lg">
              <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {compareIds.size} selected
                </span>
                <button
                  onClick={handleGoCompare}
                  disabled={compareIds.size < 2}
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:dark:bg-gray-600 text-white font-semibold rounded-lg transition-colors disabled:cursor-not-allowed"
                >
                  <GitCompareArrows className="w-4 h-4" />
                  Compare {compareIds.size} Properties
                </button>
              </div>
            </div>
          )}

          {/* Load More */}
          {hasMore && (
            <div className="mt-8 text-center">
              <button
                onClick={handleLoadMore}
                disabled={isLoadingMore}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-lg transition-colors disabled:opacity-50"
              >
                {isLoadingMore ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  `Load More (${total - calculations.length} remaining)`
                )}
              </button>
            </div>
          )}
        </>
      )}

      {/* Delete Dialog */}
      <DeleteDialog
        isOpen={!!deleteTarget}
        title={deleteTarget?.title || ''}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  )
}
