'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, User as UserIcon, CreditCard, Check, Pencil, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { getUserProfile, updateUserProfile } from '@/lib/supabase/user-settings'
import type { UserProfile } from '@/lib/supabase/user-settings'
import type { User } from '@supabase/supabase-js'

const tierLabels: Record<string, string> = {
  free: 'Free',
  pro: 'Pro',
  premium: 'Premium',
}

const tierColors: Record<string, string> = {
  free: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  pro: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400',
  premium: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400',
}

const tierLimits: Record<string, number> = {
  free: 5,
  pro: 50,
  premium: Infinity,
}

export default function SettingsPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Edit state
  const [isEditingName, setIsEditingName] = useState(false)
  const [editName, setEditName] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  // Load user and profile
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) {
        router.push('/login?redirect=/settings')
        return
      }
      setUser(user)

      const result = await getUserProfile(user.id)
      if (result.profile) {
        setProfile(result.profile)
        setEditName(result.profile.full_name || '')
      }
      setIsLoading(false)
    })
  }, [router])

  const handleSaveName = async () => {
    if (!user || !profile) return
    setIsSaving(true)

    const result = await updateUserProfile(user.id, { full_name: editName.trim() })
    if (result.success) {
      setProfile({ ...profile, full_name: editName.trim() })
      setIsEditingName(false)
    }
    setIsSaving(false)
  }

  const handleCancelEdit = () => {
    setEditName(profile?.full_name || '')
    setIsEditingName(false)
  }

  if (isLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  const tier = profile?.subscription_tier || 'free'
  const current = profile?.calculations_this_month || 0
  const limit = tierLimits[tier] || 5
  const usagePercent = limit === Infinity ? 0 : Math.min((current / limit) * 100, 100)

  return (
    <div className="p-4 lg:p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
          Settings
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage your profile and subscription
        </p>
      </div>

      <div className="space-y-6">
        {/* Profile Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex items-center gap-3">
            <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
              <UserIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Profile</h2>
          </div>

          <div className="p-5 space-y-4">
            {/* Display Name */}
            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                Display Name
              </label>
              {isEditingName ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    placeholder="Enter your name"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveName()
                      if (e.key === 'Escape') handleCancelEdit()
                    }}
                  />
                  <button
                    onClick={handleSaveName}
                    disabled={isSaving}
                    className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors disabled:opacity-50"
                    title="Save"
                  >
                    {isSaving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Check className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    title="Cancel"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <p className="text-gray-900 dark:text-white text-sm">
                    {profile?.full_name || 'Not set'}
                  </p>
                  <button
                    onClick={() => setIsEditingName(true)}
                    className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    title="Edit name"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                Email
              </label>
              <p className="text-gray-900 dark:text-white text-sm">
                {user.email}
              </p>
            </div>

            {/* Member Since */}
            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                Member Since
              </label>
              <p className="text-gray-900 dark:text-white text-sm">
                {profile?.created_at
                  ? new Date(profile.created_at).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })
                  : 'Unknown'}
              </p>
            </div>
          </div>
        </div>

        {/* Subscription Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex items-center gap-3">
            <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
              <CreditCard className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Subscription</h2>
          </div>

          <div className="p-5 space-y-5">
            {/* Tier Badge */}
            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                Current Plan
              </label>
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${
                  tierColors[tier] || tierColors.free
                }`}
              >
                {tierLabels[tier] || 'Free'}
              </span>
            </div>

            {/* Usage Progress */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Monthly Usage
                </label>
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {current} of {limit === Infinity ? 'Unlimited' : limit} calculations
                </span>
              </div>
              {limit !== Infinity && (
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                  <div
                    className={`h-2.5 rounded-full transition-all ${
                      usagePercent >= 90
                        ? 'bg-red-500'
                        : usagePercent >= 70
                        ? 'bg-yellow-500'
                        : 'bg-blue-600'
                    }`}
                    style={{ width: `${usagePercent}%` }}
                  />
                </div>
              )}
            </div>

            {/* Upgrade CTA for free users */}
            {tier === 'free' && (
              <div className="pt-2">
                <button className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors text-sm">
                  Upgrade to Pro
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
