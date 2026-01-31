import { ClipboardEdit, BarChart, Bookmark } from 'lucide-react'

const steps = [
  {
    number: '01',
    icon: ClipboardEdit,
    title: 'Input the details',
    description: 'Enter purchase price, down payment, loan terms, expected rent, and operating expenses.',
  },
  {
    number: '02',
    icon: BarChart,
    title: 'Get instant analysis',
    description: 'See cash flow projections, ROI metrics, and multi-year forecasts calculated in real-time.',
  },
  {
    number: '03',
    icon: Bookmark,
    title: 'Save & decide',
    description: 'Save your analysis, share it with partners, and compare multiple properties to find your winner.',
  },
]

export function HowItWorks() {
  return (
    <section className="py-24 lg:py-32 bg-cream-100 dark:bg-charcoal-950 relative overflow-hidden">
      {/* Decorative line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cream-300 dark:via-charcoal-800 to-transparent" />

      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        {/* Section header */}
        <div className="text-center mb-20">
          <p className="text-sm font-medium text-sage-600 dark:text-sage-400 uppercase tracking-wider mb-4">
            How it works
          </p>
          <h2 className="font-display text-4xl sm:text-5xl font-semibold text-charcoal-900 dark:text-cream-50 leading-tight">
            Three steps to clarity
          </h2>
        </div>

        {/* Steps */}
        <div className="relative">
          {/* Connection line - desktop */}
          <div className="hidden lg:block absolute top-24 left-[16.67%] right-[16.67%] h-px bg-gradient-to-r from-cream-300 via-sage-300 to-cream-300 dark:from-charcoal-800 dark:via-sage-800 dark:to-charcoal-800" />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 lg:gap-8">
            {steps.map((step, index) => {
              const Icon = step.icon
              return (
                <div key={step.number} className="relative text-center">
                  {/* Step number badge */}
                  <div className="relative inline-block mb-8">
                    <div className="w-20 h-20 bg-white dark:bg-charcoal-900 rounded-full flex items-center justify-center shadow-lg shadow-charcoal-900/5 dark:shadow-black/20 border border-cream-200 dark:border-charcoal-800 relative z-10">
                      <Icon className="w-8 h-8 text-sage-600 dark:text-sage-400" />
                    </div>
                    <span className="absolute -top-2 -right-2 w-8 h-8 bg-sage-500 dark:bg-sage-600 rounded-full flex items-center justify-center text-white text-sm font-semibold z-20">
                      {index + 1}
                    </span>
                  </div>

                  {/* Content */}
                  <h3 className="font-display text-2xl font-semibold text-charcoal-900 dark:text-cream-50 mb-4">
                    {step.title}
                  </h3>
                  <p className="text-charcoal-600 dark:text-cream-200 leading-relaxed max-w-sm mx-auto">
                    {step.description}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
