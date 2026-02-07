'use client';

/**
 * Step 4: Expenses Component
 */

import React from 'react';
import { useFormContext } from 'react-hook-form';
import { InputField } from './input-field';
import { ExpenseToggleField } from './expense-toggle-field';
import { calculateMonthlyPayment, calculateCashFlow } from '@repo/calculations';
import { getValidationWarnings } from '@/lib/validation/calculator-schema';

export function Step4Expenses() {
  const { watch } = useFormContext();

  // Watch all necessary values for preview calculation
  const purchasePrice = watch('purchasePrice');
  const downPaymentPercent = watch('downPaymentPercent');
  const interestRate = watch('interestRate');
  const loanTermYears = watch('loanTermYears');
  const monthlyRent = watch('monthlyRent');
  const otherMonthlyIncome = watch('otherMonthlyIncome');
  const vacancyRate = watch('vacancyRate');
  const propertyTaxAnnual = watch('propertyTaxAnnual');
  const insuranceAnnual = watch('insuranceAnnual');
  const hoaMonthly = watch('hoaMonthly');
  const maintenanceMonthly = watch('maintenanceMonthly');
  const propertyManagementPercent = watch('propertyManagementPercent');
  const propertyManagementMonthly = watch('propertyManagementMonthly');
  const propertyManagementMode = watch('propertyManagementMode');
  const utilitiesMonthly = watch('utilitiesMonthly');
  const otherExpensesMonthly = watch('otherExpensesMonthly');
  const closingCosts = watch('closingCosts');
  const repairCosts = watch('repairCosts');

  // Get validation warnings
  const warnings = getValidationWarnings({
    propertyManagementPercent,
  });

  // Calculate monthly mortgage payment
  const downPaymentAmount = purchasePrice && downPaymentPercent
    ? (purchasePrice * downPaymentPercent) / 100
    : 0;
  const loanAmount = purchasePrice ? purchasePrice - downPaymentAmount : 0;
  const mortgagePayment =
    loanAmount && interestRate && loanTermYears
      ? calculateMonthlyPayment(loanAmount, interestRate, loanTermYears)
      : 0;

  // Calculate monthly expenses
  const propertyTaxMonthly = (propertyTaxAnnual || 0) / 12;
  const insuranceMonthly = (insuranceAnnual || 0) / 12;
  const grossMonthlyIncome = (monthlyRent || 0) + (otherMonthlyIncome || 0);

  // Management fee: use dollar value if in dollar mode, otherwise calculate from percent
  const managementFee = propertyManagementMode === 'dollar'
    ? (propertyManagementMonthly || 0)
    : propertyManagementPercent
      ? (grossMonthlyIncome * propertyManagementPercent) / 100
      : 0;

  const monthlyExpenses =
    propertyTaxMonthly +
    insuranceMonthly +
    (hoaMonthly || 0) +
    (maintenanceMonthly || 0) +
    managementFee +
    (utilitiesMonthly || 0) +
    (otherExpensesMonthly || 0);

  // Calculate cash flow
  const grossRent = monthlyRent || 0;
  const vacancyLoss = vacancyRate && grossRent ? (grossRent * vacancyRate) / 100 : 0;
  const netIncome = grossRent - vacancyLoss + (otherMonthlyIncome || 0);
  const monthlyCashFlow = netIncome - monthlyExpenses - mortgagePayment;
  const annualCashFlow = monthlyCashFlow * 12;

  // Calculate Cash-on-Cash return
  const totalInvestment = downPaymentAmount + (closingCosts || 0) + (repairCosts || 0);
  const cocReturn = totalInvestment > 0 ? (annualCashFlow / totalInvestment) * 100 : 0;

  const showPreview =
    propertyTaxAnnual >= 0 && insuranceAnnual >= 0 && monthlyRent > 0;

  const cashFlowColor = monthlyCashFlow >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Expenses
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Enter all operating expenses and multi-year assumptions
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Annual Expenses
          </h3>

          <ExpenseToggleField
            dollarFieldName="propertyTaxAnnual"
            percentFieldName="propertyTaxPercent"
            modeFieldName="propertyTaxMode"
            label="Property Tax (Annual)"
            required
            percentBaseValue={purchasePrice || 0}
            percentBaseLabel="of purchase price"
            dollarPlaceholder="4800"
            percentPlaceholder="1.2"
            dollarHelpText="Annual property tax amount"
            percentHelpText="Typically 0.5% - 2.5% of property value"
            isDollarAnnual={true}
            maxPercent={10}
          />

          <ExpenseToggleField
            dollarFieldName="insuranceAnnual"
            percentFieldName="insurancePercent"
            modeFieldName="insuranceMode"
            label="Insurance (Annual)"
            required
            percentBaseValue={purchasePrice || 0}
            percentBaseLabel="of purchase price"
            dollarPlaceholder="1200"
            percentPlaceholder="0.5"
            dollarHelpText="Annual property insurance premium"
            percentHelpText="Typically 0.3% - 0.6% of property value"
            isDollarAnnual={true}
            maxPercent={5}
          />
        </div>

        <div className="pt-6 border-t border-gray-200 dark:border-gray-700 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Monthly Expenses
          </h3>

          <InputField
            name="hoaMonthly"
            label="HOA Fees"
            type="currency"
            placeholder="0"
            helpText="Monthly HOA or condo fees"
            min={0}
          />

          <ExpenseToggleField
            dollarFieldName="maintenanceMonthly"
            percentFieldName="maintenancePercent"
            modeFieldName="maintenanceMode"
            label="Maintenance & Repairs"
            percentBaseValue={purchasePrice || 0}
            percentBaseLabel="of value/year"
            dollarPlaceholder="250"
            percentPlaceholder="1"
            dollarHelpText="Expected monthly maintenance costs"
            percentHelpText="Rule of thumb: 1% of property value per year"
            isDollarAnnual={false}
            maxPercent={5}
          />

          <ExpenseToggleField
            dollarFieldName="propertyManagementMonthly"
            percentFieldName="propertyManagementPercent"
            modeFieldName="propertyManagementMode"
            label="Property Management Fee"
            percentBaseValue={grossMonthlyIncome || 0}
            percentBaseLabel="of rent"
            dollarPlaceholder="0"
            percentPlaceholder="8"
            dollarHelpText="Fixed monthly management fee"
            percentHelpText="Typically 8-10% of gross rent"
            isDollarAnnual={false}
            maxPercent={50}
          />

          <InputField
            name="utilitiesMonthly"
            label="Utilities"
            type="currency"
            placeholder="0"
            helpText="Utilities paid by landlord (if any)"
            min={0}
          />

          <InputField
            name="otherExpensesMonthly"
            label="Other Expenses"
            type="currency"
            placeholder="0"
            helpText="Any other monthly expenses"
            min={0}
          />
        </div>

        <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Multi-Year Assumptions
          </h3>

          <InputField
            name="holdingLength"
            label="Holding Period"
            type="number"
            placeholder="5"
            helpText="How many years do you plan to hold this property?"
            min={1}
            max={50}
          />

          <InputField
            name="annualAppreciationRate"
            label="Annual Appreciation Rate"
            type="percentage"
            placeholder="3"
            helpText="Expected annual property value increase (3% is historical average)"
            min={-50}
            max={50}
          />

          <InputField
            name="annualExpenseIncrease"
            label="Annual Expense Increase"
            type="percentage"
            placeholder="2.5"
            helpText="Expected annual increase in expenses (typically 2-3%)"
            min={0}
            max={50}
          />

          <InputField
            name="saleClosingCostsPercent"
            label="Sale Closing Costs"
            type="percentage"
            placeholder="6"
            helpText="Costs to sell the property (realtor fees, closing costs)"
            min={0}
            max={20}
          />
        </div>

        {showPreview && (
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Cash Flow Preview
            </h3>
            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Monthly Expenses
                  </p>
                  <p className="text-xl font-semibold text-gray-900 dark:text-white">
                    ${monthlyExpenses.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Monthly Cash Flow
                  </p>
                  <p className={`text-xl font-semibold ${cashFlowColor}`}>
                    ${monthlyCashFlow.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Annual Cash Flow
                  </p>
                  <p className={`text-xl font-semibold ${cashFlowColor}`}>
                    ${annualCashFlow.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    CoC Return
                  </p>
                  <p className={`text-xl font-semibold ${cashFlowColor}`}>
                    {cocReturn.toFixed(1)}%
                  </p>
                </div>
              </div>
              {monthlyCashFlow < 0 && (
                <div className="mt-4 p-3 bg-red-100 dark:bg-red-900/30 rounded-md">
                  <p className="text-sm text-red-800 dark:text-red-200 flex items-center gap-2">
                    <span>⚠️</span>
                    <span>Property has negative cash flow</span>
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
