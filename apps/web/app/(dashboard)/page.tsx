import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Calculator, History, TrendingUp, ArrowRight } from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto">
      {/* Welcome section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          {user ? `Welcome back${user.user_metadata?.full_name ? `, ${user.user_metadata.full_name.split(' ')[0]}` : ''}!` : 'Welcome to RentalROI'}
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          {user
            ? 'Analyze rental properties and make data-driven investment decisions.'
            : 'Sign in to save your calculations and access advanced features.'}
        </p>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {/* New Calculation */}
        <Link
          href="/calculator"
          className="group bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl p-6 text-white hover:shadow-lg transition-all"
        >
          <div className="flex items-center justify-between mb-4">
            <Calculator className="w-10 h-10" />
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </div>
          <h3 className="text-xl font-semibold mb-2">New Calculation</h3>
          <p className="text-blue-100 text-sm">
            Analyze a new rental property investment
          </p>
        </Link>

        {/* My Calculations */}
        <Link
          href="/calculations"
          className="group bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-lg transition-all"
        >
          <div className="flex items-center justify-between mb-4">
            <History className="w-10 h-10 text-green-600 dark:text-green-400" />
            <ArrowRight className="w-5 h-5 text-gray-400 group-hover:translate-x-1 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-all" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            My Calculations
          </h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            {user ? 'View and manage your saved analyses' : 'Sign in to view saved calculations'}
          </p>
        </Link>

        {/* Learn */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <TrendingUp className="w-10 h-10 text-purple-600 dark:text-purple-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Investment Metrics
          </h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
            Learn about cash-on-cash return, cap rate, and other key metrics
          </p>
          <span className="text-sm text-purple-600 dark:text-purple-400 font-medium">
            Coming soon
          </span>
        </div>
      </div>

      {/* Getting started guide for non-authenticated users */}
      {!user && (
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
          <h2 className="text-xl font-semibold text-blue-900 dark:text-blue-100 mb-4">
            Get Started
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0">
                1
              </div>
              <div>
                <p className="font-medium text-blue-900 dark:text-blue-100">
                  Enter Property Details
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Input purchase price, financing, and rental income
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0">
                2
              </div>
              <div>
                <p className="font-medium text-blue-900 dark:text-blue-100">
                  Review Analysis
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  See cash flow, returns, and multi-year projections
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0">
                3
              </div>
              <div>
                <p className="font-medium text-blue-900 dark:text-blue-100">
                  Save & Compare
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Sign up to save calculations and compare properties
                </p>
              </div>
            </div>
          </div>
          <div className="mt-6 flex gap-4">
            <Link
              href="/calculator"
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Start Calculator
            </Link>
            <Link
              href="/signup"
              className="px-6 py-3 bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 rounded-lg font-semibold border border-blue-300 dark:border-blue-600 hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors"
            >
              Create Account
            </Link>
          </div>
        </div>
      )}

      {/* Recent calculations for authenticated users (placeholder) */}
      {user && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Recent Calculations
            </h2>
            <Link
              href="/calculations"
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              View all
            </Link>
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Your recent calculations will appear here once you save them.
          </p>
        </div>
      )}
    </div>
  )
}
