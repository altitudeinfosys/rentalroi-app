'use client'

import { Printer } from 'lucide-react'

export function ExportPdfButton() {
  return (
    <button
      onClick={() => window.print()}
      className="no-print inline-flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-lg transition-colors text-sm"
    >
      <Printer className="w-4 h-4" />
      Export PDF
    </button>
  )
}
