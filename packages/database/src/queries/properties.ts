import { supabase } from '../client';
import type { Database } from '../types';

type Property = Database['public']['Tables']['properties']['Row'];
type PropertyInsert = Database['public']['Tables']['properties']['Insert'];
type PropertyUpdate = Database['public']['Tables']['properties']['Update'];

/**
 * Get all properties for current user
 */
export async function getProperties() {
  const { data, error } = await supabase
    .from('properties')
    .select('*')
    .order('created_at', { ascending: false });

  return { data, error };
}

/**
 * Get property by ID
 */
export async function getPropertyById(id: string) {
  const { data, error } = await supabase
    .from('properties')
    .select('*, calculations(*)')
    .eq('id', id)
    .single();

  return { data, error };
}

/**
 * Create new property
 */
export async function createProperty(property: PropertyInsert) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { data: null, error: new Error('Not authenticated') };
  }

  const { data, error } = await supabase
    .from('properties')
    .insert({
      ...property,
      user_id: user.id,
    })
    .select()
    .single();

  return { data, error };
}

/**
 * Update property
 */
export async function updateProperty(id: string, updates: PropertyUpdate) {
  const { data, error } = await supabase
    .from('properties')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  return { data, error };
}

/**
 * Delete property
 */
export async function deleteProperty(id: string) {
  const { error } = await supabase.from('properties').delete().eq('id', id);

  return { error };
}

/**
 * Search properties by city
 */
export async function searchPropertiesByCity(city: string) {
  const { data, error } = await supabase
    .from('properties')
    .select('*')
    .ilike('city', `%${city}%`)
    .order('created_at', { ascending: false });

  return { data, error };
}
