import { Skeleton } from '@/components/ui/skeleton'

export function CalculationCardSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-start gap-3">
          <Skeleton className="w-9 h-9 rounded-lg" />
          <div className="flex-1 min-w-0">
            <Skeleton className="h-5 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/2" />
          </div>
          <Skeleton className="h-5 w-24" />
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-3 divide-x divide-gray-100 dark:divide-gray-700 bg-gray-50 dark:bg-gray-800/50">
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-3 flex flex-col items-center">
            <Skeleton className="h-3 w-16 mb-2" />
            <Skeleton className="h-4 w-12" />
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="p-3 flex items-center justify-between border-t border-gray-100 dark:border-gray-700">
        <Skeleton className="h-3 w-24" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-8 rounded" />
          <Skeleton className="h-8 w-8 rounded" />
          <Skeleton className="h-8 w-8 rounded" />
        </div>
      </div>
    </div>
  )
}

export function CalculationsGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <CalculationCardSkeleton key={i} />
      ))}
    </div>
  )
}
