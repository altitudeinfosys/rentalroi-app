import { Quote } from 'lucide-react'

const testimonials = [
  {
    quote: "Finally, a calculator that doesn't feel like it was built in Excel. The projections helped me see a deal wasn't as good as I thought—saved me from a bad investment.",
    name: "Sarah Chen",
    role: "First-time Investor",
    location: "Austin, TX",
  },
  {
    quote: "I send every client a RentalROI link now. It's become part of my process. Professional, clear, and it makes me look good.",
    name: "Michael Torres",
    role: "Real Estate Agent",
    location: "Phoenix, AZ",
  },
  {
    quote: "The 30-year projections in Pro completely changed how I evaluate deals. Seeing the equity buildup over time is incredibly motivating.",
    name: "David Kim",
    role: "Portfolio Investor",
    location: "Seattle, WA",
  },
]

export function TestimonialsSection() {
  return (
    <section className="py-24 lg:py-32 bg-cream-100 dark:bg-charcoal-950 relative overflow-hidden">
      {/* Decorative quotes */}
      <Quote className="absolute top-12 left-12 w-32 h-32 text-sage-500/5 dark:text-sage-400/5" />
      <Quote className="absolute bottom-12 right-12 w-32 h-32 text-sage-500/5 dark:text-sage-400/5 rotate-180" />

      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        {/* Section header */}
        <div className="text-center mb-20">
          <p className="text-sm font-medium text-sage-600 dark:text-sage-400 uppercase tracking-wider mb-4">
            Testimonials
          </p>
          <h2 className="font-display text-4xl sm:text-5xl font-semibold text-charcoal-900 dark:text-cream-50 leading-tight">
            Trusted by investors
          </h2>
        </div>

        {/* Testimonials grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div
              key={testimonial.name}
              className="group relative"
            >
              {/* Card */}
              <div className="bg-white dark:bg-charcoal-900 rounded-3xl p-8 h-full border border-cream-200 dark:border-charcoal-800 transition-all group-hover:shadow-xl group-hover:shadow-charcoal-900/5 dark:group-hover:shadow-black/20 group-hover:-translate-y-1">
                {/* Quote mark */}
                <div className="w-10 h-10 bg-sage-500/10 dark:bg-sage-400/10 rounded-full flex items-center justify-center mb-6">
                  <span className="font-display text-2xl text-sage-600 dark:text-sage-400">&ldquo;</span>
                </div>

                {/* Quote */}
                <blockquote className="text-charcoal-700 dark:text-cream-100 leading-relaxed mb-8">
                  {testimonial.quote}
                </blockquote>

                {/* Author */}
                <div className="flex items-center gap-4 pt-6 border-t border-cream-200 dark:border-charcoal-800">
                  {/* Avatar */}
                  <div className="w-12 h-12 bg-gradient-to-br from-sage-400 to-sage-600 dark:from-sage-500 dark:to-sage-700 rounded-full flex items-center justify-center text-white font-display font-semibold text-lg">
                    {testimonial.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-charcoal-900 dark:text-cream-50">
                      {testimonial.name}
                    </p>
                    <p className="text-sm text-charcoal-500 dark:text-cream-300/60">
                      {testimonial.role} · {testimonial.location}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
