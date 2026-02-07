'use client';

/**
 * ExpenseToggleField - Input field with $ / % toggle
 * Allows users to enter expenses as either dollar amounts or percentages
 */

import React, { useEffect, useState, useCallback } from 'react';
import { useFormContext } from 'react-hook-form';

type ExpenseMode = 'dollar' | 'percent';

interface ExpenseToggleFieldProps {
  /** Field name for the dollar value (stored in form) */
  dollarFieldName: string;
  /** Field name for the percent value (stored in form) */
  percentFieldName: string;
  /** Field name for the mode (stored in form) */
  modeFieldName: string;
  /** Display label */
  label: string;
  /** Is field required */
  required?: boolean;
  /** Help text for dollar mode */
  dollarHelpText?: string;
  /** Help text for percent mode */
  percentHelpText?: string;
  /** Placeholder for dollar input */
  dollarPlaceholder?: string;
  /** Placeholder for percent input */
  percentPlaceholder?: string;
  /** The base value that percentages are calculated from */
  percentBaseValue: number;
  /** Label for what the percentage is based on (e.g., "of purchase price") */
  percentBaseLabel: string;
  /** Whether the dollar value is annual (true) or monthly (false) */
  isDollarAnnual?: boolean;
  /** Whether the percent converts to annual (true) or uses percentBaseValue directly */
  isPercentAnnual?: boolean;
  /** Min value for percent */
  minPercent?: number;
  /** Max value for percent */
  maxPercent?: number;
}

