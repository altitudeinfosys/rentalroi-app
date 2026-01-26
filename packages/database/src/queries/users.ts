import { supabase } from '../client';
import type { Database } from '../types';

type User = Database['public']['Tables']['users']['Row'];
type UserInsert = Database['public']['Tables']['users']['Insert'];
type UserUpdate = Database['public']['Tables']['users']['Update'];

/**
 * Get current user profile
 */
export async function getCurrentUser() {
  const {
    data: { user: authUser },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !authUser) {
    return { data: null, error: authError };
  }

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', authUser.id)
    .single();

  return { data, error };
}

/**
 * Get user by ID
 */
export async function getUserById(userId: string) {
  const { data, error } = await supabase.from('users').select('*').eq('id', userId).single();

  return { data, error };
}

/**
 * Update user profile
 */
export async function updateUser(userId: string, updates: UserUpdate) {
  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();

  return { data, error };
}

/**
 * Check if user can create calculation (respects tier limits)
 */
export async function canCreateCalculation() {
  const { data: user, error } = await getCurrentUser();

  if (error || !user) {
    return { canCreate: false, reason: 'User not found' };
  }

  // Pro/Premium users have unlimited calculations
  if (user.subscription_tier === 'pro' || user.subscription_tier === 'premium') {
    return { canCreate: true, remaining: Infinity };
  }

  // Free users: max 3 per month
  const remaining = 3 - user.calculations_this_month;

  return {
    canCreate: remaining > 0,
    remaining,
    reason: remaining <= 0 ? 'Monthly calculation limit reached' : undefined,
  };
}

/**
 * Get user's subscription status
 */
export async function getSubscriptionStatus() {
  const { data: user, error } = await getCurrentUser();

  if (error || !user) {
    return { data: null, error };
  }

  const now = new Date();
  const expiresAt = user.subscription_expires_at ? new Date(user.subscription_expires_at) : null;

  return {
    data: {
      tier: user.subscription_tier,
      isActive:
        user.subscription_tier !== 'free' && (!expiresAt || expiresAt > now),
      expiresAt: user.subscription_expires_at,
      calculationsThisMonth: user.calculations_this_month,
    },
    error: null,
  };
}
