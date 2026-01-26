'use client';

/**
 * Calculator Wizard - Main Page Component
 */

import React from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { DEFAULT_VALUES } from '@repo/calculations';
import { calculatorSchema, getStepFields, type CalculatorFormData } from '@/lib/validation/calculator-schema';
import { Step1PropertyDetails } from '@/components/calculator/step1-property-details';
import { Step2PurchaseFinancing } from '@/components/calculator/step2-purchase-financing';
import { Step3Income } from '@/components/calculator/step3-income';
import { Step4Expenses } from '@/components/calculator/step4-expenses';
import { Step5Results } from '@/components/calculator/step5-results';
import { ProgressPreview } from '@/components/calculator/progress-preview';
import { ThemeToggle } from '@/components/theme-toggle';

type Step = 1 | 2 | 3 | 4 | 5;

const STEP_TITLES = {
  1: 'Property Details',
  2: 'Purchase & Financing',
  3: 'Income',
  4: 'Expenses',
  5: 'Results',
};

export default function CalculatorPage() {
  const [currentStep, setCurrentStep] = React.useState<Step>(1);
  const [isSaving, setIsSaving] = React.useState(false);

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

  // Load draft from localStorage on mount
  React.useEffect(() => {
    const draftStr = localStorage.getItem('calculator_draft');
    if (draftStr) {
      try {
        const draft = JSON.parse(draftStr);
        form.reset(draft);
      } catch (error) {
        console.error('Failed to load draft:', error);
      }
    }
  }, [form]);

  // Debounced auto-save to localStorage
  React.useEffect(() => {
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
  }, [form]);

  const handleNext = async () => {
    // Validate current step fields
    const stepFields = getStepFields(currentStep);
    const isValid = await form.trigger(stepFields as any);

    if (!isValid) {
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
      // For now, just save to localStorage
      // In future phases, this will save to database if authenticated
      const values = form.getValues();
      localStorage.setItem('calculator_draft', JSON.stringify(values));
      alert('Calculation saved locally!');
    } catch (error) {
      console.error('Failed to save:', error);
      alert('Failed to save calculation');
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
      alert('Please fill in all required fields before viewing results.');
    }
  };

  // Check if all required fields are filled
  const canViewResults = React.useMemo(() => {
    const values = form.watch();
    // Check required fields from steps 1-4
    return !!(
      values.title &&
      values.propertyType &&
      values.purchasePrice &&
      values.downPaymentPercent !== undefined &&
      values.interestRate &&
      values.loanTermYears &&
      values.monthlyRent &&
      values.vacancyRate !== undefined &&
      values.propertyTaxAnnual !== undefined &&
      values.insuranceAnnual !== undefined &&
      values.holdingLength
    );
  }, [form.watch()]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Calculator
            </h1>
            <div className="flex items-center gap-3">
              {currentStep < 5 && canViewResults && (
                <button
                  onClick={handleViewResults}
                  className="px-4 py-2 text-sm font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  View Results
                </button>
              )}
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : 'Save Draft'}
              </button>
              <ThemeToggle />
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
