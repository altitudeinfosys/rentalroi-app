import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { formToDb, type ComputedResults } from '@/lib/mappers/calculation-mapper'
import { calculatorSchema, type CalculatorFormData } from '@/lib/validation/calculator-schema'
import { getAuthenticatedUser } from '@/lib/supabase/auth'

/**
 * POST /api/calculations/save
 * Saves a calculation to the database, ensuring the user exists in public.users first
 */
export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const { user, error: authError } = await getAuthenticatedUser()
    if (authError) return authError

    const supabase = await createClient()

    // Parse and validate request body
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

    // Validate form data with Zod
    const parsed = calculatorSchema.safeParse(formData)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid form data', details: parsed.error.issues },
        { status: 400 }
      )
    }

    // Use service role ONLY for user creation (minimal scope)
    const serviceSupabase = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Step 1: Ensure user exists in public.users (service role needed here)
    const { error: upsertError } = await serviceSupabase
      .from('users')
      .upsert(
        {
          id: user.id,
          email: user.email!,
          full_name: user.user_metadata?.full_name || user.user_metadata?.name || null,
        },
        { onConflict: 'id', ignoreDuplicates: false } // Update on conflict for consistency
      )

    if (upsertError) {
      console.error('Error ensuring user exists:', {
        error: upsertError,
        userId: user.id,
        timestamp: new Date().toISOString()
      })
      return NextResponse.json(
        { error: 'Failed to create user profile' },
        { status: 500 }
      )
    }

    // Step 2: Save the calculation using authenticated client (respects RLS)
    const dbData = formToDb(parsed.data, user.id, results)

    if (calculationId) {
      // Update existing - verify ownership via RLS
      const { error } = await supabase
        .from('calculations')
        .update(dbData)
        .eq('id', calculationId)
        .eq('user_id', user.id)

      if (error) {
        console.error('Error updating calculation:', {
          error,
          userId: user.id,
          calculationId,
          timestamp: new Date().toISOString()
        })
        return NextResponse.json(
          { error: error.message },
          { status: 500 }
        )
      }

      return NextResponse.json({ success: true, id: calculationId })
    } else {
      // Insert new
      const { data, error } = await supabase
        .from('calculations')
        .insert(dbData)
        .select('id')
        .single()

      if (error) {
        console.error('Error saving calculation:', {
          error,
          userId: user.id,
          timestamp: new Date().toISOString()
        })
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
