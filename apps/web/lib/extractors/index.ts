import { execFileSync } from 'child_process';
import { validateListingUrl } from './url-validator';
import { parseZillowHtml } from './zillow-parser';
import { parseRedfinHtml } from './redfin-parser';
import type { ExtractedPropertyData, ExtractPropertyResponse } from './types';

/** All fields we attempt to extract */
const ALL_EXTRACTABLE_FIELDS = [
  'title', 'address', 'city', 'state', 'zipCode',
  'bedrooms', 'bathrooms', 'squareFeet', 'propertyType',
  'purchasePrice', 'propertyTaxAnnual', 'hoaMonthly',
] as const;

const USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15';

/**
 * Fetch via Node fetch (works for Redfin and some Zillow pages).
 */
async function fetchWithNodeFetch(url: string): Promise<{ html: string; status: number }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      redirect: 'follow',
    });

    if (!response.ok) {
      return { html: '', status: response.status };
    }

    return { html: await response.text(), status: response.status };
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Fetch via curl subprocess using execFileSync (no shell injection risk).
 * Curl has a different TLS fingerprint than Node's undici/fetch,
 * which helps bypass bot detection on sites like Zillow.
 */
function fetchWithCurl(url: string): string {
  const result = execFileSync('curl', [
    '-s',
    '-L',
    '--max-time', '15',
    '-H', `User-Agent: ${USER_AGENT}`,
    '-H', 'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    '-H', 'Accept-Language: en-US,en;q=0.9',
    url,
  ], { maxBuffer: 10 * 1024 * 1024, timeout: 20000 });

  return result.toString('utf-8');
}

/**
 * Fetch a listing page HTML. Tries Node fetch first, falls back to curl on 403.
 */
async function fetchPropertyPage(url: string): Promise<string> {
  // Try Node fetch first
  const { html, status } = await fetchWithNodeFetch(url);

  if (status === 200 && html.length > 1000) {
    return html;
  }

  // On 403 or empty response, fall back to curl (different TLS fingerprint)
  if (status === 403 || html.length < 1000) {
    try {
      const curlHtml = fetchWithCurl(url);
      if (curlHtml.length > 1000) {
        return curlHtml;
      }
    } catch {
      // curl fallback failed too
    }
  }

  if (status === 403) {
    throw new Error('Access denied. The listing site may be blocking automated requests. Try again later or enter the property details manually.');
  }
  if (status === 429) {
    throw new Error('Too many requests. Please wait a minute and try again.');
  }
  throw new Error(`Failed to fetch listing page (HTTP ${status}). Please check the URL and try again.`);
}

/**
 * Compute which fields were extracted and which are missing.
 */
function computeFieldCoverage(data: ExtractedPropertyData): {
  extractedFields: string[];
  missingFields: string[];
} {
  const extractedFields: string[] = [];
  const missingFields: string[] = [];

  for (const field of ALL_EXTRACTABLE_FIELDS) {
    const value = data[field as keyof ExtractedPropertyData];
    if (value !== undefined && value !== null && value !== '') {
      extractedFields.push(field);
    } else {
      missingFields.push(field);
    }
  }

  return { extractedFields, missingFields };
}

/**
 * Main entry point: validate URL → fetch HTML → parse → return structured data.
 */
export async function extractPropertyFromUrl(url: string): Promise<ExtractPropertyResponse> {
  // Step 1: Validate URL
  const validation = validateListingUrl(url);
  if (!validation.valid || !validation.source) {
    return {
      success: false,
      data: {},
      source: 'zillow',
      extractedFields: [],
      missingFields: [...ALL_EXTRACTABLE_FIELDS],
      error: validation.error,
    };
  }

  // Step 2: Fetch HTML
  let html: string;
  try {
    html = await fetchPropertyPage(url);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch the listing page.';
    return {
      success: false,
      data: {},
      source: validation.source,
      extractedFields: [],
      missingFields: [...ALL_EXTRACTABLE_FIELDS],
      error: message,
    };
  }

  // Step 3: Parse HTML based on source
  let data: ExtractedPropertyData;
  try {
    data = validation.source === 'zillow'
      ? parseZillowHtml(html)
      : parseRedfinHtml(html);
  } catch (err) {
    return {
      success: false,
      data: {},
      source: validation.source,
      extractedFields: [],
      missingFields: [...ALL_EXTRACTABLE_FIELDS],
      error: 'Failed to parse the listing page. The page format may have changed. Please enter the property details manually.',
    };
  }

  // Step 4: Compute field coverage
  const { extractedFields, missingFields } = computeFieldCoverage(data);

  // If zero fields were extracted, it's likely a parsing failure
  if (extractedFields.length === 0) {
    return {
      success: false,
      data: {},
      source: validation.source,
      extractedFields: [],
      missingFields: [...ALL_EXTRACTABLE_FIELDS],
      error: 'Could not extract any property data from this listing. The page format may have changed. Please enter the details manually.',
    };
  }

  return {
    success: true,
    data,
    source: validation.source,
    extractedFields,
    missingFields,
  };
}

export type { ExtractedPropertyData, ExtractPropertyResponse, ListingSource } from './types';
