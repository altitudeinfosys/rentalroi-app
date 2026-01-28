/**
 * Server-side CRUD operations for calculations
 * Only import this in Server Components, Route Handlers, or Server Actions
 */

import { createClient } from './server'
import {
  dbToForm,
  type DbCalculation,
} from '@/lib/mappers/calculation-mapper'

/**
 * Get a single calculation by ID (server-side)
 */
export async function getCalculationServer(id: string, userId: string) {
  const supabase = await createClient()

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
