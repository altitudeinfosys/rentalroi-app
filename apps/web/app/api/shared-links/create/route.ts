import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

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
 * POST /api/shared-links/create
 * Creates a shared link for a calculation
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { calculationId } = body as { calculationId: string }

    if (!calculationId) {
      return NextResponse.json(
        { error: 'Missing calculationId' },
        { status: 400 }
      )
    }

    // Use service role client to bypass RLS
    const serviceSupabase = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Verify the calculation belongs to the user
    const { data: calculation, error: calcError } = await serviceSupabase
      .from('calculations')
      .select('id')
      .eq('id', calculationId)
      .eq('user_id', user.id)
      .single()

    if (calcError || !calculation) {
      return NextResponse.json(
        { error: 'Calculation not found or not owned by user' },
        { status: 404 }
      )
    }

    // Generate token and create shared link
    const token = generateToken()
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 30) // Expire in 30 days

    const { error: insertError } = await serviceSupabase
      .from('shared_links')
      .insert({
        calculation_id: calculationId,
        user_id: user.id,
        token,
        expires_at: expiresAt.toISOString(),
      })

    if (insertError) {
      console.error('Error creating shared link:', insertError)
      // If token collision, generate a new one
      if (insertError.code === '23505') {
        // Retry with new token
        const newToken = generateToken()
        const { error: retryError } = await serviceSupabase
          .from('shared_links')
          .insert({
            calculation_id: calculationId,
            user_id: user.id,
            token: newToken,
            expires_at: expiresAt.toISOString(),
          })

        if (retryError) {
          return NextResponse.json(
            { error: retryError.message },
            { status: 500 }
          )
        }

        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3005'
        return NextResponse.json({
          url: `${baseUrl}/s/${newToken}`,
          token: newToken,
          expiresAt: expiresAt.toISOString(),
        })
      }

      return NextResponse.json(
        { error: insertError.message },
        { status: 500 }
      )
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3005'
    return NextResponse.json({
      url: `${baseUrl}/s/${token}`,
      token,
      expiresAt: expiresAt.toISOString(),
    })
  } catch (err) {
    console.error('Unexpected error in create shared link:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
