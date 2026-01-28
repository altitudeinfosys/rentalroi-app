'use client';

/**
 * Reusable InputField component with formatting and validation
 */

import React from 'react';
import { useFormContext } from 'react-hook-form';

export type InputFieldType = 'text' | 'currency' | 'percentage' | 'number';

interface InputFieldProps {
  name: string;
  label: string;
  type?: InputFieldType;
  required?: boolean;
  helpText?: string;
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  warning?: string;
}

/**
 * Format value for display based on type
 */
function formatValue(value: string | number | undefined | null, type: InputFieldType): string {
  // Handle empty, null, undefined, or NaN values
  if (value === undefined || value === null || value === '' ||
      (typeof value === 'number' && isNaN(value)) ||
      value === 'NaN') {
    return '';
  }

  const stringValue = String(value);
  const numericValue = parseFloat(stringValue.replace(/[^0-9.-]/g, ''));

  // Return empty string if we can't parse a valid number
  if (isNaN(numericValue)) return '';

  switch (type) {
    case 'currency':
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }).format(numericValue);
    case 'percentage':
      return `${numericValue}%`;
    case 'number':
      return new Intl.NumberFormat('en-US').format(numericValue);
    default:
      return stringValue;
  }
}

/**
 * Parse formatted value back to number
 */
function parseFormattedValue(value: string): number {
  const cleaned = value.replace(/[^0-9.-]/g, '');
  return parseFloat(cleaned) || 0;
}

export function InputField({
  name,
  label,
  type = 'text',
  required = false,
  helpText,
  placeholder,
  min,
  max,
  step,
  disabled = false,
  warning,
}: InputFieldProps) {
  const {
    register,
    formState: { errors },
    setValue,
    watch,
  } = useFormContext();

  const error = errors[name];
  const value = watch(name);
  const [displayValue, setDisplayValue] = React.useState('');
  const [isFocused, setIsFocused] = React.useState(false);

  // Update display value when value changes
  React.useEffect(() => {
    if (!isFocused) {
      // Check for valid value (not undefined, null, empty, or NaN)
      const isValidValue = value !== undefined &&
        value !== null &&
        value !== '' &&
        !(typeof value === 'number' && isNaN(value));

      if (isValidValue) {
        if (type === 'text') {
          setDisplayValue(String(value));
        } else {
          setDisplayValue(formatValue(value, type));
        }
      } else {
        setDisplayValue('');
      }
    }
  }, [value, isFocused, type]);

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);
    // Show raw value on focus (but not NaN)
    const isValidValue = value !== undefined &&
      value !== null &&
      value !== '' &&
      !(typeof value === 'number' && isNaN(value));

    if (type !== 'text' && isValidValue) {
      setDisplayValue(String(value));
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(false);
    const rawValue = e.target.value.trim();

    if (type === 'text') {
      setValue(name, rawValue);
      setDisplayValue(rawValue);
    } else {
      // For numeric types, handle empty values
      if (!rawValue) {
        setValue(name, undefined);
        setDisplayValue('');
      } else {
        const numericValue = parseFormattedValue(rawValue);
        setValue(name, numericValue);
        setDisplayValue(formatValue(numericValue, type));
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDisplayValue(e.target.value);
  };

  const inputType = type === 'text' ? 'text' : 'text'; // Always use text for formatted inputs

  return (
    <div className="mb-4">
      <label
        htmlFor={name}
        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
      >
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
        {helpText && (
          <span
            className="ml-2 text-gray-400 hover:text-gray-600 cursor-help"
            title={helpText}
          >
            ℹ️
          </span>
        )}
      </label>

      <input
        id={name}
        {...register(name, {
          required: required ? `${label} is required` : false,
          min: min !== undefined ? { value: min, message: `Minimum value is ${min}` } : undefined,
          max: max !== undefined ? { value: max, message: `Maximum value is ${max}` } : undefined,
          valueAsNumber: type !== 'text',
        })}
        type={inputType}
        className={`
          w-full px-4 py-2 border rounded-lg
          focus:outline-none focus:ring-2 focus:ring-blue-500
          disabled:bg-gray-100 disabled:cursor-not-allowed
          bg-white text-gray-900
          dark:bg-gray-800 dark:border-gray-600 dark:text-white
          ${error ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}
          ${warning ? 'border-yellow-400' : ''}
        `}
        placeholder={placeholder}
        value={displayValue}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onChange={handleChange}
        disabled={disabled}
        step={step}
      />

      {error && (
        <p className="mt-1 text-sm text-red-600 dark:text-red-400">
          {error.message as string}
        </p>
      )}

      {!error && warning && (
        <div className="mt-1 flex items-center gap-1">
          <span className="text-yellow-600 dark:text-yellow-400">⚠️</span>
          <p className="text-sm text-yellow-600 dark:text-yellow-400">
            {warning}
          </p>
        </div>
      )}

      {!error && !warning && helpText && (
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {helpText}
        </p>
      )}
    </div>
  );
}

/**
 * Select field variant for dropdowns
 */
interface SelectFieldProps {
  name: string;
  label: string;
  options: Array<{ value: string; label: string }>;
  required?: boolean;
  helpText?: string;
  disabled?: boolean;
}

export function SelectField({
  name,
  label,
  options,
  required = false,
  helpText,
  disabled = false,
}: SelectFieldProps) {
  const {
    register,
    formState: { errors },
  } = useFormContext();

  const error = errors[name];

  return (
    <div className="mb-4">
      <label
        htmlFor={name}
        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
      >
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
        {helpText && (
          <span
            className="ml-2 text-gray-400 hover:text-gray-600 cursor-help"
            title={helpText}
          >
            ℹ️
          </span>
        )}
      </label>

      <select
        id={name}
        {...register(name, {
          required: required ? `${label} is required` : false,
        })}
        className={`
          w-full px-4 py-2 border rounded-lg
          focus:outline-none focus:ring-2 focus:ring-blue-500
          disabled:bg-gray-100 disabled:cursor-not-allowed
          bg-white text-gray-900
          dark:bg-gray-800 dark:border-gray-600 dark:text-white
          ${error ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}
        `}
        disabled={disabled}
      >
        <option value="">Select {label}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      {error && (
        <p className="mt-1 text-sm text-red-600 dark:text-red-400">
          {error.message as string}
        </p>
      )}

      {!error && helpText && (
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {helpText}
        </p>
      )}
    </div>
  );
}
