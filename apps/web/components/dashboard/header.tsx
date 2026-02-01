'use client'

import { Menu } from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'
import { UserMenu } from './user-menu'
import type { User } from '@supabase/supabase-js'

interface HeaderProps {
  user: User | null
  onMenuClick: () => void
}

export function Header({ user, onMenuClick }: HeaderProps) {
  return (
    <header className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4 lg:px-6">
      {/* Left side - menu button (mobile) and title */}
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          aria-label="Toggle navigation menu"
          className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 lg:hidden"
        >
          <Menu className="w-6 h-6" />
        </button>
        <h1 className="text-lg font-semibold text-gray-900 dark:text-white hidden sm:block">
          Dashboard
        </h1>
      </div>

      {/* Right side - theme toggle and user menu */}
      <div className="flex items-center gap-3">
        <ThemeToggle />
        <UserMenu user={user} />
      </div>
    </header>
  )
}
