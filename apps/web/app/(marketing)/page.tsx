import { HeroSection } from '@/components/landing/hero-section'
import { FeaturesGrid } from '@/components/landing/features-grid'
import { HowItWorks } from '@/components/landing/how-it-works'
import { PricingSection } from '@/components/landing/pricing-section'
import { TestimonialsSection } from '@/components/landing/testimonials-section'
import { FaqSection } from '@/components/landing/faq-section'
import { Footer } from '@/components/landing/footer'

export default function LandingPage() {
  return (
    <>
      <HeroSection />
      <FeaturesGrid />
      <HowItWorks />
      <PricingSection />
      <TestimonialsSection />
      <FaqSection />
      <Footer />
    </>
  )
}
