'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Menu, X } from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'

const navLinks = [
  { label: 'Features', href: '#features' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'FAQ', href: '#faq' },
]

export function MarketingHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
      scrolled
        ? 'bg-cream-50/95 dark:bg-charcoal-950/95 backdrop-blur-md border-b border-cream-300 dark:border-charcoal-800'
        : 'bg-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link href="/" className="group flex items-center gap-2">
            <span className="font-display text-2xl font-semibold text-charcoal-900 dark:text-cream-100 tracking-tight">
              Rental<span className="text-sage-600 dark:text-sage-400">ROI</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-12">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="relative text-sm font-medium text-charcoal-700 dark:text-cream-200 hover:text-charcoal-900 dark:hover:text-white transition-colors after:absolute after:left-0 after:-bottom-1 after:h-px after:w-0 after:bg-sage-600 dark:after:bg-sage-400 after:transition-all hover:after:w-full"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Desktop CTAs */}
          <div className="hidden md:flex items-center gap-6">
            <ThemeToggle />
            <Link
              href="/login"
              className="text-sm font-medium text-charcoal-700 dark:text-cream-200 hover:text-charcoal-900 dark:hover:text-white transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="px-5 py-2.5 bg-charcoal-900 dark:bg-cream-100 text-cream-50 dark:text-charcoal-900 text-sm font-medium rounded-full hover:bg-charcoal-800 dark:hover:bg-white transition-all hover:shadow-lg hover:-translate-y-0.5"
            >
              Get Started
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center gap-4 md:hidden">
            <ThemeToggle />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-charcoal-700 dark:text-cream-200"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <div className={`md:hidden overflow-hidden transition-all duration-300 ${
          mobileMenuOpen ? 'max-h-80 pb-6' : 'max-h-0'
        }`}>
          <nav className="flex flex-col gap-4 pt-4 border-t border-cream-300 dark:border-charcoal-800">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="text-base font-medium text-charcoal-700 dark:text-cream-200"
              >
                {link.label}
              </a>
            ))}
            <div className="flex flex-col gap-3 pt-4 border-t border-cream-200 dark:border-charcoal-800">
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="text-base font-medium text-charcoal-700 dark:text-cream-200"
              >
                Sign in
              </Link>
              <Link
                href="/signup"
                onClick={() => setMobileMenuOpen(false)}
                className="px-5 py-3 bg-charcoal-900 dark:bg-cream-100 text-cream-50 dark:text-charcoal-900 text-sm font-medium rounded-full text-center"
              >
                Get Started
              </Link>
            </div>
          </nav>
        </div>
      </div>
    </header>
  )
}
