import Link from 'next/link'
import { Check, Sparkles } from 'lucide-react'

/**
 * Open beta: a single free plan with everything included.
 * The original Free/Pro split is recorded in docs/product/tier-plan.html
 * and will return when billing is added.
 */
const features = [
  'Unlimited saved calculations',
  '30-year projections',
  'Side-by-side property comparison',
  'PDF export',
  'Shareable analysis links',
  'Zillow and Redfin import',
  'Core ROI metrics: cash flow, cap rate, CoC, DSCR, IRR',
  'Dark mode',
]

export function PricingSection() {
  return (
    <section id="pricing" className="py-24 lg:py-32 bg-white dark:bg-charcoal-900 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        {/* Section header */}
        <div className="text-center mb-16">
          <p className="text-sm font-medium text-sage-600 dark:text-sage-400 uppercase tracking-wider mb-4">
            Pricing
          </p>
          <h2 className="font-display text-4xl sm:text-5xl font-semibold text-charcoal-900 dark:text-cream-50 leading-tight mb-6">
            Free while we&apos;re in beta
          </h2>
          <p className="text-lg text-charcoal-600 dark:text-cream-200 max-w-xl mx-auto">
            Every feature, no limits, no credit card. We&apos;ll announce paid plans well before anything changes.
          </p>
        </div>

        {/* Single plan card */}
        <div className="max-w-xl mx-auto">
          <div className="relative rounded-3xl p-8 lg:p-10 bg-charcoal-900 dark:bg-cream-100 text-cream-50 dark:text-charcoal-900 shadow-2xl shadow-charcoal-900/20 dark:shadow-cream-100/10">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 inline-flex items-center gap-2 px-4 py-1.5 bg-sage-500 text-white text-sm font-medium rounded-full">
              <Sparkles className="w-4 h-4" />
              Open beta
            </div>

            <div className="mb-8">
              <h3 className="font-display text-2xl font-semibold mb-2 text-cream-50 dark:text-charcoal-900">
                Everything
              </h3>
              <div className="flex items-baseline gap-1 mb-3">
                <span className="font-display text-5xl font-semibold text-cream-50 dark:text-charcoal-900">
                  $0
                </span>
                <span className="text-cream-200 dark:text-charcoal-600">during beta</span>
              </div>
              <p className="text-cream-100 dark:text-charcoal-600">
                The full toolkit for analyzing rental deals, from first look to side-by-side comparison.
              </p>
            </div>

            <ul className="space-y-4 mb-10">
              {features.map((feature) => (
                <li key={feature} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 bg-sage-500 dark:bg-sage-600">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-cream-100 dark:text-charcoal-700">{feature}</span>
                </li>
              ))}
            </ul>

            <Link
              href="/signup"
              className="block w-full py-4 text-center font-medium rounded-full transition-all hover:-translate-y-0.5 bg-cream-50 dark:bg-charcoal-900 text-charcoal-900 dark:text-cream-50 hover:bg-white dark:hover:bg-charcoal-800 hover:shadow-lg"
            >
              Start for free
            </Link>
          </div>
        </div>

        {/* Trust note */}
        <p className="text-center text-sm text-charcoal-500 dark:text-cream-300/50 mt-12">
          Beta users keep their saved calculations when paid plans arrive.
        </p>
      </div>
    </section>
  )
}
