import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { z } from 'zod'
import { getAuthenticatedUser } from '@/lib/supabase/auth'

/** Token length for share links (12 chars = 62^12 ≈ 3.2e21 combinations) */
const TOKEN_LENGTH = 12

/** Share link expiry in days */
const SHARE_LINK_EXPIRY_DAYS = 30

/** Max retry attempts for token collision */
const MAX_TOKEN_RETRIES = 3

/** Request body schema */
const createSharedLinkSchema = z.object({
  calculationId: z.string().uuid('Invalid calculation ID'),
})

/**
 * Generate a URL-safe random token
 */
function generateToken(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  const array = new Uint8Array(TOKEN_LENGTH)
  crypto.getRandomValues(array)
  return Array.from(array, (byte) => chars[byte % chars.length]).join('')
}

/**
 * POST /api/shared-links/create
 * Creates a shared link for a calculation
 */
export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const { user, error: authError } = await getAuthenticatedUser()
    if (authError) return authError

    const supabase = await createClient()

    // Parse and validate request body
    const body = await request.json()
    const parsed = createSharedLinkSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.issues },
        { status: 400 }
      )
    }

    const { calculationId } = parsed.data

    // Verify the calculation belongs to the user (using authenticated client - respects RLS)
    const { data: calculation, error: calcError } = await supabase
      .from('calculations')
      .select('id')
      .eq('id', calculationId)
      .eq('user_id', user.id)
      .single()

    if (calcError || !calculation) {
      return NextResponse.json(
        { error: 'Calculation not found' },
        { status: 404 }
      )
    }

    // Use service role only for inserting shared link (needed due to RLS policy)
    const serviceSupabase = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + SHARE_LINK_EXPIRY_DAYS)

    // Retry loop for token collision handling
    for (let attempt = 0; attempt < MAX_TOKEN_RETRIES; attempt++) {
      const token = generateToken()

      const { error: insertError } = await serviceSupabase
        .from('shared_links')
        .insert({
          calculation_id: calculationId,
          user_id: user.id,
          token,
          expires_at: expiresAt.toISOString(),
        })

      if (!insertError) {
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3005'
        return NextResponse.json({
          url: `${baseUrl}/s/${token}`,
          token,
          expiresAt: expiresAt.toISOString(),
        })
      }

      // If not a collision error, fail immediately
      if (insertError.code !== '23505') {
        console.error('Error creating shared link:', {
          error: insertError,
          userId: user.id,
          calculationId,
          attempt,
          timestamp: new Date().toISOString()
        })
        return NextResponse.json(
          { error: 'Failed to create share link' },
          { status: 500 }
        )
      }

      // Token collision - retry with new token
      console.warn('Token collision, retrying:', { attempt, userId: user.id })
    }

    // All retries exhausted
    return NextResponse.json(
      { error: 'Failed to generate unique share link. Please try again.' },
      { status: 500 }
    )
  } catch (err) {
    console.error('Unexpected error in create shared link:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