export function ExpenseToggleField({
  dollarFieldName,
  percentFieldName,
  modeFieldName,
  label,
  required = false,
  dollarHelpText,
  percentHelpText,
  dollarPlaceholder = '0',
  percentPlaceholder = '0',
  percentBaseValue,
  percentBaseLabel,
  isDollarAnnual = true,
  isPercentAnnual = true,
  minPercent = 0,
  maxPercent = 100,
}: ExpenseToggleFieldProps) {
  const {
    register,
    setValue,
    watch,
    formState: { errors },
  } = useFormContext();

  // Watch values
  const dollarValue = watch(dollarFieldName);
  const percentValue = watch(percentFieldName);
  const mode = watch(modeFieldName) as ExpenseMode | undefined;

  // Local display state
  const [displayValue, setDisplayValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  // Default mode to 'dollar' if not set
  useEffect(() => {
    if (!mode) {
      setValue(modeFieldName, 'dollar');
    }
  }, [mode, modeFieldName, setValue]);

  const currentMode = mode || 'dollar';

  // Calculate equivalent values
  const calculateDollarFromPercent = useCallback((percent: number): number => {
    if (!percentBaseValue || isNaN(percent)) return 0;
    const annual = (percentBaseValue * percent) / 100;
    return isDollarAnnual ? annual : annual / 12;
  }, [percentBaseValue, isDollarAnnual]);

  const calculatePercentFromDollar = useCallback((dollar: number): number => {
    if (!percentBaseValue || isNaN(dollar)) return 0;
    const annual = isDollarAnnual ? dollar : dollar * 12;
    return (annual / percentBaseValue) * 100;
  }, [percentBaseValue, isDollarAnnual]);

  // Update display value when form value changes (and not focused)
  useEffect(() => {
    if (isFocused) return;

    const value = currentMode === 'dollar' ? dollarValue : percentValue;
    if (value !== undefined && value !== null && !isNaN(value)) {
      if (currentMode === 'dollar') {
        setDisplayValue(formatCurrency(value));
      } else {
        setDisplayValue(`${value}%`);
      }
    } else {
      setDisplayValue('');
    }
  }, [dollarValue, percentValue, currentMode, isFocused]);

  // Handle mode change
  const handleModeChange = (newMode: ExpenseMode) => {
    setValue(modeFieldName, newMode);

    // Convert and sync values when switching modes
    if (newMode === 'dollar' && percentValue !== undefined && !isNaN(percentValue)) {
      const newDollar = calculateDollarFromPercent(percentValue);
      setValue(dollarFieldName, Math.round(newDollar * 100) / 100);
    } else if (newMode === 'percent' && dollarValue !== undefined && !isNaN(dollarValue)) {
      const newPercent = calculatePercentFromDollar(dollarValue);
      setValue(percentFieldName, Math.round(newPercent * 100) / 100);
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
    const value = currentMode === 'dollar' ? dollarValue : percentValue;
    if (value !== undefined && value !== null && !isNaN(value)) {
      setDisplayValue(String(value));
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(false);
    const rawValue = e.target.value.trim();

    if (!rawValue) {
      if (currentMode === 'dollar') {
        setValue(dollarFieldName, 0);
      } else {
        setValue(percentFieldName, 0);
      }
      setDisplayValue('');
      return;
    }

    const numericValue = parseFloat(rawValue.replace(/[^0-9.-]/g, ''));

    if (isNaN(numericValue)) {
      setDisplayValue('');
      return;
    }

    if (currentMode === 'dollar') {
      setValue(dollarFieldName, numericValue);
      // Also update the percent equivalent
      const percentEquiv = calculatePercentFromDollar(numericValue);
      setValue(percentFieldName, Math.round(percentEquiv * 100) / 100);
      setDisplayValue(formatCurrency(numericValue));
    } else {
      setValue(percentFieldName, numericValue);
      // Also update the dollar equivalent
      const dollarEquiv = calculateDollarFromPercent(numericValue);
      setValue(dollarFieldName, Math.round(dollarEquiv * 100) / 100);
      setDisplayValue(`${numericValue}%`);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDisplayValue(e.target.value);
  };

  // Get equivalent display
  const getEquivalentDisplay = () => {
    if (currentMode === 'dollar') {
      const percent = calculatePercentFromDollar(dollarValue || 0);
      return `≈ ${percent.toFixed(2)}% ${percentBaseLabel}`;
    } else {
      const dollar = calculateDollarFromPercent(percentValue || 0);
      return `≈ ${formatCurrency(dollar)}${isDollarAnnual ? '/year' : '/month'}`;
    }
  };

  const error = currentMode === 'dollar'
    ? errors[dollarFieldName]
    : errors[percentFieldName];

  const helpText = currentMode === 'dollar' ? dollarHelpText : percentHelpText;

  return (
    <div className="mb-4">
      {/* Label and Toggle */}
      <div className="flex items-center justify-between mb-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>

        {/* Toggle Buttons */}
        <div className="flex rounded-lg bg-gray-100 dark:bg-gray-700 p-0.5">
          <button
            type="button"
            onClick={() => handleModeChange('dollar')}
            className={`
              px-3 py-1 text-xs font-medium rounded-md transition-colors
              ${currentMode === 'dollar'
                ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
              }
            `}
          >
            $
          </button>
          <button
            type="button"
            onClick={() => handleModeChange('percent')}
            className={`
              px-3 py-1 text-xs font-medium rounded-md transition-colors
              ${currentMode === 'percent'
                ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
              }
            `}
          >
            %
          </button>
        </div>
      </div>

      {/* Input */}
      <div className="relative">
        <input
          type="text"
          value={displayValue}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={currentMode === 'dollar' ? dollarPlaceholder : percentPlaceholder}
          className={`
            w-full px-4 py-2 border rounded-lg
            focus:outline-none focus:ring-2 focus:ring-blue-500
            bg-white text-gray-900
            dark:bg-gray-800 dark:border-gray-600 dark:text-white
            ${error ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}
          `}
        />

        {/* Equivalent value badge */}
        {percentBaseValue > 0 && (dollarValue > 0 || percentValue > 0) && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">
            {getEquivalentDisplay()}
          </div>
        )}
      </div>

      {/* Error message */}
      {error && (
        <p className="mt-1 text-sm text-red-600 dark:text-red-400">
          {error.message as string}
        </p>
      )}

      {/* Help text */}
      {!error && helpText && (
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {helpText}
        </p>
      )}

      {/* Note: Form values are managed via setValue() calls in this component.
          No hidden inputs needed since react-hook-form tracks values internally. */}
    </div>
  );
}

/**
 * Format number as currency
 */
function formatCurrency(value: number): string {
  if (value === undefined || value === null || isNaN(value)) {
    return '$0';
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}
