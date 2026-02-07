'use client';

import React, { useState } from 'react';

export interface TableColumn {
  /**
   * Column key (matches data property)
   */
  key: string;

  /**
   * Display header
   */
  header: string;

  /**
   * Column type for formatting
   */
  type?: 'currency' | 'percentage' | 'number' | 'text';

  /**
   * Custom formatter function
   */
  format?: (value: any) => string;

  /**
   * Is this column sortable?
   */
  sortable?: boolean;

  /**
   * Column alignment
   */
  align?: 'left' | 'center' | 'right';

  /**
   * Column width (CSS value)
   */
  width?: string;
}

export interface ResultsTableProps {
  /**
   * Table data rows
   */
  data: Record<string, any>[];

  /**
   * Column definitions
   */
  columns: TableColumn[];

  /**
   * Table title
   */
  title?: string;

  /**
   * Show export to CSV button
   */
  showExport?: boolean;

  /**
   * Sticky header (for long tables)
   */
  stickyHeader?: boolean;

  /**
   * Maximum height before scrolling
   */
  maxHeight?: string;
}

type SortDirection = 'asc' | 'desc' | null;

/**
 * Format value based on column type
 */
function formatValue(value: any, column: TableColumn): string {
  // Use custom formatter if provided
  if (column.format) {
    return column.format(value);
  }

  // Handle null/undefined
  if (value === null || value === undefined) {
    return '-';
  }

  // Format based on type
  switch (column.type) {
    case 'currency':
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(value);

    case 'percentage':
      return `${typeof value === 'number' ? value.toFixed(2) : value}%`;

    case 'number':
      return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(value);

    case 'text':
    default:
      return String(value);
  }
}

/**
 * Export table data to CSV
 */
function exportToCSV(data: Record<string, any>[], columns: TableColumn[], filename: string) {
  // Create CSV header
  const header = columns.map((col) => col.header).join(',');

  // Create CSV rows
  const rows = data.map((row) => {
    return columns
      .map((col) => {
        const value = row[col.key];
        const formatted = formatValue(value, col);
        // Escape commas and quotes
        return `"${formatted.replace(/"/g, '""')}"`;
      })
      .join(',');
  });

  // Combine header and rows
  const csv = [header, ...rows].join('\n');

  // Create download link
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Sort icon component
 */
function SortIcon({ direction }: { direction: SortDirection }) {
  if (direction === 'asc') {
    return (
      <svg
        className="w-4 h-4 text-blue-500"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    );
  }

  if (direction === 'desc') {
    return (
      <svg
        className="w-4 h-4 text-blue-500"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    );
  }

  return (
    <svg
      className="w-4 h-4 text-gray-400"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
      />
    </svg>
  );
}

/**
 * ResultsTable Component
 *
 * Displays tabular data with sorting and export capabilities
 */
export function ResultsTable({
  data,
  columns,
  title,
  showExport = false,
  stickyHeader = true,
  maxHeight = '600px',
}: ResultsTableProps) {
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  // Handle column header click for sorting
  const handleSort = (columnKey: string) => {
    const column = columns.find((c) => c.key === columnKey);
    if (!column?.sortable) return;

    if (sortColumn === columnKey) {
      // Toggle sort direction
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortDirection(null);
        setSortColumn(null);
      } else {
        setSortDirection('asc');
      }
    } else {
      setSortColumn(columnKey);
      setSortDirection('asc');
    }
  };

  // Sort data
  const sortedData = React.useMemo(() => {
    if (!sortColumn || !sortDirection) return data;

    return [...data].sort((a, b) => {
      const aValue = a[sortColumn];
      const bValue = b[sortColumn];

      // Handle null/undefined
      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return sortDirection === 'asc' ? 1 : -1;
      if (bValue == null) return sortDirection === 'asc' ? -1 : 1;

      // Compare values
      let comparison = 0;
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        comparison = aValue - bValue;
      } else {
        comparison = String(aValue).localeCompare(String(bValue));
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [data, sortColumn, sortDirection]);

  // Handle export
  const handleExport = () => {
    const filename = title
      ? `${title.replace(/\s+/g, '-').toLowerCase()}.csv`
      : 'results.csv';
    exportToCSV(sortedData, columns, filename);
  };

  return (
    <div className="w-full">
      {/* Header */}
      {(title || showExport) && (
        <div className="flex items-center justify-between mb-4">
          {title && (
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {title}
            </h3>
          )}
          {showExport && (
            <button
              onClick={handleExport}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
              Export CSV
            </button>
          )}
        </div>
      )}

      {/* Table container with scroll */}
      <div
        className="overflow-auto rounded-lg border border-gray-200 dark:border-gray-700"
        style={{ maxHeight }}
      >
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          {/* Table head */}
          <thead
            className={`bg-gray-50 dark:bg-gray-800 ${
              stickyHeader ? 'sticky top-0 z-10' : ''
            }`}
          >
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  className={`px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider ${
                    column.align === 'right'
                      ? 'text-right'
                      : column.align === 'center'
                      ? 'text-center'
                      : 'text-left'
                  } ${column.sortable ? 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700' : ''}`}
                  style={{ width: column.width }}
                  onClick={() => column.sortable && handleSort(column.key)}
                >
                  <div className="flex items-center gap-2 justify-between">
                    <span>{column.header}</span>
                    {column.sortable && (
                      <SortIcon
                        direction={sortColumn === column.key ? sortDirection : null}
                      />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          {/* Table body */}
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
            {sortedData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-6 py-12 text-center text-sm text-gray-500 dark:text-gray-400"
                >
                  No data available
                </td>
              </tr>
            ) : (
              sortedData.map((row, rowIndex) => (
                <tr
                  key={rowIndex}
                  className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={`px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 ${
                        column.align === 'right'
                          ? 'text-right'
                          : column.align === 'center'
                          ? 'text-center'
                          : 'text-left'
                      }`}
                    >
                      {formatValue(row[column.key], column)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer with row count */}
      <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
        Showing {sortedData.length} {sortedData.length === 1 ? 'row' : 'rows'}
      </div>
    </div>
  );
}
