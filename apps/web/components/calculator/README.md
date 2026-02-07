# Calculator Wizard Components

This directory contains all the components for the RentalROI calculator wizard (Phase 2.2).

## Component Structure

### Main Components

- **`input-field.tsx`** - Reusable form input with formatting (currency, percentage, number)
- **`step1-property-details.tsx`** - Property information form (Step 1)
- **`step2-purchase-financing.tsx`** - Purchase price and financing details (Step 2)
- **`step3-income.tsx`** - Rental income and assumptions (Step 3)
- **`step4-expenses.tsx`** - Operating expenses and multi-year assumptions (Step 4)
- **`step5-results.tsx`** - Results placeholder (full implementation in Phase 2.4)
- **`progress-preview.tsx`** - Progressive calculation preview shown after steps 2-4

### Main Page

The calculator wizard is implemented in:
- **`apps/web/app/(dashboard)/calculator/page.tsx`**

## Features Implemented

### ✅ Phase 2.2 Deliverables

1. **Port Configuration** - Next.js dev server runs on port 3005
2. **5-Step Wizard** - Complete wizard structure with navigation
3. **InputField Component** - Reusable with currency/percentage/number formatting
4. **Step 1-4 Components** - All form steps implemented with validation
5. **Step 5 Placeholder** - Basic placeholder for results view
6. **ProgressPreview** - Shows partial calculations after steps 2, 3, 4
7. **Form Validation** - Zod schemas with proper validation rules
8. **Auto-save** - Debounced localStorage auto-save for unauthenticated users
9. **Mobile Responsive** - Mobile-first design with Tailwind CSS

## Usage

### Starting the Dev Server

```bash
# From monorepo root
pnpm dev

# Or specifically for web app
pnpm --filter @repo/web dev
```

The app will be available at: http://localhost:3005/calculator

### Form State Management

The wizard uses React Hook Form with Zod validation:

```typescript
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { calculatorSchema } from '@/lib/validation/calculator-schema';

const form = useForm({
  resolver: zodResolver(calculatorSchema),
  defaultValues: DEFAULT_VALUES,
  mode: 'onBlur',
});
```

### Using InputField

```typescript
<InputField
  name="purchasePrice"
  label="Purchase Price"
  type="currency"
  required
  placeholder="500000"
  helpText="Total purchase price of the property"
  min={1000}
/>
```

Types supported:
- `text` - Plain text input
- `currency` - Formats as $1,000.00
- `percentage` - Formats as 5%
- `number` - Formats as 1,000

## Data Flow

1. **User Input** → React Hook Form state
2. **Validation** → Zod schemas validate on blur
3. **Auto-save** → Debounced save to localStorage (1s delay)
4. **Preview** → Live calculations shown in ProgressPreview
5. **Navigation** → Validates current step before allowing "Next"

## Auto-save Strategy

- **Unauthenticated Users**: Saves to localStorage with key `calculator_draft`
- **Debounce**: 1 second delay to avoid excessive saves
- **Draft Loading**: Automatically loads draft on page mount
- **Future**: Will save to Supabase database for authenticated users

## Validation

### Required Fields
- **Step 1**: title, propertyType
- **Step 2**: purchasePrice, downPaymentPercent, interestRate, loanTermYears
- **Step 3**: monthlyRent
- **Step 4**: propertyTaxAnnual, insuranceAnnual

### Warnings (non-blocking)
- Interest rate > 10%
- Vacancy rate > 15%
- Down payment < 10%
- Property management fee > 15%
- Negative cash flow

## Calculations

The wizard uses calculation functions from `@repo/calculations`:

- `calculateMonthlyPayment()` - Mortgage payment calculation
- `calculateCashFlow()` - Cash flow analysis
- `DEFAULT_VALUES` - Smart defaults for all inputs
- `getDefaultsForPropertyType()` - Property-type specific defaults

## Next Steps (Phase 2.4)

The Step 5 Results component needs to be fully implemented with:
- Key metrics dashboard
- Interactive charts
- Year-by-year tables
- First-year analysis tab
- Multi-year projections tab
- Advanced metrics tab
- Assumptions editor tab

## File Locations

- Components: `/apps/web/components/calculator/`
- Main Page: `/apps/web/app/(dashboard)/calculator/page.tsx`
- Validation: `/apps/web/lib/validation/calculator-schema.ts`
- Calculations: `/packages/calculations/src/`

## Testing

To test the wizard:

1. Start the dev server: `pnpm dev`
2. Navigate to: http://localhost:3005/calculator
3. Complete all 5 steps
4. Check browser localStorage for saved draft
5. Reload page to verify draft restoration
6. Test validation by leaving required fields empty
7. Test responsive design on mobile viewport

## Known Limitations

- Step 5 Results is a placeholder (Phase 2.4)
- No database persistence yet (authenticated users)
- No multi-user support
- No calculation history/saved calculations
- No sharing functionality
- No PDF export

These will be implemented in Phase 3.
