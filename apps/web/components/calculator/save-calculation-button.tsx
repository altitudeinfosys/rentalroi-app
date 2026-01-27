'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Save, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { saveCalculation, updateCalculation } from '@/lib/supabase/calculations'
import type { CalculatorFormData } from '@/lib/validation/calculator-schema'
import type { ComputedResults } from '@/lib/mappers/calculation-mapper'
import type { User } from '@supabase/supabase-js'

interface SaveCalculationButtonProps {
  formData: CalculatorFormData
  results: ComputedResults
  calculationId?: string | null
  onSuccess?: () => void
  onError?: (error: string) => void
}

export function SaveCalculationButton({
  formData,
  results,
  calculationId,
  onSuccess,
  onError,
}: SaveCalculationButtonProps) {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      setIsCheckingAuth(false)
    })
  }, [])

  const handleSave = async () => {
    // If not logged in, redirect to login with return URL
    if (!user) {
      const returnUrl = encodeURIComponent(window.location.pathname + window.location.search)
      router.push(`/login?redirect=${returnUrl}`)
      return
    }

    setIsLoading(true)

    try {
      let result

      if (calculationId) {
        // Update existing calculation
        result = await updateCalculation(calculationId, user.id, formData, results)
      } else {
        // Create new calculation
        result = await saveCalculation(user.id, formData, results)
      }

      if ('error' in result) {
        onError?.(result.error)
        return
      }

      // Clear local draft after successful save
      localStorage.removeItem('calculator_draft')

      onSuccess?.()

      // If this was a new calculation, redirect to calculations list
      if (!calculationId && 'id' in result) {
        router.push('/calculations')
      }
    } catch (err) {
      onError?.('Failed to save calculation. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (isCheckingAuth) {
    return (
      <button
        disabled
        className="flex items-center gap-2 px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 rounded-lg cursor-not-allowed"
      >
        <Loader2 className="w-4 h-4 animate-spin" />
        <span>Loading...</span>
      </button>
    )
  }

  return (
    <button
      onClick={handleSave}
      disabled={isLoading}
      className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-semibold rounded-lg transition-colors"
    >
      {isLoading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Saving...</span>
        </>
      ) : (
        <>
          <Save className="w-4 h-4" />
          <span>{user ? (calculationId ? 'Update' : 'Save to Account') : 'Sign in to Save'}</span>
        </>
      )}
    </button>
  )
}
