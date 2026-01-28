/**
 * Client-side CRUD operations for calculations
 */

import { createClient } from './client'
import {
  formToDb,
  dbToForm,
  dbToSummary,
  type DbCalculation,
  type ComputedResults,
} from '@/lib/mappers/calculation-mapper'
import type { CalculatorFormData } from '@/lib/validation/calculator-schema'

/**
 * Save a new calculation to the database
 */
export async function saveCalculation(
  userId: string,
  form: CalculatorFormData,
  results: ComputedResults
): Promise<{ id: string } | { error: string }> {
  const supabase = createClient()

  const dbData = formToDb(form, userId, results)

  const { data, error } = await supabase
    .from('calculations')
    .insert(dbData)
    .select('id')
    .single()

  if (error) {
    console.error('Error saving calculation:', error)
    return { error: error.message }
  }

  return { id: data.id }
}

/**
 * Get all calculations for a user
 */
export async function getCalculations(
  userId: string,
  options?: {
    limit?: number
    offset?: number
    orderBy?: 'created_at' | 'updated_at' | 'title'
    order?: 'asc' | 'desc'
  }
) {
  const supabase = createClient()

  const {
    limit = 20,
    offset = 0,
    orderBy = 'created_at',
    order = 'desc',
  } = options || {}

  const { data, error, count } = await supabase
    .from('calculations')
    .select('*', { count: 'exact' })
    .eq('user_id', userId)
    .order(orderBy, { ascending: order === 'asc' })
    .range(offset, offset + limit - 1)

  if (error) {
    console.error('Error fetching calculations:', error)
    return { calculations: [], total: 0, error: error.message }
  }

  return {
    calculations: (data as DbCalculation[]).map(dbToSummary),
    total: count || 0,
  }
}

/**
 * Get a single calculation by ID (client-side)
 */
export async function getCalculation(id: string, userId: string) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('calculations')
    .select('*')
    .eq('id', id)
    .eq('user_id', userId)
    .single()

  if (error) {
    console.error('Error fetching calculation:', error)
    return { calculation: null, error: error.message }
  }

  return {
    calculation: data as DbCalculation,
    formData: dbToForm(data as DbCalculation),
  }
}

/**
 * Update an existing calculation
 */
export async function updateCalculation(
  id: string,
  userId: string,
  form: CalculatorFormData,
  results: ComputedResults
): Promise<{ success: boolean } | { error: string }> {
  const supabase = createClient()

  const dbData = formToDb(form, userId, results)

  const { error } = await supabase
    .from('calculations')
    .update(dbData)
    .eq('id', id)
    .eq('user_id', userId)

  if (error) {
    console.error('Error updating calculation:', error)
    return { error: error.message }
  }

  return { success: true }
}

/**
 * Delete a calculation
 */
export async function deleteCalculation(
  id: string,
  userId: string
): Promise<{ success: boolean } | { error: string }> {
  const supabase = createClient()

  const { error } = await supabase
    .from('calculations')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)

  if (error) {
    console.error('Error deleting calculation:', error)
    return { error: error.message }
  }

  return { success: true }
}

/**
 * Check if user has reached their calculation limit (for free tier)
 */
export async function checkCalculationLimit(userId: string): Promise<{
  canCreate: boolean
  current: number
  limit: number
}> {
  const supabase = createClient()

  // Get user's subscription tier and calculation count
  const { data: user, error } = await supabase
    .from('users')
    .select('subscription_tier, calculations_this_month')
    .eq('id', userId)
    .single()

  if (error || !user) {
    // If no user record, assume free tier with 0 calculations
    return { canCreate: true, current: 0, limit: 5 }
  }

  const limits: Record<string, number> = {
    free: 5,
    pro: 50,
    premium: Infinity,
  }

  const limit = limits[user.subscription_tier] || 5
  const current = user.calculations_this_month || 0

  return {
    canCreate: current < limit,
    current,
    limit,
  }
}
