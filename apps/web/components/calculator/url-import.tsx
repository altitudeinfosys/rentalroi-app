'use client';

import React, { useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { Loader2, Link, CheckCircle, AlertCircle, X } from 'lucide-react';
import { DEFAULT_VALUES, getDefaultsForPropertyType } from '@repo/calculations';
import type { CalculatorFormData } from '@/lib/validation/calculator-schema';
import type { ExtractPropertyResponse, ExtractedPropertyData } from '@/lib/extractors/types';

type ImportStatus = 'idle' | 'loading' | 'success' | 'error';

/**
 * Compute expense fields from extracted data using standard percentage-based rules.
 * This fills in the dollar values that the form needs, derived from the purchase price.
 */
function computeDerivedFields(extracted: ExtractedPropertyData): Partial<CalculatorFormData> {
  const derived: Partial<CalculatorFormData> = {};
  const price = extracted.purchasePrice;
  if (!price) return derived;

  // Insurance: 0.5% of purchase price annually
  derived.insuranceAnnual = Math.round(price * 0.005);
  derived.insurancePercent = 0.5;

  // Property tax: use extracted value, or estimate at 1.2% of purchase price
  if (extracted.propertyTaxAnnual) {
    derived.propertyTaxAnnual = extracted.propertyTaxAnnual;
    derived.propertyTaxPercent = Math.round((extracted.propertyTaxAnnual / price) * 10000) / 100;
  } else {
    derived.propertyTaxAnnual = Math.round(price * 0.012);
    derived.propertyTaxPercent = 1.2;
  }

  // Maintenance: 1% of property value annually → monthly
  derived.maintenanceMonthly = Math.round((price * 0.01) / 12);
  derived.maintenancePercent = 1;

  // Closing costs: 3% of purchase price
  derived.closingCosts = Math.round(price * 0.03);

  return derived;
}

export function UrlImport() {
  const form = useFormContext<CalculatorFormData>();
  const [url, setUrl] = useState('');
  const [status, setStatus] = useState<ImportStatus>('idle');
  const [result, setResult] = useState<ExtractPropertyResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  const handleImport = async () => {
    const trimmedUrl = url.trim();
    if (!trimmedUrl) return;

    setStatus('loading');
    setResult(null);
    setErrorMessage('');

    try {
      const response = await fetch('/api/properties/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: trimmedUrl }),
      });

      const data: ExtractPropertyResponse = await response.json();

      if (!data.success) {
        setStatus('error');
        setErrorMessage(data.error || 'Failed to extract property data.');
        return;
      }

      // Get property-type-specific defaults if we extracted a property type
      const propertyType = data.data.propertyType || 'single_family';
      const typeDefaults = getDefaultsForPropertyType(propertyType);

      // Compute derived expense fields from purchase price
      const derived = computeDerivedFields(data.data);

      // Merge: base defaults → type defaults → extracted data → computed expenses
      const currentValues = form.getValues();
      form.reset({
        ...{ propertyType: 'single_family', title: '', ...DEFAULT_VALUES },
        ...typeDefaults,
        ...data.data,
        ...derived,
        // Preserve rent if the user already set it before importing
        ...(currentValues.monthlyRent > 0 ? { monthlyRent: currentValues.monthlyRent } : {}),
      } as any);

      setResult(data);
      setStatus('success');
    } catch {
      setStatus('error');
      setErrorMessage('Network error. Please check your connection and try again.');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleImport();
    }
  };

  const handleDismiss = () => {
    setStatus('idle');
    setResult(null);
    setErrorMessage('');
  };

  return (
    <div className="mb-6">
      <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-5">
        <div className="flex items-start gap-3 mb-3">
          <Link className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100">
              Import from Zillow or Redfin
            </h3>
            <p className="text-xs text-blue-700 dark:text-blue-300 mt-0.5">
              Paste a listing URL to auto-fill property details
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="https://www.zillow.com/homedetails/..."
            disabled={status === 'loading'}
            className="flex-1 px-3 py-2 text-sm rounded-md border border-blue-300 dark:border-blue-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          />
          <button
            type="button"
            onClick={handleImport}
            disabled={status === 'loading' || !url.trim()}
            className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {status === 'loading' ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Importing...
              </>
            ) : (
              'Import'
            )}
          </button>
        </div>

        {/* Success feedback */}
        {status === 'success' && result && (
          <div className="mt-3 flex items-start gap-2 text-sm">
            <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-green-800 dark:text-green-200 font-medium">
                Imported {result.extractedFields.length} field{result.extractedFields.length !== 1 ? 's' : ''} from {result.source === 'zillow' ? 'Zillow' : 'Redfin'}
              </p>
              <p className="text-blue-700 dark:text-blue-300 text-xs mt-1">
                Expenses (insurance, taxes, maintenance, closing costs) were auto-estimated from the purchase price. You still need to enter monthly rent.
              </p>
            </div>
            <button type="button" onClick={handleDismiss} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Error feedback */}
        {status === 'error' && (
          <div className="mt-3 flex items-start gap-2 text-sm">
            <AlertCircle className="w-4 h-4 text-red-500 dark:text-red-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-red-700 dark:text-red-300">{errorMessage}</p>
              <p className="text-gray-600 dark:text-gray-400 text-xs mt-1">
                You can still enter all property details manually below.
              </p>
            </div>
            <button type="button" onClick={handleDismiss} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
