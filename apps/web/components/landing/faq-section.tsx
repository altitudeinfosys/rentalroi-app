'use client'

import { useState } from 'react'
import { Plus, Minus } from 'lucide-react'

const faqs = [
  {
    question: 'Is RentalROI really free?',
    answer: 'Yes. The free plan includes 3 saved calculations, 5-year projections, and shareable links. No credit card required, no trial period—it\'s free forever.',
  },
  {
    question: 'How accurate are the calculations?',
    answer: 'We use industry-standard formulas for cash flow, cap rate, cash-on-cash return, and other metrics. The accuracy depends on the data you input—garbage in, garbage out. We recommend being conservative with your estimates.',
  },
  {
    question: 'Can I share my analysis with others?',
    answer: 'Absolutely. Every saved calculation gets a unique link you can share with anyone—partners, agents, lenders, or your spouse who needs convincing.',
  },
  {
    question: 'Do I need an account to use the calculator?',
    answer: 'No. You can run calculations without signing up. But you\'ll need an account to save your work and access it later.',
  },
  {
    question: 'What metrics do you calculate?',
    answer: 'Monthly and annual cash flow, cap rate, cash-on-cash return, total ROI, gross rent multiplier, break-even occupancy rate, and multi-year projections including equity buildup and appreciation.',
  },
  {
    question: 'How is Pro different from Free?',
    answer: 'Pro unlocks unlimited saved calculations, 30-year projections (vs 5-year), side-by-side property comparison, PDF export, and priority support. It\'s built for investors who are serious about building a portfolio.',
  },
]

export function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  return (
    <section id="faq" className="py-24 lg:py-32 bg-white dark:bg-charcoal-900">
      <div className="max-w-4xl mx-auto px-6 lg:px-12">
        {/* Section header */}
        <div className="text-center mb-16">
          <p className="text-sm font-medium text-sage-600 dark:text-sage-400 uppercase tracking-wider mb-4">
            FAQ
          </p>
          <h2 className="font-display text-4xl sm:text-5xl font-semibold text-charcoal-900 dark:text-cream-50 leading-tight">
            Common questions
          </h2>
        </div>

        {/* FAQ list */}
        <div className="space-y-4">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index
            return (
              <div
                key={index}
                className={`rounded-2xl border transition-all ${
                  isOpen
                    ? 'bg-cream-50 dark:bg-charcoal-800 border-cream-300 dark:border-charcoal-700'
                    : 'bg-transparent border-cream-200 dark:border-charcoal-800 hover:border-cream-300 dark:hover:border-charcoal-700'
                }`}
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="w-full px-6 py-5 text-left flex items-center justify-between gap-4"
                >
                  <span className={`font-display text-lg font-medium transition-colors ${
                    isOpen ? 'text-charcoal-900 dark:text-cream-50' : 'text-charcoal-700 dark:text-cream-200'
                  }`}>
                    {faq.question}
                  </span>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
                    isOpen
                      ? 'bg-sage-500 text-white'
                      : 'bg-cream-200 dark:bg-charcoal-700 text-charcoal-600 dark:text-cream-300'
                  }`}>
                    {isOpen ? (
                      <Minus className="w-4 h-4" />
                    ) : (
                      <Plus className="w-4 h-4" />
                    )}
                  </div>
                </button>
                <div className={`overflow-hidden transition-all duration-300 ${
                  isOpen ? 'max-h-96' : 'max-h-0'
                }`}>
                  <p className="px-6 pb-6 text-charcoal-700 dark:text-cream-200 leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
