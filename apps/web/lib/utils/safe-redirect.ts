/**
 * Utility to validate redirect URLs and prevent open redirect attacks.
 * Only allows relative paths starting with / (no protocol, no external domains).
 */

const ALLOWED_PATHS = [
  '/dashboard',
  '/calculator',
  '/calculations',
  '/settings',
  '/reset-password',
]

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

  // Extract just the pathname (strip query params for validation)
  const pathname = path.split('?')[0]

  // Check if it's an allowed path or starts with an allowed path
  const isAllowed = ALLOWED_PATHS.some(
    (allowed) => pathname === allowed || pathname.startsWith(`${allowed}/`)
  )

  // For strict security, only allow known paths
  // If you want to allow any relative path, remove this check
  if (!isAllowed && pathname !== '/') {
    return fallback
  }

  return path
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
