import { NextResponse } from 'next/server'
import { createClient } from './server'
import type { User } from '@supabase/supabase-js'

/**
 * Result type for getAuthenticatedUser
 */
type AuthResult =
  | { user: User; error: null }
  | { user: null; error: NextResponse }

/**
 * Get authenticated user from request context.
 * Returns user if authenticated, or a pre-built error response if not.
 *
 * Usage in API routes:
 * ```
 * const { user, error } = await getAuthenticatedUser()
 * if (error) return error
 * // user is now typed as User
 * ```
 */
export async function getAuthenticatedUser(): Promise<AuthResult> {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return {
      user: null,
      error: NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      ),
    }
  }

  return { user, error: null }
}
