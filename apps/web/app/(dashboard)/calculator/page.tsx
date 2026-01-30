'use client';

/**
 * Calculator Wizard - Main Page Component
 * Supports both new calculations and editing existing ones via ?id= query param
 */

import React, { Suspense } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { useSearchParams } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { DEFAULT_VALUES } from '@repo/calculations';
import { calculatorSchema, getStepFields, type CalculatorFormData } from '@/lib/validation/calculator-schema';
import { Step1PropertyDetails } from '@/components/calculator/step1-property-details';
import { Step2PurchaseFinancing } from '@/components/calculator/step2-purchase-financing';
import { Step3Income } from '@/components/calculator/step3-income';
import { Step4Expenses } from '@/components/calculator/step4-expenses';
import { Step5Results } from '@/components/calculator/step5-results';
import { ProgressPreview } from '@/components/calculator/progress-preview';
import { ToastContainer } from '@/components/ui/toast';
import { useToast } from '@/lib/hooks/use-toast';
import { createClient } from '@/lib/supabase/client';
import { getCalculation } from '@/lib/supabase/calculations';
import {
  calculateMonthlyPayment,
  calculateCashFlow,
  calculateCashOnCashReturn,
  calculateCapRate,
  calculateTotalReturn,
} from '@repo/calculations';
import type { ComputedResults } from '@/lib/mappers/calculation-mapper';

type Step = 1 | 2 | 3 | 4 | 5;

const STEP_TITLES = {
  1: 'Property Details',
  2: 'Purchase & Financing',
  3: 'Income',
  4: 'Expenses',
  5: 'Results',
};

