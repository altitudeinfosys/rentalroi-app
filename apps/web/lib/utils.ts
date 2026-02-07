/**
 * Utility function to merge class names
 * Simple implementation without clsx/tailwind-merge dependency
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}
