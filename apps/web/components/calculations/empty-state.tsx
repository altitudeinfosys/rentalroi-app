import Link from 'next/link'
import { Calculator, FileText } from 'lucide-react'

export function EmptyState() {
  return (
    <div className="text-center py-16 px-4">
      <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
        <FileText className="w-8 h-8 text-gray-400 dark:text-gray-500" />
      </div>
      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
        No calculations yet
      </h3>
      <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
        Start analyzing rental properties to build your investment portfolio. Your saved calculations will appear here.
      </p>
      <Link
        href="/calculator"
        className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
      >
        <Calculator className="w-5 h-5" />
        Create Your First Calculation
      </Link>
    </div>
  )
}