function CalculatorContent() {
  const searchParams = useSearchParams();
  const editId = searchParams.get('id');
  const isNew = searchParams.get('new') === 'true';

  const [currentStep, setCurrentStep] = React.useState<Step>(1);
  const [isSaving, setIsSaving] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(!!editId);
  const [editTitle, setEditTitle] = React.useState<string | null>(null);
  const { toasts, removeToast, success, error: showError, warning } = useToast();

  // Initialize form with default values
  const form = useForm<CalculatorFormData>({
    resolver: zodResolver(calculatorSchema),
    defaultValues: {
      propertyType: 'single_family',
      title: '',
      ...DEFAULT_VALUES,
    } as any,
    mode: 'onBlur',
  });

  // Load existing calculation if editing
  React.useEffect(() => {
    if (!editId) {
      // If starting a new calculation, clear the draft
      if (isNew) {
        localStorage.removeItem('calculator_draft');
        // Update URL to remove the ?new=true param
        window.history.replaceState({}, '', '/calculator');
        return;
      }

      // Not editing and not new - try to load from localStorage
      const draftStr = localStorage.getItem('calculator_draft');
      if (draftStr) {
        try {
          const draft = JSON.parse(draftStr);
          form.reset(draft);
        } catch (error) {
          console.error('Failed to load draft:', error);
        }
      }
      return;
    }

    // Load calculation from database
    const loadCalculation = async () => {
      setIsLoading(true);
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          console.error('Not authenticated');
          setIsLoading(false);
          return;
        }

        const result = await getCalculation(editId, user.id);

        if ('error' in result || !result.formData) {
          console.error('Failed to load calculation:', result.error);
          setIsLoading(false);
          return;
        }

        // Pre-fill form with saved values
        form.reset(result.formData);
        setEditTitle(result.formData.title);
      } catch (error) {
        console.error('Failed to load calculation:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadCalculation();
  }, [editId, isNew, form]);

  // Debounced auto-save to localStorage (only for new calculations)
  React.useEffect(() => {
    // Don't auto-save to localStorage if editing existing calculation
    if (editId) return;

    const subscription = form.watch((values) => {
      const timeoutId = setTimeout(() => {
        try {
          localStorage.setItem('calculator_draft', JSON.stringify(values));
        } catch (error) {
          console.error('Failed to save draft:', error);
        }
      }, 1000); // 1 second debounce

      return () => clearTimeout(timeoutId);
    });

    return () => subscription.unsubscribe();
  }, [form, editId]);

  const handleNext = async () => {
    // Validate current step fields
    const stepFields = getStepFields(currentStep);
    const isValid = await form.trigger(stepFields as any);

    if (!isValid) {
      // Show which fields have errors
      const errors = form.formState.errors;
      const errorFields = stepFields.filter(field => errors[field]);
      if (errorFields.length > 0) {
        const errorMessages = errorFields.map(f => `${f}: ${errors[f]?.message}`);
        console.log('Validation errors:', errorMessages);
        showError('Validation Error', errorMessages.join(', '));
      } else {
        // No specific field errors found, but validation still failed
        console.log('Validation failed but no specific errors found');
        console.log('Form values:', form.getValues());
        warning('Missing Fields', 'Please ensure all required fields are filled in.');
      }
      return;
    }

    // Move to next step
    if (currentStep < 5) {
      setCurrentStep((currentStep + 1) as Step);
      // Scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((currentStep - 1) as Step);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const values = form.getValues();

      // First check if user is logged in
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        // Not logged in - save to localStorage and redirect to login
        localStorage.setItem('calculator_draft', JSON.stringify(values));
        const returnUrl = encodeURIComponent('/calculator');
        window.location.href = `/login?redirect=${returnUrl}`;
        return;
      }

      // Compute results for saving to database
      const loanAmount = values.purchasePrice * (1 - values.downPaymentPercent / 100);
      const monthlyPayment = calculateMonthlyPayment(
        loanAmount,
        values.interestRate,
        values.loanTermYears
      );

      // Property management: use dollar value if in dollar mode
      const propertyManagementFee = (values as any).propertyManagementMode === 'dollar'
        ? ((values as any).propertyManagementMonthly || 0)
        : (values.monthlyRent * values.propertyManagementPercent / 100);

      // Operating expenses (monthly)
      const monthlyOperatingExpenses =
        values.propertyTaxAnnual / 12 +
        values.insuranceAnnual / 12 +
        values.hoaMonthly +
        values.maintenanceMonthly +
        propertyManagementFee +
        values.utilitiesMonthly +
        values.otherExpensesMonthly;

      // Cash flow
      const cashFlow = calculateCashFlow(
        values.monthlyRent,
        values.vacancyRate,
        monthlyOperatingExpenses,
        monthlyPayment
      );

      // Investment amounts
      const downPayment = values.purchasePrice * (values.downPaymentPercent / 100);
      const totalInvestment = downPayment + values.closingCosts + values.repairCosts;

      // Calculate metrics
      const annualCashFlow = cashFlow.cashFlow * 12;
      const annualNOI = cashFlow.noi * 12;

      const computedResults: ComputedResults = {
        totalInvestment,
        monthlyMortgagePayment: monthlyPayment,
        monthlyGrossIncome: cashFlow.grossIncome,
        monthlyExpenses: monthlyOperatingExpenses,
        monthlyCashFlow: cashFlow.cashFlow,
        annualCashFlow,
        cashOnCashReturn: calculateCashOnCashReturn(annualCashFlow, totalInvestment),
        capRate: calculateCapRate(annualNOI, values.purchasePrice),
      };

      // Use API route to save (handles user creation server-side)
      const response = await fetch('/api/calculations/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          formData: values,
          results: computedResults,
          calculationId: editId || undefined,
        }),
      });

      const result = await response.json();

      if (!response.ok || result.error) {
        showError('Save Failed', result.error || 'Unknown error');
        return;
      }

      // Clear localStorage draft on success
      localStorage.removeItem('calculator_draft');

      // Show success message and redirect to calculations list
      success('Saved!', 'Calculation saved successfully. Redirecting...');
      setTimeout(() => {
        window.location.href = '/calculations';
      }, 1500);
    } catch (error) {
      console.error('Failed to save:', error);
      showError('Save Failed', 'Failed to save calculation. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleViewResults = async () => {
    // Validate all steps before jumping to results
    const allFields = [
      ...getStepFields(1),
      ...getStepFields(2),
      ...getStepFields(3),
      ...getStepFields(4),
    ];
    const isValid = await form.trigger(allFields as any);

    if (isValid) {
      setCurrentStep(5);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      warning('Incomplete Form', 'Please fill in all required fields before viewing results.');
    }
  };

  const handleStartNew = () => {
    // Clear the form and start fresh
    form.reset({
      propertyType: 'single_family',
      title: '',
      ...DEFAULT_VALUES,
    } as any);
    setEditTitle(null);
    setCurrentStep(1);
    // Update URL to remove id param
    window.history.replaceState({}, '', '/calculator');
  };

  // Check if minimum required fields are filled for saving
  const canSave = React.useMemo(() => {
    const values = form.watch();
    // Minimum required: title, property type, purchase price, and monthly rent
    return !!(
      values.title &&
      values.propertyType &&
      values.purchasePrice > 0 &&
      values.monthlyRent > 0
    );
  }, [form.watch()]);

  // Check if all required fields are filled for viewing results
  const canViewResults = React.useMemo(() => {
    const values = form.watch();
    // Check required fields from steps 1-4
    return !!(
      values.title &&
      values.propertyType &&
      values.purchasePrice > 0 &&
      values.downPaymentPercent !== undefined &&
      values.interestRate &&
      values.loanTermYears &&
      values.monthlyRent > 0 &&
      values.vacancyRate !== undefined &&
      values.propertyTaxAnnual !== undefined &&
      values.insuranceAnnual !== undefined &&
      values.holdingLength
    );
  }, [form.watch()]);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading calculation...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                {editId ? 'Edit Calculation' : 'Calculator'}
              </h1>
              {editTitle && (
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  Editing: {editTitle}
                </p>
              )}
            </div>
            <div className="flex items-center gap-3">
              {editId && (
                <button
                  onClick={handleStartNew}
                  className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  Start New
                </button>
              )}
              {currentStep < 5 && canViewResults && (
                <button
                  onClick={handleViewResults}
                  className="px-4 py-2 text-sm font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  View Results
                </button>
              )}
              {!editId && (
                <button
                  onClick={handleSave}
                  disabled={isSaving || !canSave}
                  title={!canSave ? 'Fill in title, property type, purchase price, and monthly rent to save' : ''}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${
                    canSave
                      ? 'text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300'
                      : 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
                  } disabled:opacity-50`}
                >
                  {isSaving ? 'Saving...' : 'Save'}
                </button>
              )}
            </div>
          </div>

          {/* Step Progress Bar */}
          <div className="relative">
            <div className="flex items-center justify-between mb-2">
              {[1, 2, 3, 4, 5].map((step) => (
                <div
                  key={step}
                  className="flex flex-col items-center"
                  style={{ width: '20%' }}
                >
                  <div
                    className={`
                      w-10 h-10 rounded-full flex items-center justify-center
                      font-semibold text-sm mb-2 transition-colors
                      ${
                        step === currentStep
                          ? 'bg-blue-600 text-white'
                          : step < currentStep
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-300 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                      }
                    `}
                  >
                    {step < currentStep ? '✓' : step}
                  </div>
                  <span
                    className={`
                      text-xs text-center hidden sm:block
                      ${
                        step === currentStep
                          ? 'text-blue-600 dark:text-blue-400 font-semibold'
                          : 'text-gray-600 dark:text-gray-400'
                      }
                    `}
                  >
                    {STEP_TITLES[step as Step]}
                  </span>
                </div>
              ))}
            </div>
            {/* Progress Line */}
            <div className="absolute top-5 left-0 right-0 h-1 bg-gray-300 dark:bg-gray-700 -z-10">
              <div
                className="h-full bg-blue-600 transition-all duration-300"
                style={{ width: `${((currentStep - 1) / 4) * 100}%` }}
              />
            </div>
          </div>

          <p className="text-sm text-gray-600 dark:text-gray-400 text-center mt-4">
            Step {currentStep} of 5: {STEP_TITLES[currentStep]}
          </p>
        </div>

        {/* Form */}
        <FormProvider {...form}>
          {/* Progress Preview (shown after step 2) */}
          {currentStep > 2 && <ProgressPreview currentStep={currentStep} />}

          <form onSubmit={(e) => e.preventDefault()}>
            {/* Step Content */}
            <div className="mb-8">
              {currentStep === 1 && <Step1PropertyDetails />}
              {currentStep === 2 && <Step2PurchaseFinancing />}
              {currentStep === 3 && <Step3Income />}
              {currentStep === 4 && <Step4Expenses />}
              {currentStep === 5 && <Step5Results />}
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
              <button
                type="button"
                onClick={handleBack}
                disabled={currentStep === 1}
                className="px-6 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                ← Back
              </button>

              <div className="flex gap-3">
                {currentStep === 5 && (
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="px-6 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    Edit Inputs
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleNext}
                  disabled={currentStep === 5}
                  className="px-6 py-3 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {currentStep === 5 ? 'Complete' : 'Next →'}
                </button>
              </div>
            </div>
          </form>
        </FormProvider>

        {/* Debug Info (development only) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-8 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <details>
              <summary className="cursor-pointer text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Debug: Form Values
              </summary>
              <pre className="text-xs text-gray-600 dark:text-gray-400 overflow-auto">
                {JSON.stringify(form.watch(), null, 2)}
              </pre>
            </details>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CalculatorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading calculator...</p>
        </div>
      </div>
    }>
      <CalculatorContent />
    </Suspense>
  );
}
