import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export function Footer() {
  return (
    <footer className="bg-charcoal-950 text-cream-100">
      {/* CTA Section */}
      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-24">
        <div className="relative bg-gradient-to-br from-sage-600 to-sage-700 rounded-3xl p-12 lg:p-16 overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full blur-3xl" />

          <div className="relative max-w-2xl">
            <h2 className="font-display text-4xl sm:text-5xl font-semibold text-white leading-tight mb-6">
              Ready to find your next investment?
            </h2>
            <p className="text-sage-100 text-lg mb-10 max-w-lg">
              Join thousands of investors who use RentalROI to make smarter property decisions.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/calculator"
                className="group inline-flex items-center justify-center gap-3 px-8 py-4 bg-white text-sage-700 font-medium rounded-full hover:bg-cream-50 transition-all hover:shadow-xl hover:-translate-y-0.5"
              >
                Start analyzing
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/signup"
                className="inline-flex items-center justify-center px-8 py-4 text-white font-medium rounded-full border border-white/30 hover:bg-white/10 transition-all"
              >
                Create free account
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-charcoal-800">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Logo */}
            <Link href="/" className="font-display text-xl font-semibold text-cream-100">
              Rental<span className="text-sage-400">ROI</span>
            </Link>

            {/* Links */}
            <nav className="flex items-center gap-8 text-sm text-cream-300/60">
              <a href="#features" className="hover:text-cream-100 transition-colors">
                Features
              </a>
              <a href="#pricing" className="hover:text-cream-100 transition-colors">
                Pricing
              </a>
              <a href="#faq" className="hover:text-cream-100 transition-colors">
                FAQ
              </a>
              <Link href="/login" className="hover:text-cream-100 transition-colors">
                Sign in
              </Link>
            </nav>

            {/* Copyright */}
            <p className="text-sm text-cream-300/40">
              © {new Date().getFullYear()} RentalROI
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
