'use client';

/**
 * Step 3: Income Component
 */

import React from 'react';
import { useFormContext } from 'react-hook-form';
import { InputField } from './input-field';
import { getValidationWarnings } from '@/lib/validation/calculator-schema';

export function Step3Income() {
  const { watch } = useFormContext();

  // Watch values for preview calculation
  const monthlyRent = watch('monthlyRent');
  const otherMonthlyIncome = watch('otherMonthlyIncome');
  const vacancyRate = watch('vacancyRate');
  const annualRentIncrease = watch('annualRentIncrease');

  // Get validation warnings
  const warnings = getValidationWarnings({
    vacancyRate,
  });

  // Calculate preview values
  const grossMonthlyIncome = (monthlyRent || 0) + (otherMonthlyIncome || 0);
  const vacancyLoss =
    vacancyRate && grossMonthlyIncome
      ? (grossMonthlyIncome * vacancyRate) / 100
      : 0;
  const netMonthlyIncome = grossMonthlyIncome - vacancyLoss;
  const annualIncome = netMonthlyIncome * 12;

  const showPreview = monthlyRent > 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Income
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Enter the expected rental income and assumptions
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Monthly Income
          </h3>

          <InputField
            name="monthlyRent"
            label="Monthly Rent"
            type="currency"
            required
            placeholder="3500"
            helpText="Expected monthly rental income"
            min={1}
          />

          <InputField
            name="otherMonthlyIncome"
            label="Other Monthly Income"
            type="currency"
            placeholder="0"
            helpText="Other income sources (parking, laundry, etc.)"
            min={0}
          />
        </div>

        <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Assumptions
          </h3>

          <InputField
            name="vacancyRate"
            label="Vacancy Rate"
            type="percentage"
            placeholder="5"
            helpText="Estimated vacancy rate (5% is typical for residential)"
            min={0}
            max={100}
            warning={warnings.vacancyRate}
          />

          <InputField
            name="annualRentIncrease"
            label="Annual Rent Increase"
            type="percentage"
            placeholder="3"
            helpText="Expected annual rent increase rate (typically 2-4%)"
            min={0}
            max={50}
          />
        </div>

        {showPreview && (
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Income Preview
            </h3>
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Gross Monthly Rent
                  </p>
                  <p className="text-xl font-semibold text-gray-900 dark:text-white">
                    ${grossMonthlyIncome.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    After Vacancy ({vacancyRate || 0}%)
                  </p>
                  <p className="text-xl font-semibold text-green-600 dark:text-green-400">
                    ${netMonthlyIncome.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}/mo
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Annual Income
                  </p>
                  <p className="text-xl font-semibold text-gray-900 dark:text-white">
                    ${annualIncome.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
