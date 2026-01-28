/**
 * Safe number formatting utilities
 * Handles NaN, undefined, null gracefully
 */

/**
 * Safely format a number to fixed decimal places
 * Returns '0.00' (or specified fallback) if value is NaN/undefined/null
 */
export function safeToFixed(
  value: number | undefined | null,
  decimals: number = 2,
  fallback: string = '0'
): string {
  if (value === undefined || value === null || isNaN(value)) {
    return Number(0).toFixed(decimals);
  }
  return value.toFixed(decimals);
}

/**
 * Safely format currency
 */
export function formatCurrency(
  value: number | undefined | null,
  options?: { decimals?: number; showSign?: boolean }
): string {
  const { decimals = 0, showSign = false } = options || {};

  if (value === undefined || value === null || isNaN(value)) {
    return '$0';
  }

  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(Math.abs(value));

  if (showSign && value < 0) {
    return `-${formatted}`;
  }

  return value < 0 ? `-${formatted}` : formatted;
}

/**
 * Safely format percentage
 */
export function formatPercent(
  value: number | undefined | null,
  decimals: number = 2
): string {
  if (value === undefined || value === null || isNaN(value)) {
    return '0%';
  }
  return `${value.toFixed(decimals)}%`;
}

/**
 * Safely format number with commas
 */
export function formatNumber(
  value: number | undefined | null,
  decimals: number = 0
): string {
  if (value === undefined || value === null || isNaN(value)) {
    return '0';
  }

  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * Check if a value is a valid number (not NaN, undefined, or null)
 */
export function isValidNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value) && isFinite(value);
}
