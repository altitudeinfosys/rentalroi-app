import type { ListingSource } from './types';

interface ValidationResult {
  valid: boolean;
  source?: ListingSource;
  error?: string;
}

/**
 * Validates a listing URL and detects whether it's from Zillow or Redfin.
 * Rejects non-HTTPS URLs, non-property pages (search results, home pages), etc.
 */
export function validateListingUrl(rawUrl: string): ValidationResult {
  const trimmed = rawUrl.trim();

  // Basic URL parsing
  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return { valid: false, error: 'Invalid URL format. Please paste a full listing URL.' };
  }

  // Require HTTPS
  if (parsed.protocol !== 'https:') {
    return { valid: false, error: 'URL must use HTTPS.' };
  }

  const hostname = parsed.hostname.toLowerCase();

  // Detect Zillow
  if (hostname === 'www.zillow.com' || hostname === 'zillow.com') {
    // Zillow property pages look like /homedetails/ADDRESS/ZPID_zpid/
    if (!parsed.pathname.includes('/homedetails/')) {
      return {
        valid: false,
        error: 'This doesn\'t look like a Zillow property page. Please paste a URL from a specific listing (e.g., zillow.com/homedetails/...).',
      };
    }
    return { valid: true, source: 'zillow' };
  }

  // Detect Redfin
  if (hostname === 'www.redfin.com' || hostname === 'redfin.com') {
    // Redfin property pages contain a path segment starting with a state abbreviation
    // e.g., /CA/San-Francisco/123-Main-St-94102/home/12345
    // They should NOT be search result pages like /city/12345/CA/San-Francisco
    const path = parsed.pathname;
    if (path.includes('/home/') || path.match(/\/[A-Z]{2}\/.+\/.+\/home\//i)) {
      return { valid: true, source: 'redfin' };
    }
    return {
      valid: false,
      error: 'This doesn\'t look like a Redfin property page. Please paste a URL from a specific listing.',
    };
  }

  return {
    valid: false,
    error: 'Only Zillow and Redfin URLs are supported. Please paste a listing URL from one of these sites.',
  };
}
