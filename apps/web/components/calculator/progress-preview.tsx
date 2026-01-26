'use client';

/**
 * ProgressPreview Component
 * Shows partial calculations after steps 2, 3, and 4
 */

import React from 'react';
import { useFormContext } from 'react-hook-form';
import { calculateMonthlyPayment } from '@repo/calculations';

interface ProgressPreviewProps {
  currentStep: number;
}

export function ProgressPreview({ currentStep }: ProgressPreviewProps) {
  const { watch } = useFormContext();
  const [isCollapsed, setIsCollapsed] = React.useState(true);

  // Watch all necessary values
  const purchasePrice = watch('purchasePrice');
  const downPaymentPercent = watch('downPaymentPercent');
  const interestRate = watch('interestRate');
  const loanTermYears = watch('loanTermYears');
  const closingCosts = watch('closingCosts');
  const repairCosts = watch('repairCosts');
  const monthlyRent = watch('monthlyRent');
  const otherMonthlyIncome = watch('otherMonthlyIncome');
  const vacancyRate = watch('vacancyRate');
  const propertyTaxAnnual = watch('propertyTaxAnnual');
  const insuranceAnnual = watch('insuranceAnnual');
  const hoaMonthly = watch('hoaMonthly');
  const maintenanceMonthly = watch('maintenanceMonthly');
  const propertyManagementPercent = watch('propertyManagementPercent');
  const utilitiesMonthly = watch('utilitiesMonthly');
  const otherExpensesMonthly = watch('otherExpensesMonthly');

  // Don't show preview if we're on step 1 or 2 (preview shown in step components)
  if (currentStep <= 2) {
    return null;
  }

  // Calculate mortgage details
  const downPaymentAmount = purchasePrice && downPaymentPercent
    ? (purchasePrice * downPaymentPercent) / 100
    : 0;
  const loanAmount = purchasePrice ? purchasePrice - downPaymentAmount : 0;
  const mortgagePayment =
    loanAmount && interestRate && loanTermYears
      ? calculateMonthlyPayment(loanAmount, interestRate, loanTermYears)
      : 0;
  const totalInvestment = downPaymentAmount + (closingCosts || 0) + (repairCosts || 0);

  // Calculate income details
  const grossMonthlyIncome = (monthlyRent || 0) + (otherMonthlyIncome || 0);
  const vacancyLoss = vacancyRate && grossMonthlyIncome
    ? (grossMonthlyIncome * vacancyRate) / 100
    : 0;
  const netMonthlyIncome = grossMonthlyIncome - vacancyLoss;
  const annualIncome = netMonthlyIncome * 12;

  // Calculate expenses (if on step 4+)
  let monthlyExpenses = 0;
  let monthlyCashFlow = 0;
  let annualCashFlow = 0;
  let cocReturn = 0;

  if (currentStep >= 4) {
    const propertyTaxMonthly = (propertyTaxAnnual || 0) / 12;
    const insuranceMonthly = (insuranceAnnual || 0) / 12;
    const managementFee = propertyManagementPercent
      ? (grossMonthlyIncome * propertyManagementPercent) / 100
      : 0;

    monthlyExpenses =
      propertyTaxMonthly +
      insuranceMonthly +
      (hoaMonthly || 0) +
      (maintenanceMonthly || 0) +
      managementFee +
      (utilitiesMonthly || 0) +
      (otherExpensesMonthly || 0);

    monthlyCashFlow = netMonthlyIncome - monthlyExpenses - mortgagePayment;
    annualCashFlow = monthlyCashFlow * 12;
    cocReturn = totalInvestment > 0 ? (annualCashFlow / totalInvestment) * 100 : 0;
  }

  const cashFlowColor = monthlyCashFlow >= 0
    ? 'text-green-600 dark:text-green-400'
    : 'text-red-600 dark:text-red-400';

  return (
    <div className="sticky top-4 mb-6">
      <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg shadow-lg overflow-hidden">
        {/* Header */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-white/50 dark:hover:bg-gray-800/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">📊</span>
            <div className="text-left">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Progress Summary
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {isCollapsed ? (
                  <>Click to expand and see your progress so far</>
                ) : (
                  <>
                    {currentStep === 3 && 'Income & financing overview'}
                    {currentStep === 4 && 'Complete cash flow analysis'}
                    {currentStep === 5 && 'Ready for full results'}
                  </>
                )}
              </p>
            </div>
          </div>
          <span className="text-gray-500 dark:text-gray-400">
            {isCollapsed ? '▼' : '▲'}
          </span>
        </button>

        {/* Content */}
        {!isCollapsed && (
          <div className="px-6 pb-6 space-y-4">
            {/* Step 2: Mortgage Info */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                Financing
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Monthly Payment</p>
                  <p className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                    ${mortgagePayment.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Total Investment</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    ${totalInvestment.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </p>
                </div>
              </div>
            </div>

            {/* Step 3: Income Info */}
            {currentStep >= 3 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  Income
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Monthly (After Vacancy)</p>
                    <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                      ${netMonthlyIncome.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Annual Income</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      ${annualIncome.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Cash Flow Info */}
            {currentStep >= 4 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  Cash Flow
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Monthly Cash Flow</p>
                    <p className={`text-lg font-semibold ${cashFlowColor}`}>
                      ${monthlyCashFlow.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">CoC Return</p>
                    <p className={`text-lg font-semibold ${cashFlowColor}`}>
                      {cocReturn.toFixed(1)}%
                    </p>
                  </div>
                </div>
                {monthlyCashFlow < 0 && (
                  <div className="mt-3 p-2 bg-red-100 dark:bg-red-900/30 rounded">
                    <p className="text-xs text-red-800 dark:text-red-200">
                      ⚠️ Negative cash flow
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Call to action */}
            {currentStep === 4 && (
              <div className="text-center pt-2">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Click Next to see complete results and projections →
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
