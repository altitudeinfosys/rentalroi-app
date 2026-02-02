/**
 * Mappers for converting between form data and database format
 */

import type { CalculatorFormData } from '@/lib/validation/calculator-schema'

/**
 * Database row type for calculations table
 */
export interface DbCalculation {
  id?: string
  user_id: string
  property_id?: string | null

  // Property details
  title: string
  property_type: string
  address?: string | null
  city?: string | null
  state?: string | null
  zip_code?: string | null
  bedrooms?: number | null
  bathrooms?: number | null
  square_feet?: number | null

  // Purchase & financing
  purchase_price: number
  down_payment_percent: number
  closing_costs: number
  repair_costs: number
  interest_rate: number
  loan_term_years: number

  // Income
  monthly_rent: number
  other_monthly_income: number
  vacancy_rate: number
  annual_rent_increase: number

  // Expenses
  property_tax_annual: number
  insurance_annual: number
  hoa_monthly: number
  maintenance_monthly: number
  property_management_percent: number
  property_management_mode?: string | null
  property_management_monthly?: number | null
  utilities_monthly: number
  other_expenses_monthly: number
  annual_expense_increase: number

  // Exit strategy
  holding_length: number
  annual_appreciation_rate: number
  sale_closing_costs_percent: number

  // Computed results (stored for quick access)
  total_investment?: number | null
  monthly_mortgage_payment?: number | null
  monthly_gross_income?: number | null
  monthly_expenses?: number | null
  monthly_cash_flow?: number | null
  annual_cash_flow?: number | null
  cash_on_cash_return?: number | null
  cap_rate?: number | null

  // Timestamps
  created_at?: string
  updated_at?: string
}

/**
 * Computed results to store with calculation
 */
export interface ComputedResults {
  totalInvestment: number
  monthlyMortgagePayment: number
  monthlyGrossIncome: number
  monthlyExpenses: number
  monthlyCashFlow: number
  annualCashFlow: number
  cashOnCashReturn: number
  capRate: number
}

/**
 * Convert form data to database format
 */
export function formToDb(
  form: CalculatorFormData,
  userId: string,
  results?: ComputedResults
): DbCalculation {
  return {
    user_id: userId,

    // Property details
    title: form.title,
    property_type: form.propertyType,
    address: form.address || null,
    city: form.city || null,
    state: form.state || null,
    zip_code: form.zipCode || null,
    bedrooms: form.bedrooms ?? null,
    bathrooms: form.bathrooms ?? null,
    square_feet: form.squareFeet ?? null,

    // Purchase & financing
    purchase_price: form.purchasePrice,
    down_payment_percent: form.downPaymentPercent,
    closing_costs: form.closingCosts,
    repair_costs: form.repairCosts,
    interest_rate: form.interestRate,
    loan_term_years: form.loanTermYears,

    // Income
    monthly_rent: form.monthlyRent,
    other_monthly_income: form.otherMonthlyIncome,
    vacancy_rate: form.vacancyRate,
    annual_rent_increase: form.annualRentIncrease,

    // Expenses
    property_tax_annual: form.propertyTaxAnnual,
    insurance_annual: form.insuranceAnnual,
    hoa_monthly: form.hoaMonthly,
    maintenance_monthly: form.maintenanceMonthly,
    property_management_percent: form.propertyManagementPercent,
    property_management_mode: form.propertyManagementMode || 'percent',
    property_management_monthly: form.propertyManagementMonthly ?? 0,
    utilities_monthly: form.utilitiesMonthly,
    other_expenses_monthly: form.otherExpensesMonthly,
    annual_expense_increase: form.annualExpenseIncrease,

    // Exit strategy
    holding_length: form.holdingLength,
    annual_appreciation_rate: form.annualAppreciationRate,
    sale_closing_costs_percent: form.saleClosingCostsPercent,

    // Computed results
    ...(results && {
      total_investment: results.totalInvestment,
      monthly_mortgage_payment: results.monthlyMortgagePayment,
      monthly_gross_income: results.monthlyGrossIncome,
      monthly_expenses: results.monthlyExpenses,
      monthly_cash_flow: results.monthlyCashFlow,
      annual_cash_flow: results.annualCashFlow,
      cash_on_cash_return: results.cashOnCashReturn,
      cap_rate: results.capRate,
    }),
  }
}

/**
 * Convert database row to form data format
 */
export function dbToForm(db: DbCalculation): CalculatorFormData {
  return {
    // Property details
    propertyType: db.property_type as CalculatorFormData['propertyType'],
    title: db.title,
    address: db.address || undefined,
    city: db.city || undefined,
    state: db.state || undefined,
    zipCode: db.zip_code || undefined,
    bedrooms: db.bedrooms ?? undefined,
    bathrooms: db.bathrooms ?? undefined,
    squareFeet: db.square_feet ?? undefined,

    // Purchase & financing
    purchasePrice: db.purchase_price,
    downPaymentPercent: db.down_payment_percent,
    closingCosts: db.closing_costs,
    repairCosts: db.repair_costs,
    interestRate: db.interest_rate,
    loanTermYears: db.loan_term_years,

    // Income
    monthlyRent: db.monthly_rent,
    otherMonthlyIncome: db.other_monthly_income,
    vacancyRate: db.vacancy_rate,
    annualRentIncrease: db.annual_rent_increase,

    // Expenses
    propertyTaxAnnual: db.property_tax_annual,
    insuranceAnnual: db.insurance_annual,
    hoaMonthly: db.hoa_monthly,
    maintenanceMonthly: db.maintenance_monthly,
    propertyManagementPercent: db.property_management_percent,
    propertyManagementMode: (db.property_management_mode as 'percent' | 'dollar') || 'percent',
    propertyManagementMonthly: db.property_management_monthly ?? 0,
    utilitiesMonthly: db.utilities_monthly,
    otherExpensesMonthly: db.other_expenses_monthly,
    annualExpenseIncrease: db.annual_expense_increase,

    // Exit strategy
    holdingLength: db.holding_length,
    annualAppreciationRate: db.annual_appreciation_rate,
    saleClosingCostsPercent: db.sale_closing_costs_percent,
  }
}

/**
 * Extract summary data for calculation cards
 */
export function dbToSummary(db: DbCalculation): {
  id: string
  title: string
  propertyType: string
  address: string | null | undefined
  city: string | null | undefined
  state: string | null | undefined
  purchasePrice: number
  monthlyCashFlow: number | null | undefined
  annualCashFlow: number | null | undefined
  cashOnCashReturn: number | null | undefined
  capRate: number | null | undefined
  createdAt: string | undefined
  updatedAt: string | undefined
} {
  return {
    id: db.id!, // id is always present when reading from DB
    title: db.title,
    propertyType: db.property_type,
    address: db.address,
    city: db.city,
    state: db.state,
    purchasePrice: db.purchase_price,
    monthlyCashFlow: db.monthly_cash_flow,
    annualCashFlow: db.annual_cash_flow,
    cashOnCashReturn: db.cash_on_cash_return,
    capRate: db.cap_rate,
    createdAt: db.created_at,
    updatedAt: db.updated_at,
  }
}
