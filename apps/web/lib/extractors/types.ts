/**
 * Types for property data extraction from listing URLs.
 * Field names match CalculatorFormData so extracted data can be spread directly into form.reset().
 */

export interface ExtractedPropertyData {
  // Step 1 — Property Details
  title?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  bedrooms?: number;
  bathrooms?: number;
  squareFeet?: number;
  propertyType?: 'single_family' | 'multi_family' | 'condo' | 'townhouse' | 'commercial' | 'other';

  // Step 2 — Purchase & Financing
  purchasePrice?: number;

  // Step 4 — Expenses
  propertyTaxAnnual?: number;
  hoaMonthly?: number;
}

export type ListingSource = 'zillow' | 'redfin';

export interface ExtractPropertyResponse {
  success: boolean;
  data: ExtractedPropertyData;
  source: ListingSource;
  /** Field names that were successfully extracted */
  extractedFields: string[];
  /** Field names that could not be extracted (user should fill manually) */
  missingFields: string[];
  error?: string;
}
