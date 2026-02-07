import { Metadata } from 'next'
import Link from 'next/link'
import { getSharedCalculation, recordView } from '@/lib/supabase/shared-links'
import { SharedCalculationView } from '@/components/shared/shared-calculation-view'

interface SharedPageProps {
  params: Promise<{ token: string }>
}

export async function generateMetadata({ params }: SharedPageProps): Promise<Metadata> {
  const { token } = await params
  const result = await getSharedCalculation(token)

  if ('error' in result) {
    return {
      title: 'Shared Calculation | RentalROI',
    }
  }

  return {
    title: `${result.calculation.title} | RentalROI`,
    description: `View this rental property analysis: ${result.calculation.title}`,
  }
}

export default async function SharedPage({ params }: SharedPageProps) {
  const { token } = await params
  const result = await getSharedCalculation(token)

  // Handle errors
  if ('error' in result) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
            {result.expired ? (
              <>
                <div className="text-6xl mb-4">⏰</div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Link Expired
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  This shared calculation link has expired. Shared links are valid for 30 days.
                </p>
              </>
            ) : (
              <>
                <div className="text-6xl mb-4">🔗</div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Link Not Found
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  This shared calculation link doesn&apos;t exist or may have been deleted.
                </p>
              </>
            )}

            <div className="space-y-3">
              <Link
                href="/calculator"
                className="block w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
              >
                Create Your Own Calculation
              </Link>
              <Link
                href="/"
                className="block w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-medium rounded-lg transition-colors"
              >
                Go to Homepage
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Record the view (fire and forget)
  recordView(token)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      <SharedCalculationView
        calculation={result.calculation}
        expiresAt={result.expiresAt}
      />
    </div>
  )
}
