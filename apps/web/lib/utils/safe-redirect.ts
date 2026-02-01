/**
 * Utility to validate redirect URLs and prevent open redirect attacks.
 * Only allows relative paths starting with / (no protocol, no external domains).
 *
 * Security features:
 * - Decodes percent-encoded characters before validation
 * - Normalizes paths to resolve dot-segments (../, ./)
 * - Only allows explicitly allowlisted paths
 * - Prevents protocol-relative URLs, backslashes, and @ symbols
 */

const ALLOWED_PATHS = [
  '/dashboard',
  '/calculator',
  '/calculations',
  '/settings',
  '/reset-password',
]

/**
 * Normalizes a path by decoding and resolving dot-segments.
 * Returns null if the path is malformed or cannot be normalized safely.
 */
function normalizePath(path: string): string | null {
  try {
    // Decode percent-encoded characters
    const decoded = decodeURIComponent(path)

    // Use URL constructor to normalize the path (resolves ../ and ./)
    // We use a dummy base URL since we only care about the pathname
    const url = new URL(decoded, 'http://localhost')

    // Return the normalized pathname (URL constructor handles dot-segments)
    return url.pathname
  } catch {
    // If decoding or URL parsing fails, the path is malformed
    return null
  }
}

/**
 * Validates a redirect path to prevent open redirect vulnerabilities.
 * @param path - The path to validate
 * @param fallback - The fallback path if validation fails (default: '/dashboard')
 * @returns A safe redirect path
 */
export function getSafeRedirectPath(
  path: string | null | undefined,
  fallback: string = '/dashboard'
): string {
  // If no path provided, use fallback
  if (!path) {
    return fallback
  }

  // Must start with /
  if (!path.startsWith('/')) {
    return fallback
  }

  // Must not be a protocol-relative URL (//example.com)
  if (path.startsWith('//')) {
    return fallback
  }

  // Must not contain @ (prevents user:pass@host attacks)
  if (path.includes('@')) {
    return fallback
  }

  // Must not contain backslashes (prevents //\ bypass)
  if (path.includes('\\')) {
    return fallback
  }

  // Normalize the path to handle encoded characters and dot-segments
  // This prevents bypasses like /dashboard/../admin or %2e%2e/admin
  const normalizedPath = normalizePath(path)

  if (!normalizedPath) {
    return fallback
  }

  // Re-check security constraints on normalized path
  if (!normalizedPath.startsWith('/') || normalizedPath.startsWith('//')) {
    return fallback
  }

  // Check if normalized path is an allowed path or starts with an allowed path
  const isAllowed = ALLOWED_PATHS.some(
    (allowed) => normalizedPath === allowed || normalizedPath.startsWith(`${allowed}/`)
  )

  // For strict security, only allow known paths
  if (!isAllowed && normalizedPath !== '/') {
    return fallback
  }

  // Return the normalized path (not the original) to prevent any bypass
  // Preserve query string from original if present
  const queryIndex = path.indexOf('?')
  if (queryIndex !== -1) {
    return normalizedPath + path.substring(queryIndex)
  }

  return normalizedPath
}

/**
 * Validates a redirect URL for server-side use.
 * Returns a full URL that is safe to redirect to.
 * @param url - The URL to validate
 * @param origin - The origin to use for constructing the redirect URL
 * @param fallback - The fallback path if validation fails
 */
export function getSafeRedirectUrl(
  url: string | null | undefined,
  origin: string,
  fallback: string = '/dashboard'
): string {
  const safePath = getSafeRedirectPath(url, fallback)
  return `${origin}${safePath}`
}
