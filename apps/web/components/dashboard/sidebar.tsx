'use client'

import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Home, Calculator, History, Settings, X, PlusCircle } from 'lucide-react'

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

const navItems = [
  {
    label: 'Overview',
    href: '/dashboard',
    icon: Home,
  },
  {
    label: 'My Calculations',
    href: '/calculations',
    icon: History,
  },
  {
    label: 'Settings',
    href: '/settings',
    icon: Settings,
  },
]

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()

  const handleNewCalculation = () => {
    // Clear localStorage draft
    localStorage.removeItem('calculator_draft')
    onClose()

    // If already on calculator page, force reload
    if (pathname === '/calculator' || pathname?.startsWith('/calculator')) {
      window.location.href = '/calculator'
    } else {
      router.push('/calculator')
    }
  }

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-50
          w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Mobile close button */}
        <div className="flex items-center justify-between p-4 lg:hidden">
          <span className="text-xl font-bold text-gray-900 dark:text-white">
            RentalROI
          </span>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Logo (desktop) */}
        <div className="hidden lg:flex items-center h-16 px-6 border-b border-gray-200 dark:border-gray-700">
          <Link href="/dashboard" className="text-xl font-bold text-gray-900 dark:text-white">
            RentalROI
          </Link>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-lg
                  text-sm font-medium transition-colors
                  ${
                    isActive
                      ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }
                `}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </Link>
            )
          })}

          {/* New Calculation - special handling to clear form */}
          <button
            onClick={handleNewCalculation}
            className={`
              w-full flex items-center gap-3 px-4 py-3 rounded-lg
              text-sm font-medium transition-colors
              ${
                pathname === '/calculator'
                  ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }
            `}
          >
            <PlusCircle className="w-5 h-5" />
            New Calculation
          </button>
        </nav>

        {/* Upgrade banner (for free users) */}
        <div className="absolute bottom-4 left-4 right-4">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg p-4 text-white">
            <p className="font-semibold text-sm mb-1">Upgrade to Pro</p>
            <p className="text-xs text-blue-100 mb-3">
              Unlock unlimited calculations and advanced features
            </p>
            <button className="w-full py-2 bg-white text-blue-600 rounded-lg text-sm font-semibold hover:bg-blue-50 transition-colors">
              Learn More
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}
