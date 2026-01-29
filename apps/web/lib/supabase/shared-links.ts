/**
 * CRUD operations for shared links
 */

import { createClient } from './client'
import { createClient as createServerClient } from '@supabase/supabase-js'
import type { DbCalculation } from '@/lib/mappers/calculation-mapper'

/**
 * Generate a URL-safe random token (8 characters)
 */
function generateToken(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  const array = new Uint8Array(8)
  crypto.getRandomValues(array)
  return Array.from(array, (byte) => chars[byte % chars.length]).join('')
}

/**
 * Create a shared link for a calculation
 */
export async function createSharedLink(
  calculationId: string,
  userId: string
): Promise<{ url: string; token: string; expiresAt: Date } | { error: string }> {
  const supabase = createClient()
  const token = generateToken()

  // Expire in 30 days
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 30)

  const { error } = await supabase
    .from('shared_links')
    .insert({
      calculation_id: calculationId,
      user_id: userId,
      token,
      expires_at: expiresAt.toISOString(),
    })

  if (error) {
    console.error('Error creating shared link:', error)
    // If token collision, try once more with new token
    if (error.code === '23505') {
      return createSharedLink(calculationId, userId)
    }
    return { error: error.message }
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  return {
    url: `${baseUrl}/s/${token}`,
    token,
    expiresAt,
  }
}

/**
 * Get a shared calculation by token (public access, uses service role)
 */
export async function getSharedCalculation(
  token: string
): Promise<{ calculation: DbCalculation; expiresAt: Date; title: string } | { error: string; expired?: boolean }> {
  // Use service role client to bypass RLS for public access
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // First, get the shared link
  const { data: link, error: linkError } = await supabase
    .from('shared_links')
    .select('calculation_id, expires_at')
    .eq('token', token)
    .single()

  if (linkError || !link) {
    return { error: 'Link not found' }
  }

  // Check expiration
  const expiresAt = new Date(link.expires_at)
  if (expiresAt < new Date()) {
    return { error: 'This link has expired', expired: true }
  }

  // Get the calculation
  const { data: calculation, error: calcError } = await supabase
    .from('calculations')
    .select('*')
    .eq('id', link.calculation_id)
    .single()

  if (calcError || !calculation) {
    return { error: 'Calculation not found' }
  }

  return {
    calculation: calculation as DbCalculation,
    expiresAt,
    title: calculation.title,
  }
}

/**
 * Record a view for analytics (increment view count)
 */
export async function recordView(token: string): Promise<void> {
  // Use service role client to bypass RLS
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Get current view count and increment
  const { data: link } = await supabase
    .from('shared_links')
    .select('view_count')
    .eq('token', token)
    .single()

  if (link) {
    await supabase
      .from('shared_links')
      .update({
        view_count: (link.view_count || 0) + 1,
        last_viewed_at: new Date().toISOString(),
      })
      .eq('token', token)
  }
}

/**
 * Delete a shared link (owner only)
 */
export async function deleteSharedLink(
  token: string,
  userId: string
): Promise<{ success: boolean } | { error: string }> {
  const supabase = createClient()

  const { error } = await supabase
    .from('shared_links')
    .delete()
    .eq('token', token)
    .eq('user_id', userId)

  if (error) {
    console.error('Error deleting shared link:', error)
    return { error: error.message }
  }

  return { success: true }
}

/**
 * Get all shared links for a user
 */
export async function getUserSharedLinks(userId: string) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('shared_links')
    .select(`
      token,
      expires_at,
      view_count,
      last_viewed_at,
      created_at,
      calculations (
        id,
        title
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching shared links:', error)
    return { links: [], error: error.message }
  }

  return { links: data || [] }
}
