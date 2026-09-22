/**
 * Client-side operations for user profile and settings
 */

import { createClient } from './client'

export interface UserProfile {
  id: string
  email: string
  full_name: string | null
  subscription_tier: string
  calculations_this_month: number
  created_at: string
  updated_at: string
}

/**
 * Get user profile data
 */
export async function getUserProfile(
  userId: string
): Promise<{ profile: UserProfile | null; error?: string }> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) {
    console.error('Error fetching user profile:', error)
    return { profile: null, error: error.message }
  }

  return { profile: data as UserProfile }
}

/**
 * Update user profile (display name)
 */
export async function updateUserProfile(
  userId: string,
  updates: { full_name: string }
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient()

  const { error } = await supabase
    .from('users')
    .update({ full_name: updates.full_name, updated_at: new Date().toISOString() })
    .eq('id', userId)

  if (error) {
    console.error('Error updating user profile:', error)
    return { success: false, error: error.message }
  }

  return { success: true }
}
