'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Share2, Loader2, Check, Link } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

interface ShareButtonProps {
  calculationId?: string | null
  onSuccess?: (url: string) => void
  onError?: (error: string) => void
}

export function ShareButton({
  calculationId,
  onSuccess,
  onError,
}: ShareButtonProps) {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      setIsCheckingAuth(false)
    })
  }, [])

  const handleShare = async () => {
    // If not logged in, redirect to login with return URL
    if (!user) {
      const returnUrl = encodeURIComponent(window.location.pathname + window.location.search)
      router.push(`/login?redirect=${returnUrl}`)
      return
    }

    // Must have a saved calculation to share
    if (!calculationId) {
      onError?.('Please save the calculation first before sharing.')
      return
    }

    setIsLoading(true)

    try {
      // Use API route to create shared link (bypasses RLS)
      const response = await fetch('/api/shared-links/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ calculationId }),
      })

      const result = await response.json()

      if (!response.ok || result.error) {
        onError?.(result.error || 'Failed to create share link')
        return
      }

      // Copy to clipboard
      await navigator.clipboard.writeText(result.url)
      setCopied(true)

      // Reset copied state after 2 seconds
      setTimeout(() => setCopied(false), 2000)

      onSuccess?.(result.url)
    } catch (err) {
      onError?.('Failed to create share link. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // Determine button state and label
  const getButtonState = () => {
    if (isCheckingAuth) {
      return {
        disabled: true,
        icon: <Loader2 className="w-4 h-4 animate-spin" />,
        label: 'Loading...',
        className: 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed',
      }
    }

    if (isLoading) {
      return {
        disabled: true,
        icon: <Loader2 className="w-4 h-4 animate-spin" />,
        label: 'Creating link...',
        className: 'bg-blue-400 text-white cursor-wait',
      }
    }

    if (copied) {
      return {
        disabled: false,
        icon: <Check className="w-4 h-4" />,
        label: 'Link copied!',
        className: 'bg-green-600 text-white',
      }
    }

    if (!user) {
      return {
        disabled: false,
        icon: <Share2 className="w-4 h-4" />,
        label: 'Sign in to Share',
        className: 'bg-blue-600 hover:bg-blue-700 text-white',
      }
    }

    if (!calculationId) {
      return {
        disabled: true,
        icon: <Link className="w-4 h-4" />,
        label: 'Save first to Share',
        className: 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed',
      }
    }

    return {
      disabled: false,
      icon: <Share2 className="w-4 h-4" />,
      label: 'Share',
      className: 'bg-blue-600 hover:bg-blue-700 text-white',
    }
  }

  const buttonState = getButtonState()

  return (
    <button
      onClick={handleShare}
      disabled={buttonState.disabled}
      className={`flex items-center gap-2 px-4 py-2 font-semibold rounded-lg transition-colors ${buttonState.className}`}
    >
      {buttonState.icon}
      <span>{buttonState.label}</span>
    </button>
  )
}
