import { MarketingHeader } from '@/components/landing/marketing-header'

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-cream-50 dark:bg-charcoal-950">
      <MarketingHeader />
      <main>{children}</main>
    </div>
  )
}
