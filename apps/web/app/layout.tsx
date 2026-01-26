import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'RentalROI - Rental Property Investment Calculator',
  description: 'Next-generation rental property investment calculator with advanced analytics',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
