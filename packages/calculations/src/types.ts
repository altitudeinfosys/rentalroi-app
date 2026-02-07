/**
 * Shared TypeScript types for calculation engine
 */

/**
 * Complete calculation inputs
 */
export interface CalculationInputs {
  // Property details
  propertyType:
    | 'single_family'
    | 'multi_family'
    | 'condo'
    | 'townhouse'
    | 'commercial'
    | 'other';
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  bedrooms?: number;
  bathrooms?: number;
  squareFeet?: number;
  title: string;

  // Purchase & Financing
  purchasePrice: number;
  downPaymentPercent: number;
  interestRate: number; // Annual percentage (e.g., 6.5)
  loanTermYears: number;
  closingCosts: number;
  repairCosts: number;

  // Income
  monthlyRent: number;
  otherMonthlyIncome: number;
  vacancyRate: number; // Percentage (e.g., 5)
  annualRentIncrease: number; // Percentage (e.g., 3)

  // Expenses (with optional % toggle support)
  propertyTaxAnnual: number;
  propertyTaxPercent?: number; // % of purchase price
  propertyTaxMode?: 'dollar' | 'percent';

  insuranceAnnual: number;
  insurancePercent?: number; // % of purchase price
  insuranceMode?: 'dollar' | 'percent';

  hoaMonthly: number;

  maintenanceMonthly: number;
  maintenancePercent?: number; // % of purchase price annually
  maintenanceMode?: 'dollar' | 'percent';

  propertyManagementPercent: number; // Percentage of gross rent
  propertyManagementMonthly?: number; // Fixed $ amount
  propertyManagementMode?: 'dollar' | 'percent';

  utilitiesMonthly: number;
  otherExpensesMonthly: number;
  annualExpenseIncrease: number; // Percentage (e.g., 2.5)

  // Multi-year assumptions
  holdingLength: number; // Years
  annualAppreciationRate: number; // Percentage (e.g., 3)
  saleClosingCostsPercent: number; // Percentage (e.g., 6)
}

/**
 * Year in an amortization schedule
 */
export interface AmortizationYear {
  year: number;
  beginningBalance: number;
  payment: number; // Annual payment
  principal: number;
  interest: number;
  endingBalance: number;
}

/**
 * Cash flow breakdown for a period
 */
export interface CashFlowBreakdown {
  grossIncome: number;
  vacancyLoss: number;
  netIncome: number;
  totalExpenses: number;
  noi: number; // Net Operating Income
  debtService: number;
  cashFlow: number;
}

/**
 * Year in a multi-year projection
 */
export interface ProjectionYear {
  year: number;

  // Income
  grossIncome: number;
  vacancyLoss: number;
  netIncome: number;

  // Expenses
  propertyTax: number;
  insurance: number;
  hoa: number;
  maintenance: number;
  management: number;
  utilities: number;
  otherExpenses: number;
  totalExpenses: number;

  // Debt
  mortgagePayment: number; // Annual
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

/**
 * Sale/exit analysis
 */
export interface SaleProceeds {
  salePrice: number;
  sellingCosts: number;
  loanPayoff: number;
  netProceeds: number;
}

/**
 * Complete investment return analysis
 */
export interface TotalReturn {
  totalCashFlow: number; // Sum of all annual cash flows
  saleProceeds: number; // Net proceeds from sale
  totalReturn: number; // Cash flow + sale proceeds
  totalInvestment: number; // Down payment + closing + repairs
  equityMultiple: number; // Total return / total investment
  irr: number; // Internal rate of return (percentage)
}

/**
 * All investment metrics
 */
export interface InvestmentMetrics {
  cashOnCashReturn: number; // Percentage
  capRate: number; // Percentage
  dscr: number; // Ratio
  grm: number; // Ratio
  equityMultiple: number; // Ratio (for multi-year)
  irr: number; // Percentage (for multi-year)
}

/**
 * Validation warning
 */
export interface ValidationWarning {
  field: string;
  value: number;
  threshold: number;
  message: string;
  severity: 'warning' | 'info';
}
