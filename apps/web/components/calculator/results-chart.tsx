'use client';

import React from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  TooltipProps,
} from 'recharts';

export type ChartType = 'line' | 'bar' | 'area';

export interface ChartDataPoint {
  /**
   * X-axis label (e.g., month name, year number)
   */
  label: string;

  /**
   * Data values for this point
   */
  [key: string]: string | number;
}

export interface ChartSeries {
  /**
   * Data key to plot
   */
  dataKey: string;

  /**
   * Display name in legend
   */
  name: string;

  /**
   * Color for this series
   */
  color: string;

  /**
   * Optional stroke width (for line charts)
   */
  strokeWidth?: number;

  /**
   * Optional fill opacity (for area charts)
   */
  fillOpacity?: number;
}

export interface ResultsChartProps {
  /**
   * Type of chart to render
   */
  type: ChartType;

  /**
   * Chart data
   */
  data: ChartDataPoint[];

  /**
   * Series to plot
   */
  series: ChartSeries[];

  /**
   * Chart title
   */
  title?: string;

  /**
   * Height in pixels
   */
  height?: number;

  /**
   * Show grid lines
   */
  showGrid?: boolean;

  /**
   * Format function for Y-axis and tooltip values
   */
  formatValue?: (value: number) => string;

  /**
   * X-axis label
   */
  xAxisLabel?: string;

  /**
   * Y-axis label
   */
  yAxisLabel?: string;
}

/**
 * Default value formatter (currency)
 */
function defaultFormatValue(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Custom Tooltip Component
 */
interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{
    value: number
    name: string
    color?: string
  }>
  label?: string
  formatValue?: (value: number) => string
}

function CustomTooltip({
  active,
  payload,
  label,
  formatValue = defaultFormatValue,
}: CustomTooltipProps) {
  if (!active || !payload || !payload.length) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3">
      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
        {label}
      </p>
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center gap-2 mb-1">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-xs text-gray-600 dark:text-gray-400">
            {entry.name}:
          </span>
          <span className="text-xs font-semibold text-gray-900 dark:text-gray-100">
            {formatValue(entry.value as number)}
          </span>
        </div>
      ))}
    </div>
  );
}

/**
 * ResultsChart Component
 *
 * Renders a configurable chart using Recharts
 */
export function ResultsChart({
  type,
  data,
  series,
  title,
  height = 300,
  showGrid = true,
  formatValue = defaultFormatValue,
  xAxisLabel,
  yAxisLabel,
}: ResultsChartProps) {
  // Common chart props
  const commonProps = {
    data,
    margin: { top: 5, right: 30, left: 20, bottom: 5 },
  };

  const xAxisProps = {
    dataKey: 'label' as const,
    tick: { fontSize: 12 },
    label: xAxisLabel ? { value: xAxisLabel, position: 'insideBottom' as const, offset: -5 } : undefined,
  };

  const yAxisProps = {
    tick: { fontSize: 12 },
    tickFormatter: formatValue,
    label: yAxisLabel ? { value: yAxisLabel, angle: -90, position: 'insideLeft' as const } : undefined,
  };

  const gridProps = showGrid
    ? {
        strokeDasharray: '3 3',
        stroke: '#e5e7eb',
        className: 'dark:stroke-gray-700',
      }
    : undefined;

  const tooltipProps = {
    content: <CustomTooltip formatValue={formatValue} />,
    cursor: { fill: 'rgba(0, 0, 0, 0.05)' },
  };

  const legendProps = {
    wrapperStyle: { fontSize: '12px' },
  };

  // Render chart based on type
  const renderChart = () => {
    switch (type) {
      case 'line':
        return (
          <LineChart {...commonProps}>
            {showGrid && <CartesianGrid {...gridProps} />}
            <XAxis {...xAxisProps} />
            <YAxis {...yAxisProps} />
            <Tooltip {...tooltipProps} />
            <Legend {...legendProps} />
            {series.map((s) => (
              <Line
                key={s.dataKey}
                type="monotone"
                dataKey={s.dataKey}
                name={s.name}
                stroke={s.color}
                strokeWidth={s.strokeWidth || 2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
            ))}
          </LineChart>
        );

      case 'bar':
        return (
          <BarChart {...commonProps}>
            {showGrid && <CartesianGrid {...gridProps} />}
            <XAxis {...xAxisProps} />
            <YAxis {...yAxisProps} />
            <Tooltip {...tooltipProps} />
            <Legend {...legendProps} />
            {series.map((s) => (
              <Bar key={s.dataKey} dataKey={s.dataKey} name={s.name} fill={s.color} />
            ))}
          </BarChart>
        );

      case 'area':
        return (
          <AreaChart {...commonProps}>
            {showGrid && <CartesianGrid {...gridProps} />}
            <XAxis {...xAxisProps} />
            <YAxis {...yAxisProps} />
            <Tooltip {...tooltipProps} />
            <Legend {...legendProps} />
            {series.map((s) => (
              <Area
                key={s.dataKey}
                type="monotone"
                dataKey={s.dataKey}
                name={s.name}
                stroke={s.color}
                fill={s.color}
                fillOpacity={s.fillOpacity || 0.6}
              />
            ))}
          </AreaChart>
        );

      default:
        return null;
    }
  };

  return (
    <div className="w-full">
      {title && (
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          {title}
        </h3>
      )}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <ResponsiveContainer width="100%" height={height}>
          {renderChart()}
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/**
 * Predefined chart configurations
 */

export const CHART_COLORS = {
  primary: '#3b82f6', // blue-500
  success: '#10b981', // green-500
  danger: '#ef4444', // red-500
  warning: '#f59e0b', // amber-500
  purple: '#8b5cf6', // violet-500
  teal: '#14b8a6', // teal-500
  gray: '#6b7280', // gray-500
};

/**
 * Format percentage value
 */
export function formatPercentage(value: number): string {
  return `${value.toFixed(1)}%`;
}

/**
 * Format number with commas
 */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}
