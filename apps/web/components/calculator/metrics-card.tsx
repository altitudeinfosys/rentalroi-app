'use client';

import React from 'react';

export type MetricTrend = 'up' | 'down' | 'neutral';
export type MetricType = 'currency' | 'percentage' | 'number' | 'ratio';

export interface MetricsCardProps {
  /**
   * Display name of the metric
   */
  label: string;

  /**
   * The calculated value to display
   */
  value: number | null;

  /**
   * Type of metric for formatting
   */
  type: MetricType;

  /**
   * Optional trend indicator
   */
  trend?: MetricTrend;

  /**
   * Optional help text/tooltip explanation
   */
  helpText?: string;

  /**
   * Optional custom color override
   */
  color?: 'green' | 'red' | 'blue' | 'gray';

  /**
   * Optional prefix (e.g., ">", "<", "~")
   */
  prefix?: string;

  /**
   * Optional suffix (e.g., "/mo", "/year")
   */
  suffix?: string;
}

/**
 * Format value based on metric type
 */
function formatValue(value: number | null, type: MetricType): string {
  if (value === null) return 'N/A';

  switch (type) {
    case 'currency':
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(value);

    case 'percentage':
      return `${value.toFixed(2)}%`;

    case 'ratio':
      return value.toFixed(2);

    case 'number':
      return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(value);

    default:
      return value.toString();
  }
}

/**
 * Determine color based on value and trend
 */
function getColorClass(
  value: number | null,
  trend?: MetricTrend,
  customColor?: string
): string {
  if (customColor) {
    switch (customColor) {
      case 'green':
        return 'text-green-600 dark:text-green-400';
      case 'red':
        return 'text-red-600 dark:text-red-400';
      case 'blue':
        return 'text-blue-600 dark:text-blue-400';
      case 'gray':
        return 'text-gray-600 dark:text-gray-400';
      default:
        return 'text-gray-900 dark:text-gray-100';
    }
  }

  if (value === null) return 'text-gray-400 dark:text-gray-500';

  // Default color logic based on value
  if (value > 0) {
    return 'text-green-600 dark:text-green-400';
  } else if (value < 0) {
    return 'text-red-600 dark:text-red-400';
  } else {
    return 'text-gray-600 dark:text-gray-400';
  }
}

/**
 * Get trend icon
 */
function getTrendIcon(trend: MetricTrend): React.ReactNode {
  switch (trend) {
    case 'up':
      return (
        <svg
          className="w-4 h-4 text-green-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 10l7-7m0 0l7 7m-7-7v18"
          />
        </svg>
      );
    case 'down':
      return (
        <svg
          className="w-4 h-4 text-red-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 14l-7 7m0 0l-7-7m7 7V3"
          />
        </svg>
      );
    case 'neutral':
      return (
        <svg
          className="w-4 h-4 text-gray-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M20 12H4"
          />
        </svg>
      );
  }
}

/**
 * MetricsCard Component
 *
 * Displays a single investment metric with optional trend indicator and tooltip
 */
export function MetricsCard({
  label,
  value,
  type,
  trend,
  helpText,
  color,
  prefix,
  suffix,
}: MetricsCardProps) {
  const formattedValue = formatValue(value, type);
  const colorClass = getColorClass(value, trend, color);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
          {label}
        </span>
        {trend && <div className="flex items-center">{getTrendIcon(trend)}</div>}
      </div>

      <div className="flex items-baseline gap-1">
        {prefix && (
          <span className="text-lg font-semibold text-gray-500 dark:text-gray-400">
            {prefix}
          </span>
        )}
        <span className={`text-2xl font-bold ${colorClass}`}>
          {formattedValue}
        </span>
        {suffix && (
          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
            {suffix}
          </span>
        )}
      </div>

      {helpText && (
        <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400">{helpText}</p>
        </div>
      )}
    </div>
  );
}

/**
 * MetricsGrid Component
 *
 * Layout wrapper for displaying multiple metrics in a responsive grid
 */
export function MetricsGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {children}
    </div>
  );
}
