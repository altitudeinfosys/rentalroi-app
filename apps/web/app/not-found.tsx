import { FileQuestion, Home, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-cream-50 dark:bg-charcoal-950 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 mb-4">
            <FileQuestion className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
          <h1 className="text-6xl font-display font-bold text-charcoal-900 dark:text-cream-50 mb-2">
            404
          </h1>
          <h2 className="text-xl font-semibold text-charcoal-700 dark:text-cream-200 mb-2">
            Page Not Found
          </h2>
          <p className="text-charcoal-600 dark:text-cream-300">
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
          >
            <Home className="w-4 h-4" />
            Go Home
          </Link>
          <button
            onClick={() => typeof window !== 'undefined' && window.history.back()}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-white dark:bg-charcoal-800 text-charcoal-700 dark:text-cream-200 font-semibold rounded-lg border border-charcoal-200 dark:border-charcoal-700 hover:bg-charcoal-50 dark:hover:bg-charcoal-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </button>
        </div>
      </div>
    </div>
  )
}
