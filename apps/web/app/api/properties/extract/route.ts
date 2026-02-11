import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { extractPropertyFromUrl } from '@/lib/extractors';

const requestSchema = z.object({
  url: z.string().url('Please provide a valid URL'),
});

/**
 * POST /api/properties/extract
 * Extracts property data from a Zillow or Redfin listing URL.
 * No authentication required (calculator works without login).
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const parsed = requestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || 'Invalid request' },
        { status: 400 }
      );
    }

    // Extract property data
    const result = await extractPropertyFromUrl(parsed.data.url);

    return NextResponse.json(result, {
      status: result.success ? 200 : 422,
    });
  } catch (err) {
    console.error('Unexpected error in property extraction:', err);
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    );
  }
}
