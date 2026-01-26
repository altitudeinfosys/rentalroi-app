'use client';

/**
 * Step 2: Purchase & Financing Component
 */

import React from 'react';
import { useFormContext } from 'react-hook-form';
import { InputField } from './input-field';
import { calculateMonthlyPayment } from '@repo/calculations';
import { getValidationWarnings } from '@/lib/validation/calculator-schema';

export function Step2PurchaseFinancing() {
  const { watch } = useFormContext();

  // Watch values for preview calculation
  const purchasePrice = watch('purchasePrice');
  const downPaymentPercent = watch('downPaymentPercent');
  const interestRate = watch('interestRate');
  const loanTermYears = watch('loanTermYears');
  const closingCosts = watch('closingCosts');
  const repairCosts = watch('repairCosts');

  // Get validation warnings
  const warnings = getValidationWarnings({
    purchasePrice,
    downPaymentPercent,
    interestRate,
  });

  // Calculate preview values
  const downPaymentAmount =
    purchasePrice && downPaymentPercent
      ? (purchasePrice * downPaymentPercent) / 100
      : 0;
  const loanAmount = purchasePrice ? purchasePrice - downPaymentAmount : 0;
  const monthlyPayment =
    loanAmount && interestRate && loanTermYears
      ? calculateMonthlyPayment(loanAmount, interestRate, loanTermYears)
      : 0;
  const totalInvestment =
    downPaymentAmount + (closingCosts || 0) + (repairCosts || 0);

  const showPreview =
    purchasePrice > 0 && downPaymentPercent >= 0 && interestRate > 0 && loanTermYears > 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Purchase & Financing
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Enter the property purchase details and financing terms
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Purchase Details
          </h3>

          <InputField
            name="purchasePrice"
            label="Purchase Price"
            type="currency"
            required
            placeholder="500000"
            helpText="Total purchase price of the property"
            min={1000}
          />

          <InputField
            name="closingCosts"
            label="Closing Costs"
            type="currency"
            placeholder="10000"
            helpText="Estimated closing costs (typically 2-5% of purchase price)"
            min={0}
          />

          <InputField
            name="repairCosts"
            label="Repair/Renovation Costs"
            type="currency"
            placeholder="0"
            helpText="Upfront repair or renovation costs"
            min={0}
          />
        </div>

        <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Financing
          </h3>

          <InputField
            name="downPaymentPercent"
            label="Down Payment"
            type="percentage"
            required
            placeholder="20"
            helpText="Down payment as a percentage of purchase price"
            min={0}
            max={100}
            warning={warnings.downPaymentPercent}
          />

          <InputField
            name="interestRate"
            label="Interest Rate"
            type="percentage"
            required
            placeholder="6.5"
            helpText="Annual interest rate for the mortgage"
            min={0.1}
            max={20}
            step={0.1}
            warning={warnings.interestRate}
          />

          <InputField
            name="loanTermYears"
            label="Loan Term"
            type="number"
            required
            placeholder="30"
            helpText="Length of the mortgage in years"
            min={1}
            max={50}
          />
        </div>

        {showPreview && (
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Mortgage Preview
            </h3>
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Loan Amount
                  </p>
                  <p className="text-xl font-semibold text-gray-900 dark:text-white">
                    ${loanAmount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Down Payment
                  </p>
                  <p className="text-xl font-semibold text-gray-900 dark:text-white">
                    ${downPaymentAmount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Monthly Payment (P&I)
                  </p>
                  <p className="text-xl font-semibold text-blue-600 dark:text-blue-400">
                    ${monthlyPayment.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Total Investment
                  </p>
                  <p className="text-xl font-semibold text-gray-900 dark:text-white">
                    ${totalInvestment.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
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
