'use client'

import { useRef } from 'react'
import {
  Calculator,
  TrendingUp,
  Calendar,
  Save,
  Share2,
  Sparkles
} from 'lucide-react'

const features = [
  {
    icon: Calculator,
    title: 'Cash Flow Analysis',
    description: 'Break down every expense—mortgage, taxes, insurance, maintenance—and see exactly what hits your pocket each month.',
    accent: 'bg-sage-500/10 text-sage-600 dark:bg-sage-400/10 dark:text-sage-400',
  },
  {
    icon: TrendingUp,
    title: 'ROI Metrics',
    description: 'Cap rate, cash-on-cash return, total ROI—all the metrics serious investors use to compare opportunities.',
    accent: 'bg-amber-500/10 text-amber-600 dark:bg-amber-400/10 dark:text-amber-400',
  },
  {
    icon: Calendar,
    title: 'Multi-Year Projections',
    description: 'See how rent increases, loan paydown, and appreciation compound your returns over 5, 10, or 30 years.',
    accent: 'bg-sky-500/10 text-sky-600 dark:bg-sky-400/10 dark:text-sky-400',
  },
  {
    icon: Save,
    title: 'Save & Compare',
    description: 'Build a portfolio of analyzed properties. Compare them side-by-side to find your best investment.',
    accent: 'bg-violet-500/10 text-violet-600 dark:bg-violet-400/10 dark:text-violet-400',
  },
  {
    icon: Share2,
    title: 'Instant Sharing',
    description: 'Generate a link and share your complete analysis with partners, agents, or lenders in seconds.',
    accent: 'bg-rose-500/10 text-rose-600 dark:bg-rose-400/10 dark:text-rose-400',
  },
  {
    icon: Sparkles,
    title: 'Beautiful Reports',
    description: 'Professional-grade reports that make complex numbers easy to understand and present.',
    accent: 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-400',
  },
]

export function FeaturesGrid() {
  const containerRef = useRef<HTMLDivElement>(null)

  return (
    <section id="features" className="py-24 lg:py-32 bg-white dark:bg-charcoal-900 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-sage-400/5 dark:bg-sage-400/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-6 lg:px-12">
        {/* Section header */}
        <div className="max-w-3xl mb-20">
          <p className="text-sm font-medium text-sage-600 dark:text-sage-400 uppercase tracking-wider mb-4">
            Features
          </p>
          <h2 className="font-display text-4xl sm:text-5xl font-semibold text-charcoal-900 dark:text-cream-50 leading-tight mb-6">
            Everything you need to analyze
            <span className="text-charcoal-400 dark:text-charcoal-700"> with confidence</span>
          </h2>
          <p className="text-lg text-charcoal-600 dark:text-cream-200 leading-relaxed">
            Professional-grade tools that were previously only available to institutional investors, now accessible to everyone.
          </p>
        </div>

        {/* Features grid */}
        <div ref={containerRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <div
                key={feature.title}
                className="group relative bg-cream-50 dark:bg-charcoal-800 rounded-3xl p-8 transition-all duration-300 hover:bg-cream-100 dark:hover:bg-charcoal-700 hover:-translate-y-1 hover:shadow-xl hover:shadow-charcoal-900/5 dark:hover:shadow-black/20"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Icon */}
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 ${feature.accent}`}>
                  <Icon className="w-7 h-7" />
                </div>

                {/* Content */}
                <h3 className="font-display text-xl font-semibold text-charcoal-900 dark:text-cream-50 mb-3">
                  {feature.title}
                </h3>
                <p className="text-charcoal-600 dark:text-cream-200 leading-relaxed">
                  {feature.description}
                </p>

                {/* Hover indicator */}
                <div className="absolute bottom-8 right-8 w-8 h-8 rounded-full bg-charcoal-900/5 dark:bg-cream-100/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-charcoal-400 dark:text-cream-300/60">→</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
