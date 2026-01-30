import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { formToDb, type ComputedResults } from '@/lib/mappers/calculation-mapper'
import type { CalculatorFormData } from '@/lib/validation/calculator-schema'
import { createClient as createServiceClient } from '@supabase/supabase-js'

/**
 * POST /api/calculations/save
 * Saves a calculation to the database, ensuring the user exists in public.users first
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
    const { formData, results, calculationId } = body as {
      formData: CalculatorFormData
      results: ComputedResults
      calculationId?: string
    }

    if (!formData || !results) {
      return NextResponse.json(
        { error: 'Missing formData or results' },
        { status: 400 }
      )
    }

    // Use service role client to bypass RLS for all operations
    // This is needed because:
    // 1. The user might not exist in public.users yet
    // 2. The RLS policy for calculations checks get_user_tier() which queries users table
    const serviceSupabase = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Step 1: Ensure user exists in public.users
    const { error: upsertError } = await serviceSupabase
      .from('users')
      .upsert(
        {
          id: user.id,
          email: user.email!,
          full_name: user.user_metadata?.full_name || user.user_metadata?.name || null,
        },
        { onConflict: 'id', ignoreDuplicates: true }
      )

    if (upsertError) {
      console.error('Error ensuring user exists:', upsertError)
      return NextResponse.json(
        { error: `Failed to create user profile: ${upsertError.message}` },
        { status: 500 }
      )
    }

    // Step 2: Save the calculation using service role (bypasses RLS)
    const dbData = formToDb(formData, user.id, results)

    if (calculationId) {
      // Update existing
      const { error } = await serviceSupabase
        .from('calculations')
        .update(dbData)
        .eq('id', calculationId)
        .eq('user_id', user.id)

      if (error) {
        console.error('Error updating calculation:', error)
        return NextResponse.json(
          { error: error.message },
          { status: 500 }
        )
      }

      return NextResponse.json({ success: true, id: calculationId })
    } else {
      // Insert new
      const { data, error } = await serviceSupabase
        .from('calculations')
        .insert(dbData)
        .select('id')
        .single()

      if (error) {
        console.error('Error saving calculation:', error)
        return NextResponse.json(
          { error: error.message },
          { status: 500 }
        )
      }

      return NextResponse.json({ success: true, id: data.id })
    }
  } catch (err) {
    console.error('Unexpected error in save calculation:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
