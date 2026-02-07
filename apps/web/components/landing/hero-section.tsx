import Link from 'next/link'
import { ArrowRight, TrendingUp, DollarSign, BarChart3 } from 'lucide-react'

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-cream-50 dark:bg-charcoal-950">
      {/* Subtle texture overlay */}
      <div className="absolute inset-0 bg-noise opacity-[0.03] dark:opacity-[0.05] pointer-events-none" />

      {/* Decorative elements */}
      <div className="absolute top-32 right-0 w-[600px] h-[600px] bg-sage-400/10 dark:bg-sage-600/10 rounded-full blur-3xl" />
      <div className="absolute -bottom-32 -left-32 w-[400px] h-[400px] bg-sage-400/5 dark:bg-sage-600/5 rounded-full blur-3xl" />

      {/* Grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8882_1px,transparent_1px),linear-gradient(to_bottom,#8882_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_110%)] opacity-30 dark:opacity-20" />

      <div className="relative max-w-7xl mx-auto px-6 lg:px-12 pt-32 pb-20 lg:pt-40 lg:pb-32">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          {/* Left column - Content */}
          <div className="max-w-2xl">
            {/* Eyebrow */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-sage-500/10 dark:bg-sage-400/10 border border-sage-500/20 dark:border-sage-400/20 mb-8 animate-fade-up">
              <span className="w-2 h-2 rounded-full bg-sage-500 dark:bg-sage-400 animate-pulse" />
              <span className="text-sm font-medium text-sage-700 dark:text-sage-400">
                Free investment analysis
              </span>
            </div>

            {/* Headline */}
            <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-semibold text-charcoal-900 dark:text-cream-50 leading-[1.1] tracking-tight mb-6 animate-fade-up [animation-delay:100ms] opacity-0">
              Know your numbers
              <span className="block text-sage-600 dark:text-sage-400">before you invest</span>
            </h1>

            {/* Subheadline */}
            <p className="text-lg sm:text-xl text-charcoal-700 dark:text-cream-200 leading-relaxed mb-10 max-w-lg animate-fade-up [animation-delay:200ms] opacity-0">
              Calculate cash flow, ROI, and long-term projections in seconds. Make confident decisions backed by real data.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 animate-fade-up [animation-delay:300ms] opacity-0">
              <Link
                href="/calculator"
                className="group inline-flex items-center gap-3 px-7 py-4 bg-charcoal-900 dark:bg-cream-100 text-cream-50 dark:text-charcoal-900 font-medium rounded-full hover:bg-charcoal-800 dark:hover:bg-white transition-all hover:shadow-xl hover:shadow-charcoal-900/10 dark:hover:shadow-cream-100/20 hover:-translate-y-0.5"
              >
                Start analyzing
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 px-7 py-4 text-charcoal-700 dark:text-cream-200 font-medium hover:text-charcoal-900 dark:hover:text-white transition-colors"
              >
                Create free account
              </Link>
            </div>

            {/* Social proof */}
            <div className="mt-12 pt-8 border-t border-cream-300 dark:border-charcoal-800 animate-fade-up [animation-delay:400ms] opacity-0">
              <p className="text-sm text-charcoal-600 dark:text-cream-300/60 mb-4">Trusted by investors analyzing</p>
              <div className="flex items-center gap-8">
                <div>
                  <span className="font-display text-3xl font-semibold text-charcoal-900 dark:text-cream-50">2,500+</span>
                  <span className="block text-sm text-charcoal-600 dark:text-cream-300/60">Properties</span>
                </div>
                <div className="w-px h-12 bg-cream-300 dark:bg-charcoal-800" />
                <div>
                  <span className="font-display text-3xl font-semibold text-charcoal-900 dark:text-cream-50">$180M</span>
                  <span className="block text-sm text-charcoal-600 dark:text-cream-300/60">Analyzed</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right column - Visual */}
          <div className="relative hidden lg:block">
            {/* Main card */}
            <div className="relative bg-white dark:bg-charcoal-900 rounded-3xl p-8 shadow-2xl shadow-charcoal-900/10 dark:shadow-black/30 border border-cream-200 dark:border-charcoal-800 animate-fade-up [animation-delay:200ms] opacity-0">
              {/* Card header */}
              <div className="flex items-center justify-between mb-8">
                <div>
                  <p className="text-sm text-charcoal-500 dark:text-cream-300/60">Monthly Cash Flow</p>
                  <p className="font-display text-4xl font-semibold text-sage-600 dark:text-sage-400">$847</p>
                </div>
                <div className="w-14 h-14 bg-sage-500/10 dark:bg-sage-400/10 rounded-2xl flex items-center justify-center">
                  <TrendingUp className="w-7 h-7 text-sage-600 dark:text-sage-400" />
                </div>
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-cream-100 dark:bg-charcoal-800 rounded-2xl p-4">
                  <p className="text-sm text-charcoal-500 dark:text-cream-300/60 mb-1">Cap Rate</p>
                  <p className="font-display text-2xl font-semibold text-charcoal-900 dark:text-cream-50">7.2%</p>
                </div>
                <div className="bg-cream-100 dark:bg-charcoal-800 rounded-2xl p-4">
                  <p className="text-sm text-charcoal-500 dark:text-cream-300/60 mb-1">Cash-on-Cash</p>
                  <p className="font-display text-2xl font-semibold text-charcoal-900 dark:text-cream-50">12.4%</p>
                </div>
              </div>

              {/* Chart placeholder */}
              <div className="h-32 bg-gradient-to-t from-sage-500/20 to-transparent dark:from-sage-400/20 rounded-2xl relative overflow-hidden">
                <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
                  <path
                    d="M0,80 Q50,60 100,65 T200,50 T300,55 T400,30"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="text-sage-500 dark:text-sage-400"
                  />
                </svg>
              </div>
            </div>

            {/* Floating card 1 */}
            <div className="absolute -top-6 -left-8 bg-white dark:bg-charcoal-900 rounded-2xl p-4 shadow-xl shadow-charcoal-900/10 dark:shadow-black/30 border border-cream-200 dark:border-charcoal-800 animate-slide-in [animation-delay:400ms] opacity-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-sage-500/10 dark:bg-sage-400/10 rounded-xl flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-sage-600 dark:text-sage-400" />
                </div>
                <div>
                  <p className="text-xs text-charcoal-500 dark:text-cream-300/60">Annual Return</p>
                  <p className="font-display text-lg font-semibold text-charcoal-900 dark:text-cream-50">$10,164</p>
                </div>
              </div>
            </div>

            {/* Floating card 2 */}
            <div className="absolute -bottom-4 -right-4 bg-white dark:bg-charcoal-900 rounded-2xl p-4 shadow-xl shadow-charcoal-900/10 dark:shadow-black/30 border border-cream-200 dark:border-charcoal-800 animate-slide-in [animation-delay:500ms] opacity-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-cream-200 dark:bg-charcoal-800 rounded-xl flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-charcoal-700 dark:text-cream-200" />
                </div>
                <div>
                  <p className="text-xs text-charcoal-500 dark:text-cream-300/60">5-Year Equity</p>
                  <p className="font-display text-lg font-semibold text-charcoal-900 dark:text-cream-50">$142,800</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
