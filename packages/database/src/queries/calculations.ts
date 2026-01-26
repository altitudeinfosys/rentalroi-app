import { supabase } from '../client';
import type { Database } from '../types';

type Calculation = Database['public']['Tables']['calculations']['Row'];
type CalculationInsert = Database['public']['Tables']['calculations']['Insert'];
type CalculationUpdate = Database['public']['Tables']['calculations']['Update'];

/**
 * Get all calculations for current user
 */
export async function getCalculations() {
  const { data, error } = await supabase
    .from('calculations')
    .select('*, properties(*)')
    .order('created_at', { ascending: false });

  return { data, error };
}

/**
 * Get calculation by ID
 */
export async function getCalculationById(id: string) {
  const { data, error } = await supabase
    .from('calculations')
    .select('*, properties(*), projections(*)')
    .eq('id', id)
    .single();

  return { data, error };
}

/**
 * Create new calculation
 */
export async function createCalculation(calculation: CalculationInsert) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { data: null, error: new Error('Not authenticated') };
  }

  const { data, error } = await supabase
    .from('calculations')
    .insert({
      ...calculation,
      user_id: user.id,
    })
    .select()
    .single();

  return { data, error };
}

/**
 * Update calculation
 */
export async function updateCalculation(id: string, updates: CalculationUpdate) {
  const { data, error } = await supabase
    .from('calculations')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  return { data, error };
}

/**
 * Delete calculation
 */
export async function deleteCalculation(id: string) {
  const { error } = await supabase.from('calculations').delete().eq('id', id);

  return { error };
}

/**
 * Get calculations by property
 */
export async function getCalculationsByProperty(propertyId: string) {
  const { data, error } = await supabase
    .from('calculations')
    .select('*')
    .eq('property_id', propertyId)
    .order('created_at', { ascending: false });

  return { data, error };
}

/**
 * Get top performing calculations
 */
export async function getTopCalculations(limit = 10) {
  const { data, error } = await supabase
    .from('calculations')
    .select('*, properties(*)')
    .order('cash_on_cash_return', { ascending: false, nullsFirst: false })
    .limit(limit);

  return { data, error };
}
