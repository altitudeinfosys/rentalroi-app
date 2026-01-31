import Link from 'next/link'
import { Check, Zap } from 'lucide-react'

const tiers = [
  {
    name: 'Free',
    price: '$0',
    period: '',
    description: 'Everything you need to analyze your first deals.',
    features: [
      '3 saved calculations',
      '5-year projections',
      'Shareable analysis links',
      'Core ROI metrics',
      'Dark mode',
    ],
    cta: 'Start free',
    href: '/signup',
    featured: false,
  },
  {
    name: 'Pro',
    price: '$9.99',
    period: '/mo',
    description: 'For serious investors building a portfolio.',
    features: [
      'Unlimited calculations',
      '30-year projections',
      'Side-by-side comparison',
      'PDF reports',
      'Advanced analytics',
      'Priority support',
    ],
    cta: 'Upgrade to Pro',
    href: '/signup?plan=pro',
    featured: true,
  },
]

export function PricingSection() {
  return (
    <section id="pricing" className="py-24 lg:py-32 bg-white dark:bg-charcoal-900 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        {/* Section header */}
        <div className="text-center mb-20">
          <p className="text-sm font-medium text-sage-600 dark:text-sage-400 uppercase tracking-wider mb-4">
            Pricing
          </p>
          <h2 className="font-display text-4xl sm:text-5xl font-semibold text-charcoal-900 dark:text-cream-50 leading-tight mb-6">
            Simple, honest pricing
          </h2>
          <p className="text-lg text-charcoal-600 dark:text-cream-200 max-w-xl mx-auto">
            Start free, upgrade when you&apos;re ready. No hidden fees, no surprises.
          </p>
        </div>

        {/* Pricing cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={`relative rounded-3xl p-8 lg:p-10 transition-all ${
                tier.featured
                  ? 'bg-charcoal-900 dark:bg-cream-100 text-cream-50 dark:text-charcoal-900 shadow-2xl shadow-charcoal-900/20 dark:shadow-cream-100/10 scale-[1.02]'
                  : 'bg-cream-50 dark:bg-charcoal-800 border border-cream-200 dark:border-charcoal-700'
              }`}
            >
              {tier.featured && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 inline-flex items-center gap-2 px-4 py-1.5 bg-sage-500 text-white text-sm font-medium rounded-full">
                  <Zap className="w-4 h-4" />
                  Most popular
                </div>
              )}

              <div className="mb-8">
                <h3 className={`font-display text-2xl font-semibold mb-2 ${
                  tier.featured ? 'text-cream-50 dark:text-charcoal-900' : 'text-charcoal-900 dark:text-cream-50'
                }`}>
                  {tier.name}
                </h3>
                <div className="flex items-baseline gap-1 mb-3">
                  <span className={`font-display text-5xl font-semibold ${
                    tier.featured ? 'text-cream-50 dark:text-charcoal-900' : 'text-charcoal-900 dark:text-cream-50'
                  }`}>
                    {tier.price}
                  </span>
                  {tier.period && (
                    <span className={tier.featured ? 'text-cream-200 dark:text-charcoal-600' : 'text-charcoal-500 dark:text-cream-300/60'}>
                      {tier.period}
                    </span>
                  )}
                </div>
                <p className={tier.featured ? 'text-cream-100 dark:text-charcoal-600' : 'text-charcoal-600 dark:text-cream-200'}>
                  {tier.description}
                </p>
              </div>

              <ul className="space-y-4 mb-10">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      tier.featured
                        ? 'bg-sage-500 dark:bg-sage-600'
                        : 'bg-sage-500/10 dark:bg-sage-400/10'
                    }`}>
                      <Check className={`w-3 h-3 ${
                        tier.featured ? 'text-white' : 'text-sage-600 dark:text-sage-400'
                      }`} />
                    </div>
                    <span className={tier.featured ? 'text-cream-100 dark:text-charcoal-700' : 'text-charcoal-700 dark:text-cream-200'}>
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              <Link
                href={tier.href}
                className={`block w-full py-4 text-center font-medium rounded-full transition-all hover:-translate-y-0.5 ${
                  tier.featured
                    ? 'bg-cream-50 dark:bg-charcoal-900 text-charcoal-900 dark:text-cream-50 hover:bg-white dark:hover:bg-charcoal-800 hover:shadow-lg'
                    : 'bg-charcoal-900 dark:bg-cream-100 text-cream-50 dark:text-charcoal-900 hover:bg-charcoal-800 dark:hover:bg-white hover:shadow-lg'
                }`}
              >
                {tier.cta}
              </Link>
            </div>
          ))}
        </div>

        {/* Trust note */}
        <p className="text-center text-sm text-charcoal-500 dark:text-cream-300/50 mt-12">
          Cancel anytime. No questions asked.
        </p>
      </div>
    </section>
  )
}
