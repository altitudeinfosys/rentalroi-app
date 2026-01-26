# RentalROI Calculator - Design Document

**Date:** January 26, 2026
**Phase:** Phase 2 - Core Calculator
**Status:** Approved for Implementation

---

## Table of Contents

1. [Overview](#overview)
2. [User Experience](#user-experience)
3. [Architecture](#architecture)
4. [Calculation Engine](#calculation-engine)
5. [State Management](#state-management)
6. [Results Display](#results-display)
7. [Authentication & Tiers](#authentication--tiers)
8. [Error Handling](#error-handling)
9. [Testing Strategy](#testing-strategy)
10. [Implementation Checklist](#implementation-checklist)

---

## Overview

### Goals

Build a comprehensive 5-step wizard calculator that:
- Guides users through rental property investment analysis
- Provides progressive feedback after each step
- Calculates accurate first-year and multi-year projections
- Displays all key investment metrics
- Auto-saves progress
- Enforces subscription tier limits

### Key Decisions

- **UI Pattern:** Multi-step wizard (5 steps) with progress indicator
- **Calculation Timing:** Progressive preview after steps 2-4, full results at step 5
- **Projection Scope:** Full multi-year projections from start (tier-gated display)
- **Metrics Depth:** Comprehensive analysis (all standard RE metrics)
- **Validation:** Smart defaults with permissive validation
- **State Persistence:** Auto-save after each step completion

---

## User Experience

### Step-by-Step Flow

```
┌─────────────────────────────────────────────────────────┐
│ Progress: ●─────○─────○─────○─────○  Step 1 of 5       │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Step 1: Property Details                              │
│  ─────────────────────────                             │
│  • Property Type                                        │
│  • Address (optional)                                   │
│  • Bedrooms, Bathrooms, Sq Ft (optional)               │
│                                                         │
│                        [Next: Purchase Details →]       │
└─────────────────────────────────────────────────────────┘
```

**Step 1: Property Details**
- Property type (single family, multi-family, condo, townhouse, commercial, other)
- Address, city, state (optional - for reference)
- Bedrooms, bathrooms, square feet (optional)
- Title/name for calculation

**Step 2: Purchase & Financing**
- Purchase price **(required)**
- Down payment percentage **(required)**
- Interest rate **(required)**
- Loan term years (default: 30)
- Closing costs (default: 0)
- Repair/renovation costs (default: 0)

**Preview after Step 2:**
```
┌─────────────────────────────────┐
│ 📊 Mortgage Preview             │
├─────────────────────────────────┤
│ Loan Amount: $400,000           │
│ Down Payment: $100,000          │
│ Monthly Payment: $2,398         │
│ Total Investment: $110,000      │
└─────────────────────────────────┘
```

**Step 3: Income**
- Monthly rent **(required)**
- Other monthly income (default: 0)
- Vacancy rate (default: 5%)
- Annual rent increase rate (default: 3%)

**Preview after Step 3:**
```
┌─────────────────────────────────┐
│ 💰 Income Preview               │
├─────────────────────────────────┤
│ Gross Rent: $3,500/mo           │
│ After Vacancy (5%): $3,325/mo   │
│ Annual Income: $39,900          │
└─────────────────────────────────┘
```

**Step 4: Expenses**
- Property tax (annual) **(required)**
- Insurance (annual) **(required)**
- HOA fees (monthly, default: 0)
- Maintenance (monthly, default: 0)
- Property management (%, default: 0)
- Utilities (monthly, default: 0)
- Other expenses (monthly, default: 0)
- Annual expense increase rate (default: 2.5%)

**Preview after Step 4:**
```
┌─────────────────────────────────┐
│ 📈 Cash Flow Preview            │
├─────────────────────────────────┤
│ Monthly Expenses: $950          │
│ Monthly Cash Flow: $977         │
│ Annual Cash Flow: $11,724       │
│ Cash-on-Cash Return: 10.7%      │
└─────────────────────────────────┘
```

**Step 5: Results**
- Full comprehensive analysis
- Interactive charts
- Multi-year projections
- All investment metrics
- Save calculation

### Multi-Year Assumptions (Step 4 or 5)

- Holding period (years, default: 5)
- Annual property appreciation (default: 3%)
- Sale closing costs (%, default: 6%)

---

## Architecture

### Component Hierarchy

```
<CalculatorWizard>
  ├── <ProgressIndicator step={currentStep} />
  ├── <StepContainer>
  │   ├── <Step1PropertyDetails />
  │   ├── <Step2PurchaseFinancing />
  │   ├── <Step3Income />
  │   ├── <Step4Expenses />
  │   └── <Step5Results />
  ├── <ProgressPreview /> (shown after steps 2-4)
  └── <WizardNavigation>
      ├── <BackButton />
      ├── <NextButton />
      └── <SaveButton />
```

### Shared Components

**InputField** (Reusable form input)
```tsx
<InputField
  name="purchasePrice"
  label="Purchase Price"
  type="currency"
  required
  helpText="Total purchase price of the property"
  validation={z.number().min(1000)}
/>
```

**Features:**
- Label with optional required indicator
- Input with type formatting (currency, percentage, number)
- Inline validation messages
- Help text tooltip
- Warning badges for unusual values

**ProgressPreview** (Mini calculation summary)
- Shown after completing steps 2, 3, 4
- Displays partial calculations
- Collapsible on mobile
- Encourages progression to next step

**ResultsChart** (Interactive visualizations)
- Line charts for multi-year trends
- Bar charts for monthly breakdown
- Responsive (vertical on mobile)
- Zoom and pan capabilities

**ResultsTable** (Year-by-year breakdown)
- Sortable columns
- Expandable rows for details
- Export to CSV functionality
- Responsive (cards on mobile)

**MetricsCard** (Individual metric display)
- Large value prominently displayed
- Label and explanation
- Color-coded (green=good, red=warning)
- Trend indicator (up/down arrow)

---

## Calculation Engine

### Module Structure

```
packages/calculations/src/
├── mortgage.ts          # Mortgage calculations
├── cash-flow.ts         # Cash flow and NOI
├── metrics.ts           # Investment metrics
├── projections.ts       # Multi-year projections
├── exit.ts              # Sale proceeds
├── defaults.ts          # Smart defaults
└── index.ts             # Public exports
```

### Key Formulas (Industry-Verified)

#### Mortgage Payment

```typescript
/**
 * Calculate monthly mortgage payment (P&I only)
 * Formula: M = P × [r × (1 + r)^n] / [(1 + r)^n - 1]
 * Source: Bankrate, Mortgage Calculator
 */
function calculateMonthlyPayment(
  principal: number,      // Loan amount
  annualRate: number,     // Annual interest rate (e.g., 6.5)
  years: number          // Loan term in years
): number
```

**Example:** $500,000 loan at 6% for 30 years = $2,997.75/month

#### Amortization Schedule

```typescript
/**
 * Generate year-by-year amortization breakdown
 * Each year: Interest = Balance × Rate, Principal = Payment - Interest
 */
function generateAmortizationSchedule(
  principal: number,
  annualRate: number,
  years: number
): AmortizationYear[]

interface AmortizationYear {
  year: number;
  beginningBalance: number;
  payment: number;
  principal: number;
  interest: number;
  endingBalance: number;
}
```

#### Net Operating Income (NOI)

```typescript
/**
 * NOI = Gross Income - Operating Expenses
 * Source: J.P. Morgan, Wall Street Prep
 *
 * EXCLUDES: Mortgage payments, depreciation, CapEx, taxes
 * INCLUDES: Property tax, insurance, utilities, maintenance, management
 */
function calculateNOI(
  grossIncome: number,
  operatingExpenses: number
): number
```

#### Cash Flow

```typescript
/**
 * Cash Flow = NOI - Debt Service
 * Or: Cash Flow = (Rent - Vacancy) - Operating Expenses - Mortgage
 */
function calculateCashFlow(
  grossRent: number,
  vacancyRate: number,
  operatingExpenses: number,
  mortgagePayment: number
): {
  grossIncome: number;
  vacancyLoss: number;
  netIncome: number;
  totalExpenses: number;
  noi: number;
  debtService: number;
  cashFlow: number;
}
```

#### Cash-on-Cash Return

```typescript
/**
 * CoC Return = Annual Pre-Tax Cash Flow / Total Cash Invested
 * Source: J.P. Morgan, Wall Street Prep
 * Typical Range: 8-12% is considered good
 * This is a LEVERED metric (accounts for financing)
 */
function calculateCashOnCashReturn(
  annualCashFlow: number,
  totalInvestment: number
): number
```

**Total Investment = Down Payment + Closing Costs + Repairs**

#### Cap Rate

```typescript
/**
 * Cap Rate = NOI / Property Value
 * Source: Wall Street Prep
 * Typical Ranges:
 *   - Class A: 4-6%
 *   - Class B: 6-8%
 *   - Class C: 8-12%
 * This is an UNLEVERED metric (ignores financing)
 */
function calculateCapRate(
  noi: number,
  propertyValue: number
): number
```

#### Internal Rate of Return (IRR)

```typescript
/**
 * IRR = Rate where NPV of all cash flows equals zero
 * Formula: 0 = CF₀ + CF₁/(1+IRR) + CF₂/(1+IRR)² + ... + CFₙ/(1+IRR)ⁿ
 * Source: Wall Street Prep
 *
 * Implementation: Use Newton-Raphson method or financial library
 * Target IRR: 15-20% for commercial RE
 */
function calculateIRR(cashFlows: number[]): number
```

#### Debt Service Coverage Ratio (DSCR)

```typescript
/**
 * DSCR = NOI / Annual Debt Service
 * Source: J.P. Morgan
 *
 * Interpretation:
 *   < 1.0 = Can't cover debt
 *   = 1.0 = Break-even
 *   > 1.25 = Typical lender minimum
 *   > 2.0 = Preferred by commercial lenders
 */
function calculateDSCR(
  noi: number,
  annualDebtService: number
): number
```

#### Equity Multiple

```typescript
/**
 * Equity Multiple = Total Distributions / Total Equity Invested
 * Source: Wall Street Prep
 *
 * Includes: All cash distributions + sale proceeds
 * Typical: 1.5x - 2.0x for 5-7 year hold
 * Limitation: Does NOT account for time value of money
 */
function calculateEquityMultiple(
  totalDistributions: number,
  totalInvestment: number
): number
```

#### Gross Rent Multiplier (GRM)

```typescript
/**
 * GRM = Property Price / Gross Annual Rent
 * Source: Wall Street Prep
 *
 * Typical: 6-10 is considered good
 * Use: Quick comparison tool only
 * Limitations: Ignores expenses, vacancy, financing
 */
function calculateGRM(
  propertyPrice: number,
  annualRent: number
): number
```

#### Multi-Year Projection

```typescript
/**
 * Project property performance year over year
 *
 * Each year:
 *   1. Apply rent increase: Rent × (1 + increase rate)
 *   2. Apply expense increase: Expenses × (1 + increase rate)
 *   3. Calculate cash flow for year
 *   4. Update loan balance (amortization)
 *   5. Apply appreciation: Value × (1 + appreciation rate)
 *   6. Calculate equity: Value - Loan Balance
 */
function calculateMultiYearProjection(
  inputs: CalculationInputs,
  years: number
): ProjectionYear[]

interface ProjectionYear {
  year: number;

  // Income
  grossIncome: number;
  vacancyLoss: number;
  netIncome: number;

  // Expenses
  propertyTax: number;
  insurance: number;
  maintenance: number;
  management: number;
  otherExpenses: number;
  totalExpenses: number;

  // Debt
  mortgagePayment: number;
  principalPaid: number;
  interestPaid: number;
  loanBalance: number;

  // Performance
  noi: number;
  cashFlow: number;
  cumulativeCashFlow: number;

  // Equity
  propertyValue: number;
  equity: number;

  // Metrics
  cashOnCashReturn: number;
  capRate: number;
  dscr: number;
}
```

#### Exit Calculation

```typescript
/**
 * Calculate net proceeds from property sale
 *
 * Net Proceeds = Sale Price - Selling Costs - Loan Payoff
 *
 * Typical Selling Costs:
 *   - Agent commission: 5-6%
 *   - Other closing costs: 2-5%
 *   - Total: ~6-8% of sale price
 */
function calculateSaleProceeds(
  salePrice: number,
  sellingCostPercent: number,
  remainingLoanBalance: number
): {
  salePrice: number;
  sellingCosts: number;
  loanPayoff: number;
  netProceeds: number;
  totalCashFlow: number;  // From holding period
  totalReturn: number;     // Cash flow + net proceeds
  totalInvestment: number;
  equityMultiple: number;
  irr: number;
}
```

### Smart Defaults

```typescript
// packages/calculations/src/defaults.ts

export const DEFAULT_VALUES = {
  // Financing
  downPaymentPercent: 20,
  interestRate: 6.5,
  loanTermYears: 30,

  // Income
  vacancyRate: 5,           // 5% typical for residential
  annualRentIncrease: 3,    // Tied to inflation

  // Expenses
  maintenancePercent: 1,     // 1% of property value annually
  propertyManagementPercent: 8,  // 8-10% of gross rent

  // Multi-year
  holdingLength: 5,
  annualAppreciationRate: 3, // Historical average
  annualExpenseIncreaseRate: 2.5,
  saleClosingCostsPercent: 6,
};

// Property-type specific defaults
export const PROPERTY_TYPE_DEFAULTS = {
  single_family: {
    vacancyRate: 5,
    maintenancePercent: 1,
  },
  multi_family: {
    vacancyRate: 7,
    maintenancePercent: 1.5,
  },
  commercial: {
    vacancyRate: 10,
    maintenancePercent: 2,
  },
};
```

### Validation Warnings

**Show warnings (not errors) for unusual values:**

```typescript
const VALIDATION_WARNINGS = {
  interestRate: {
    high: 10,  // Warn if > 10%
    message: "Interest rate above 10% is unusual for residential properties"
  },
  vacancyRate: {
    high: 15,  // Warn if > 15%
    message: "Vacancy rate above 15% is very high"
  },
  downPaymentPercent: {
    low: 10,  // Warn if < 10%
    message: "Down payment below 10% may require PMI and higher rates"
  },
  capRate: {
    low: 3,   // Warn if < 3%
    high: 15, // Warn if > 15%
    message: "Cap rate outside typical range (4-12%)"
  }
};
```

---

## State Management

### Form State

**Technology:** React Hook Form + Zod

```typescript
// Wizard state
const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4 | 5>(1);
const [calculationId, setCalculationId] = useState<string | null>(null);

// Form state (all steps combined)
const form = useForm<CalculationInputs>({
  resolver: zodResolver(calculationSchema),
  defaultValues: DEFAULT_VALUES,
  mode: 'onBlur',
});

// Watch for changes to trigger auto-save
useEffect(() => {
  const subscription = form.watch((values) => {
    // Debounced auto-save to localStorage
    debouncedSaveToLocalStorage(values);
  });
  return () => subscription.unsubscribe();
}, [form]);
```

### Persistence Strategy

**Three-tier storage:**

1. **Local State (React Hook Form)**
   - Current form values
   - Calculation results
   - UI state (step, expanded sections)

2. **LocalStorage (Unauthenticated)**
   - Draft calculation auto-saved on change
   - Persists across page reloads
   - Migrated to database on signup

3. **Supabase Database (Authenticated)**
   - Auto-save after each step completion
   - Calculation results stored
   - Accessible across devices

### Auto-Save Flow

```typescript
async function handleStepComplete(step: number) {
  // Validate current step
  const isValid = await form.trigger(getStepFields(step));
  if (!isValid) return;

  // Get form values
  const values = form.getValues();

  // Calculate progressive results
  let partialResults = null;
  if (step >= 2) {
    partialResults = calculatePartialResults(values, step);
  }

  // Save to database (if authenticated)
  if (user) {
    if (calculationId) {
      // Update existing
      await updateCalculation(calculationId, values);
    } else {
      // Create new
      const { data } = await createCalculation(values);
      setCalculationId(data.id);
    }
  } else {
    // Save to localStorage
    localStorage.setItem('draft_calculation', JSON.stringify(values));
  }

  // Show preview (steps 2-4)
  if (step < 5) {
    setPreview(partialResults);
  }

  // Move to next step
  setCurrentStep((step + 1) as any);
}
```

### Calculation Results Cache

**Don't persist calculation results to database initially** - calculate on demand:

```typescript
const [results, setResults] = useState<CalculationResults | null>(null);
const [loading, setLoading] = useState(false);

async function calculateResults(inputs: CalculationInputs) {
  setLoading(true);
  try {
    // Run calculations
    const firstYear = calculateFirstYear(inputs);
    const multiYear = calculateMultiYearProjection(inputs, inputs.holdingLength);
    const metrics = calculateAllMetrics(inputs, firstYear, multiYear);

    setResults({ firstYear, multiYear, metrics });
  } finally {
    setLoading(false);
  }
}
```

**Optionally cache results in database for faster loading:**
- Store calculated results JSON in `calculations.results` column
- Recalculate if inputs change
- Use for saved calculations list (show metrics without recalculating)

---

## Results Display

### Step 5 Layout

```
┌─────────────────────────────────────────────────────────┐
│  Key Metrics Dashboard                                  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │
│  │ $977/mo  │ │  10.7%   │ │   8.2%   │ │ $110,000 │  │
│  │Cash Flow │ │   CoC    │ │ Cap Rate │ │   Total  │  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘  │
├─────────────────────────────────────────────────────────┤
│  [First Year] [Multi-Year] [Advanced] [Assumptions]    │
├─────────────────────────────────────────────────────────┤
│  Tab Content Area                                       │
│                                                         │
│  Charts, tables, detailed breakdowns                    │
│                                                         │
└─────────────────────────────────────────────────────────┘
│  [← Edit Inputs]  [Save Calculation]  [Share]          │
└─────────────────────────────────────────────────────────┘
```

### Tab 1: First Year Analysis

**Income Breakdown**
- Gross Rental Income: $42,000
- Vacancy Loss (5%): -$2,100
- Other Income: $0
- **Net Income:** $39,900

**Expense Breakdown**
- Property Tax: $4,800 (40%)
- Insurance: $1,200 (10%)
- Maintenance: $3,000 (25%)
- Management: $0 (0%)
- Utilities: $0 (0%)
- HOA: $0 (0%)
- Other: $0 (0%)
- **Total Expenses:** $9,000

**Debt Service**
- Monthly Payment: $2,398
- Annual Payment: $28,776
- Principal: $6,522
- Interest: $22,254

**Cash Flow Summary**
- Net Income: $39,900
- Operating Expenses: -$9,000
- **NOI:** $30,900
- Debt Service: -$28,776
- **Annual Cash Flow:** $11,724
- **Monthly Cash Flow:** $977

**Monthly Breakdown Chart (Bar Chart)**
- X-axis: Months (Jan-Dec)
- Y-axis: Dollars
- Bars: Income (green), Expenses (red), Cash Flow (blue)

### Tab 2: Multi-Year Projections

**Interactive Line Chart**
- X-axis: Years (0-5)
- Y-axis: Dollars
- Lines:
  - Cash Flow (blue)
  - Property Value (green)
  - Equity (orange)
  - Loan Balance (red, declining)

**Year-by-Year Table** (expandable rows)

| Year | Income   | Expenses | Cash Flow | Property Value | Equity    | ROI   |
|------|----------|----------|-----------|----------------|-----------|-------|
| 1    | $39,900  | $9,000   | $11,724   | $515,000       | $121,522  | 10.7% |
| 2    | $41,097  | $9,225   | $12,541   | $530,450       | $136,108  | 11.4% |
| 3    | $42,330  | $9,456   | $13,394   | $546,364       | $151,318  | 12.2% |
| 4    | $43,600  | $9,692   | $14,285   | $562,755       | $167,172  | 13.0% |
| 5    | $44,908  | $9,934   | $15,215   | $579,637       | $183,687  | 13.8% |

**Cumulative Metrics**
- Total Cash Flow (5 years): $67,159
- Equity Gain: $183,687
- Property Appreciation: $79,637
- Total Return: $146,796
- Equity Multiple: 2.33x

**Exit Scenario (Year 5 Sale)**
- Sale Price: $579,637
- Selling Costs (6%): -$34,778
- Loan Payoff: -$395,950
- **Net Proceeds:** $148,909
- **Total Return:** $216,068 (cash flow + proceeds)
- **IRR:** 18.4%

### Tab 3: Advanced Metrics

**Investment Ratios**
- Cash-on-Cash Return: 10.7%
- Cap Rate: 8.2%
- Internal Rate of Return: 18.4%
- Equity Multiple: 2.33x
- Gross Rent Multiplier: 11.9
- Debt Service Coverage Ratio: 1.35x

**Break-Even Analysis**
- Break-even occupancy: 85.7%
- Break-even rent: $2,850/month
- Months to positive cash flow: Immediate

**Loan Analysis**
- Total Interest Paid (30 years): $364,813
- Total Principal Paid: $500,000
- Year 5 Loan Balance: $395,950
- Equity from Paydown: $104,050
- Equity from Appreciation: $79,637

### Tab 4: Assumptions (Editable)

**Property**
- Type: Single Family
- Purchase Price: $500,000
- Address: 123 Main St

**Financing**
- Down Payment: 20% ($100,000)
- Interest Rate: 6.5%
- Loan Term: 30 years
- Closing Costs: $10,000

**Income**
- Monthly Rent: $3,500
- Vacancy Rate: 5%
- Annual Rent Increase: 3%

**Expenses**
- Property Tax: $4,800/year
- Insurance: $1,200/year
- Maintenance: $250/month
- [... other expenses]

**Multi-Year**
- Holding Period: 5 years
- Appreciation Rate: 3%
- Expense Increase Rate: 2.5%
- Sale Costs: 6%

**[Recalculate] button** - Updates results with new assumptions

---

## Authentication & Tiers

### Unauthenticated Experience

**Flow:**
1. User can complete full calculator (Steps 1-5)
2. See complete first-year results
3. Multi-year projections: Show Year 1, blur years 2+
4. At Step 5, show signup prompt:

```
┌─────────────────────────────────────┐
│  💾 Save This Calculation           │
├─────────────────────────────────────┤
│  Sign up free to:                   │
│  • Save unlimited calculations      │
│  • Access from any device           │
│  • View multi-year projections      │
│                                     │
│  [Sign Up Free] [Sign In]          │
└─────────────────────────────────────┘
```

5. After signup: Migrate localStorage data to database

### Tier Enforcement

**Free Tier (Default after signup)**
- Limit: 3 calculations per month
- Multi-year: First year only (years 2+ blurred with paywall)
- Share links: 7-day expiry
- PDF exports: 1 per month

**Display remaining calculations:**
```typescript
const { remaining } = await canCreateCalculation();
// Show: "2 calculations remaining this month"
// When 0: Show paywall modal
```

**Multi-year paywall (Free users):**
```
┌─────────────────────────────────────┐
│  Year 2-5 Analysis                  │
├─────────────────────────────────────┤
│  [Blurred chart/table]              │
│                                     │
│  🔒 Upgrade to Pro                  │
│  See complete 30-year projections   │
│                                     │
│  [Upgrade to Pro - $9.99/mo]       │
└─────────────────────────────────────┘
```

**Pro Tier ($9.99/month)**
- Unlimited calculations
- Multi-year projections (up to 30 years)
- Unlimited share links (no expiry)
- Unlimited PDF exports
- All features unlocked

**Premium Tier ($29.99/month)**
- Everything in Pro
- Extended projections (up to 50 years)
- White-label PDF reports (future)
- API access (future)
- Advanced features (future)

### Implementation

```typescript
// Check before creating calculation
async function handleCreateCalculation() {
  const { canCreate, remaining, reason } = await canCreateCalculation();

  if (!canCreate) {
    showPaywallModal({
      title: 'Monthly Limit Reached',
      message: `You've used all 3 free calculations this month. ${reason}`,
      ctaText: 'Upgrade to Pro',
      ctaUrl: '/pricing',
    });
    return;
  }

  // Show remaining calculations
  if (remaining <= 1) {
    showNotification(`${remaining} calculation remaining this month`, 'warning');
  }

  // Proceed with creation
  // ...
}

// Check tier for multi-year display
async function renderMultiYearResults() {
  const { tier } = await getSubscriptionStatus();

  const maxYears = tier === 'free' ? 1 : tier === 'pro' ? 30 : 50;
  const yearsToShow = Math.min(inputs.holdingLength, maxYears);

  if (inputs.holdingLength > maxYears) {
    return (
      <>
        <ProjectionChart data={results.slice(0, yearsToShow)} />
        <PaywallOverlay
          title={`Unlock ${inputs.holdingLength}-Year Analysis`}
          tier={tier === 'free' ? 'pro' : 'premium'}
        />
      </>
    );
  }

  return <ProjectionChart data={results} />;
}
```

---

## Error Handling

### Input Validation

**Validation Levels:**

1. **Required Fields** (Block progression)
   - Purchase price, interest rate, loan term
   - Monthly rent
   - Property tax, insurance

2. **Range Validation** (Block progression)
   - Interest rate: 0.1% - 20%
   - Down payment: 0% - 100%
   - Vacancy rate: 0% - 100%
   - All dollar amounts: ≥ 0

3. **Warning Validation** (Allow progression, show warning)
   - Interest rate > 10%: "Unusually high for residential"
   - Vacancy > 15%: "Very high vacancy rate"
   - Down payment < 10%: "May require PMI"
   - Negative cash flow: "Property doesn't cash flow"

**Display Strategy:**

```tsx
<InputField
  error={errors.interestRate?.message}  // Block progression
  warning={warnings.interestRate}        // Allow but warn
/>

// Error: Red border, red text, blocks next step
// Warning: Yellow badge, can proceed
```

### Calculation Errors

**Handle edge cases gracefully:**

```typescript
try {
  const results = calculateMultiYearProjection(inputs);
  return results;
} catch (error) {
  if (error instanceof DivisionByZeroError) {
    return {
      error: 'Invalid inputs: Cannot calculate with zero values',
      suggestion: 'Check purchase price and rent values',
    };
  }

  if (error instanceof IRRCalculationError) {
    return {
      error: 'Could not calculate IRR',
      suggestion: 'Try adjusting cash flows or holding period',
    };
  }

  // Log unexpected errors
  console.error('Calculation error:', error);
  return {
    error: 'Unexpected error during calculation',
    suggestion: 'Please check your inputs and try again',
  };
}
```

**Negative Cash Flow:**
- NOT an error (valid scenario)
- Display clearly with red color
- Show warning: "⚠️ Property has negative cash flow"
- Calculate all other metrics normally

### Network Errors

**Auto-save failures:**

```typescript
async function autoSave(values: CalculationInputs) {
  try {
    await saveCalculation(values);
    showNotification('Saved', 'success');
  } catch (error) {
    // Keep in localStorage as backup
    localStorage.setItem('backup_calculation', JSON.stringify(values));
    showNotification('Could not save to cloud. Saved locally.', 'warning');

    // Retry on next action
    retryQueue.add(() => saveCalculation(values));
  }
}
```

**Database connection failures:**

```typescript
// Show cached data if available
if (error.code === 'PGRST301') {
  return {
    data: getCachedCalculations(),
    error: 'Could not connect to database. Showing cached data.',
    retry: true,
  };
}
```

### Loading States

**Progressive loading indicators:**

```tsx
// Inline spinner during auto-save
<div className="flex items-center gap-2">
  <span>Step 2 Complete</span>
  {isSaving && <Spinner size="sm" />}
  {saved && <CheckIcon className="text-green-500" />}
</div>

// Full-page loader for calculations (IRR can take time)
{isCalculating && (
  <LoadingOverlay message="Calculating multi-year projections..." />
)}

// Skeleton for saved calculations list
<SkeletonCard count={3} />
```

---

## Testing Strategy

### Unit Tests (packages/calculations)

**Test every formula with known values:**

```typescript
describe('Mortgage Calculations', () => {
  describe('calculateMonthlyPayment', () => {
    it('matches Bankrate calculator', () => {
      // $500,000 loan at 6% for 30 years
      expect(calculateMonthlyPayment(500000, 6, 30)).toBe(2997.75);
    });

    it('handles 0% interest', () => {
      // $100,000 loan at 0% for 30 years
      expect(calculateMonthlyPayment(100000, 0, 30)).toBe(277.78);
    });

    it('handles 100% financing', () => {
      expect(calculateMonthlyPayment(500000, 6.5, 30)).toBeCloseTo(3160.34);
    });

    it('matches Excel PMT function', () => {
      // Compare with Excel: =PMT(6%/12, 360, -500000)
      const result = calculateMonthlyPayment(500000, 6, 30);
      expect(result).toBeCloseTo(2997.75, 2);
    });
  });

  describe('generateAmortizationSchedule', () => {
    it('first payment is mostly interest', () => {
      const schedule = generateAmortizationSchedule(400000, 6.5, 30);
      const firstYear = schedule[0];
      expect(firstYear.interest).toBeGreaterThan(firstYear.principal);
    });

    it('loan balance reaches zero at term end', () => {
      const schedule = generateAmortizationSchedule(400000, 6.5, 30);
      const lastYear = schedule[schedule.length - 1];
      expect(lastYear.endingBalance).toBeCloseTo(0, 2);
    });
  });
});

describe('Cash Flow Calculations', () => {
  describe('calculateNOI', () => {
    it('excludes mortgage from NOI', () => {
      const noi = calculateNOI(48000, 12000); // $4k rent, $1k expenses
      expect(noi).toBe(36000);
      // Mortgage is NOT subtracted
    });
  });

  describe('calculateCashFlow', () => {
    it('includes vacancy in calculation', () => {
      const result = calculateCashFlow(4000, 5, 1000, 2000);
      // Gross: $4,000
      // After vacancy (5%): $3,800
      // After expenses: $2,800
      // After mortgage: $800
      expect(result.cashFlow).toBe(800);
    });

    it('handles negative cash flow', () => {
      const result = calculateCashFlow(2000, 5, 1000, 2000);
      expect(result.cashFlow).toBeLessThan(0);
    });
  });
});

describe('Investment Metrics', () => {
  describe('calculateCashOnCashReturn', () => {
    it('calculates CoC correctly', () => {
      // $12,000 annual cash flow / $100,000 invested = 12%
      expect(calculateCashOnCashReturn(12000, 100000)).toBe(12);
    });
  });

  describe('calculateCapRate', () => {
    it('calculates cap rate correctly', () => {
      // $36,000 NOI / $500,000 property = 7.2%
      expect(calculateCapRate(36000, 500000)).toBeCloseTo(7.2);
    });
  });

  describe('calculateIRR', () => {
    it('matches Excel IRR function', () => {
      const cashFlows = [-100000, 10000, 10000, 10000, 10000, 110000];
      const irr = calculateIRR(cashFlows);
      // Compare with Excel: =IRR(cashFlows)
      expect(irr).toBeCloseTo(7.93, 2);
    });
  });

  describe('calculateDSCR', () => {
    it('calculates DSCR correctly', () => {
      // $36,000 NOI / $30,000 annual debt = 1.2x
      expect(calculateDSCR(36000, 30000)).toBeCloseTo(1.2);
    });

    it('warns when DSCR below 1.25', () => {
      expect(calculateDSCR(30000, 30000)).toBe(1.0);
      // Should trigger warning
    });
  });
});

describe('Multi-Year Projections', () => {
  describe('calculateMultiYearProjection', () => {
    it('applies rent increase annually', () => {
      const inputs = {
        monthlyRent: 3000,
        annualRentIncrease: 3,
        // ... other inputs
      };
      const projection = calculateMultiYearProjection(inputs, 5);

      // Year 1: $36,000
      expect(projection[0].grossIncome).toBe(36000);
      // Year 2: $37,080 (3% increase)
      expect(projection[1].grossIncome).toBeCloseTo(37080);
      // Year 5: Should compound
      expect(projection[4].grossIncome).toBeCloseTo(40552);
    });

    it('tracks loan balance correctly', () => {
      const projection = calculateMultiYearProjection(mockInputs, 5);

      // Balance should decrease each year
      for (let i = 1; i < projection.length; i++) {
        expect(projection[i].loanBalance).toBeLessThan(
          projection[i - 1].loanBalance
        );
      }
    });

    it('calculates equity correctly', () => {
      const projection = calculateMultiYearProjection(mockInputs, 5);

      projection.forEach((year) => {
        const calculatedEquity = year.propertyValue - year.loanBalance;
        expect(year.equity).toBeCloseTo(calculatedEquity);
      });
    });
  });
});
```

### Integration Tests

**Test full calculation flow:**

```typescript
describe('Calculator Integration', () => {
  it('completes full wizard flow', async () => {
    // Step 1: Property details
    const step1Data = { propertyType: 'single_family', title: 'Test Property' };
    await saveStep(1, step1Data);

    // Step 2: Purchase & financing
    const step2Data = {
      purchasePrice: 500000,
      downPaymentPercent: 20,
      interestRate: 6.5,
      loanTermYears: 30,
    };
    const preview2 = await saveStep(2, step2Data);
    expect(preview2.monthlyPayment).toBeDefined();

    // ... continue through all steps

    // Step 5: Results
    const results = await calculateResults(allData);
    expect(results.firstYear.cashFlow).toBeDefined();
    expect(results.multiYear).toHaveLength(5);
    expect(results.metrics.cashOnCashReturn).toBeGreaterThan(0);
  });

  it('enforces free tier limits', async () => {
    // Create 3 calculations (free tier limit)
    await createCalculation(data1);
    await createCalculation(data2);
    await createCalculation(data3);

    // 4th should fail
    await expect(createCalculation(data4)).rejects.toThrow(
      'Monthly calculation limit reached'
    );
  });

  it('auto-saves after each step', async () => {
    const { calculationId } = await saveStep(1, step1Data);
    expect(calculationId).toBeDefined();

    await saveStep(2, step2Data, calculationId);

    // Verify data persisted
    const saved = await getCalculation(calculationId);
    expect(saved.purchasePrice).toBe(step2Data.purchasePrice);
  });
});
```

### E2E Tests (Optional for MVP)

**Critical user flows:**

```typescript
test('User can complete calculation and save', async () => {
  await page.goto('/calculator');

  // Step 1
  await page.fill('[name="title"]', 'My Property');
  await page.selectOption('[name="propertyType"]', 'single_family');
  await page.click('button:has-text("Next")');

  // Step 2
  await page.fill('[name="purchasePrice"]', '500000');
  await page.fill('[name="downPaymentPercent"]', '20');
  await page.fill('[name="interestRate"]', '6.5');
  await page.click('button:has-text("Next")');

  // Verify preview shown
  await expect(page.locator('text=Monthly Payment')).toBeVisible();

  // ... continue through all steps

  // Step 5: Verify results
  await expect(page.locator('text=Cash Flow')).toBeVisible();

  // Save calculation
  await page.click('button:has-text("Save Calculation")');
  await expect(page.locator('text=Saved successfully')).toBeVisible();
});

test('Free tier user sees paywall after 3 calculations', async () => {
  await signInAsFreeUser();

  // Create 3 calculations
  await createCalculation('Property 1');
  await createCalculation('Property 2');
  await createCalculation('Property 3');

  // Attempt 4th
  await page.goto('/calculator');
  await fillStep1();
  await page.click('button:has-text("Next")');

  // Should see paywall
  await expect(page.locator('text=Monthly Limit Reached')).toBeVisible();
  await expect(page.locator('text=Upgrade to Pro')).toBeVisible();
});
```

---

## Implementation Checklist

### Phase 2.1: Calculation Engine (Week 3, Days 1-3)

- [ ] Set up `packages/calculations` structure
- [ ] Implement mortgage calculations
  - [ ] `calculateMonthlyPayment()`
  - [ ] `generateAmortizationSchedule()`
  - [ ] Write unit tests (compare with Bankrate, Excel)
- [ ] Implement cash flow calculations
  - [ ] `calculateNOI()`
  - [ ] `calculateCashFlow()`
  - [ ] Write unit tests
- [ ] Implement investment metrics
  - [ ] `calculateCashOnCashReturn()`
  - [ ] `calculateCapRate()`
  - [ ] `calculateIRR()` (use financial library)
  - [ ] `calculateDSCR()`
  - [ ] `calculateEquityMultiple()`
  - [ ] `calculateGRM()`
  - [ ] Write unit tests (compare with Wall Street Prep examples)
- [ ] Implement multi-year projections
  - [ ] `calculateMultiYearProjection()`
  - [ ] Year-over-year rent increase
  - [ ] Year-over-year expense increase
  - [ ] Property appreciation
  - [ ] Loan amortization tracking
  - [ ] Write unit tests
- [ ] Implement exit calculations
  - [ ] `calculateSaleProceeds()`
  - [ ] `calculateTotalReturn()`
  - [ ] Write unit tests
- [ ] Create smart defaults module
- [ ] Create validation warnings module
- [ ] Run full test suite (aim for 100% coverage)

### Phase 2.2: Wizard UI (Week 3, Days 4-5)

- [ ] Create `CalculatorWizard` shell component
  - [ ] Step state management
  - [ ] Progress indicator
  - [ ] Navigation buttons (Back, Next, Save)
  - [ ] Auto-save logic
- [ ] Create `InputField` reusable component
  - [ ] Currency formatting
  - [ ] Percentage formatting
  - [ ] Validation display (errors, warnings)
  - [ ] Help text tooltip
- [ ] Create `Step1PropertyDetails` component
  - [ ] Property type selector
  - [ ] Address fields (optional)
  - [ ] Property characteristics (optional)
  - [ ] Title/name field
  - [ ] Form validation
- [ ] Create `Step2PurchaseFinancing` component
  - [ ] Purchase price
  - [ ] Down payment %
  - [ ] Interest rate
  - [ ] Loan term
  - [ ] Closing costs
  - [ ] Repair costs
  - [ ] Form validation
- [ ] Create `ProgressPreview` component
  - [ ] Mortgage preview (after Step 2)
  - [ ] Income preview (after Step 3)
  - [ ] Cash flow preview (after Step 4)
  - [ ] Collapsible on mobile

### Phase 2.3: Income & Expenses Steps (Week 4, Days 1-2)

- [ ] Create `Step3Income` component
  - [ ] Monthly rent
  - [ ] Other income
  - [ ] Vacancy rate (with default)
  - [ ] Annual rent increase (with default)
  - [ ] Form validation
- [ ] Create `Step4Expenses` component
  - [ ] Property tax (annual)
  - [ ] Insurance (annual)
  - [ ] HOA (monthly)
  - [ ] Maintenance (monthly)
  - [ ] Property management (%)
  - [ ] Utilities (monthly)
  - [ ] Other expenses (monthly)
  - [ ] Multi-year assumptions section:
    - [ ] Holding period
    - [ ] Appreciation rate
    - [ ] Expense increase rate
    - [ ] Sale closing costs %
  - [ ] Form validation
- [ ] Wire up progressive previews
  - [ ] Calculate and show after Step 2
  - [ ] Calculate and show after Step 3
  - [ ] Calculate and show after Step 4

### Phase 2.4: Results Display (Week 4, Days 3-4)

- [ ] Create `Step5Results` component structure
  - [ ] Tab navigation (First Year, Multi-Year, Advanced, Assumptions)
  - [ ] Key metrics dashboard (cards at top)
  - [ ] Tab content area
- [ ] Create `MetricsCard` component
  - [ ] Large value display
  - [ ] Label and description
  - [ ] Color coding (green/red)
  - [ ] Responsive layout
- [ ] Create `ResultsChart` component
  - [ ] Line chart for multi-year trends
  - [ ] Bar chart for monthly breakdown
  - [ ] Responsive (vertical on mobile)
  - [ ] Interactive tooltips
- [ ] Create `ResultsTable` component
  - [ ] Year-by-year data
  - [ ] Expandable rows
  - [ ] Sortable columns
  - [ ] Export to CSV button
  - [ ] Mobile view (card layout)
- [ ] Implement Tab 1: First Year Analysis
  - [ ] Income breakdown
  - [ ] Expense breakdown
  - [ ] Cash flow summary
  - [ ] Monthly breakdown chart
- [ ] Implement Tab 2: Multi-Year Projections
  - [ ] Interactive line chart
  - [ ] Year-by-year table
  - [ ] Cumulative metrics
  - [ ] Exit scenario
- [ ] Implement Tab 3: Advanced Metrics
  - [ ] All investment ratios
  - [ ] Break-even analysis
  - [ ] Loan analysis
- [ ] Implement Tab 4: Assumptions (Editable)
  - [ ] Display all inputs
  - [ ] Edit mode
  - [ ] Recalculate button

### Phase 2.5: State & Persistence (Week 4, Day 5)

- [ ] Set up React Hook Form + Zod schemas
  - [ ] Create combined schema
  - [ ] Split into step schemas
  - [ ] Add validation rules
- [ ] Implement auto-save logic
  - [ ] Save to localStorage (unauthenticated)
  - [ ] Save to Supabase (authenticated)
  - [ ] Debounced saves
  - [ ] Error handling
- [ ] Implement calculation CRUD operations
  - [ ] Create calculation (`createCalculation`)
  - [ ] Update calculation (`updateCalculation`)
  - [ ] Load calculation (`getCalculationById`)
  - [ ] Delete calculation (`deleteCalculation`)
- [ ] Implement draft migration on signup
  - [ ] Detect localStorage draft
  - [ ] Migrate to database after auth
  - [ ] Clear localStorage
- [ ] Add loading states
  - [ ] Auto-save spinner
  - [ ] Calculation progress
  - [ ] Skeleton loaders

### Phase 2.6: Authentication & Tiers (Week 4, Day 6-7)

- [ ] Implement tier checking
  - [ ] `canCreateCalculation()` hook
  - [ ] Display remaining calculations
  - [ ] Show paywall when limit reached
- [ ] Create paywall modal component
  - [ ] Clear messaging
  - [ ] Upgrade CTA
  - [ ] Close and dismiss options
- [ ] Implement multi-year gating (free tier)
  - [ ] Show first year only
  - [ ] Blur years 2+
  - [ ] Upgrade prompt overlay
- [ ] Add signup prompt at Step 5 (unauthenticated)
  - [ ] "Save this calculation" banner
  - [ ] Sign up / sign in options
- [ ] Test tier enforcement
  - [ ] Free tier limits
  - [ ] Pro tier unlocked
  - [ ] Premium tier extended

### Phase 2.7: Polish & Testing (Week 4, Day 7)

- [ ] Error handling
  - [ ] Input validation errors
  - [ ] Calculation errors (graceful degradation)
  - [ ] Network errors (retry logic)
- [ ] Add helpful warnings
  - [ ] High interest rate
  - [ ] High vacancy
  - [ ] Low down payment
  - [ ] Negative cash flow
- [ ] Mobile responsive testing
  - [ ] All steps mobile-friendly
  - [ ] Charts responsive
  - [ ] Tables convert to cards
  - [ ] Touch-friendly navigation
- [ ] Run full test suite
  - [ ] Unit tests passing
  - [ ] Integration tests passing
  - [ ] Manual testing all flows
- [ ] Performance optimization
  - [ ] Lazy load charts
  - [ ] Memoize expensive calculations
  - [ ] Optimize re-renders
- [ ] Accessibility
  - [ ] Keyboard navigation
  - [ ] Screen reader labels
  - [ ] Focus management

### Final Verification

- [ ] Complete full wizard flow (unauthenticated)
- [ ] Complete full wizard flow (authenticated free)
- [ ] Complete full wizard flow (authenticated pro)
- [ ] Test tier enforcement (free → paywall)
- [ ] Test auto-save (both storage methods)
- [ ] Test edit saved calculation
- [ ] Verify all calculations accurate (spot check against external calculators)
- [ ] Mobile testing (iOS Safari, Android Chrome)
- [ ] Cross-browser testing (Chrome, Firefox, Safari)

---

## Success Criteria

**Phase 2 is complete when:**

✅ User can complete all 5 steps of the wizard
✅ Progressive previews show after steps 2, 3, 4
✅ Step 5 displays comprehensive results with charts and tables
✅ All calculations match industry-standard formulas (verified against Bankrate, Excel, Wall Street Prep)
✅ Multi-year projections work for 1-50 years
✅ Auto-save works (localStorage + database)
✅ Tier limits enforced (free: 3/month, pro/premium: unlimited)
✅ Mobile responsive on iOS and Android
✅ All unit tests passing (>90% coverage on calculation engine)
✅ No critical bugs

---

## Next Steps (Phase 3+)

After Phase 2 completion:

**Phase 3: Data Management & Sharing**
- Saved calculations dashboard
- Edit existing calculations
- Duplicate calculations
- Share via link
- PDF export

**Phase 4: LLM Features**
- Natural language input
- Market data suggestions
- Calculation explanations
- Scenario generation

**Phase 5: Mobile Apps**
- Publish iOS app
- Publish Android app
- Mobile-specific features

---

**Document Version:** 1.0
**Last Updated:** January 26, 2026
**Status:** Ready for Implementation
