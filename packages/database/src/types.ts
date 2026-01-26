/**
 * Database types generated from Supabase schema
 *
 * To regenerate these types after schema changes:
 * 1. Make sure you're linked to the correct project
 * 2. Run: supabase gen types typescript --project-id <project-id> > packages/database/src/types.ts
 *
 * Or use the npm script: pnpm run db:types
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type SubscriptionTier = 'free' | 'pro' | 'premium';
export type PropertyType =
  | 'single_family'
  | 'multi_family'
  | 'condo'
  | 'townhouse'
  | 'commercial'
  | 'other';

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          subscription_tier: SubscriptionTier;
          subscription_expires_at: string | null;
          revenuecat_user_id: string | null;
          revenuecat_subscription_id: string | null;
          calculations_this_month: number;
          last_calculation_reset_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          subscription_tier?: SubscriptionTier;
          subscription_expires_at?: string | null;
          revenuecat_user_id?: string | null;
          revenuecat_subscription_id?: string | null;
          calculations_this_month?: number;
          last_calculation_reset_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          subscription_tier?: SubscriptionTier;
          subscription_expires_at?: string | null;
          revenuecat_user_id?: string | null;
          revenuecat_subscription_id?: string | null;
          calculations_this_month?: number;
          last_calculation_reset_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      properties: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          property_type: PropertyType;
          address: string | null;
          city: string | null;
          state: string | null;
          zip_code: string | null;
          bedrooms: number | null;
          bathrooms: number | null;
          square_feet: number | null;
          year_built: number | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          property_type?: PropertyType;
          address?: string | null;
          city?: string | null;
          state?: string | null;
          zip_code?: string | null;
          bedrooms?: number | null;
          bathrooms?: number | null;
          square_feet?: number | null;
          year_built?: number | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          property_type?: PropertyType;
          address?: string | null;
          city?: string | null;
          state?: string | null;
          zip_code?: string | null;
          bedrooms?: number | null;
          bathrooms?: number | null;
          square_feet?: number | null;
          year_built?: number | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      calculations: {
        Row: {
          id: string;
          user_id: string;
          property_id: string | null;
          title: string;
          holding_length: number;
          purchase_price: number;
          down_payment_percent: number;
          closing_costs: number;
          repair_costs: number;
          interest_rate: number;
          loan_term_years: number;
          monthly_rent: number;
          other_monthly_income: number;
          vacancy_rate: number;
          annual_rent_increase: number;
          property_tax_annual: number;
          insurance_annual: number;
          hoa_monthly: number;
          maintenance_monthly: number;
          property_management_percent: number;
          utilities_monthly: number;
          other_expenses_monthly: number;
          annual_appreciation_rate: number;
          sale_closing_costs_percent: number;
          total_investment: number | null;
          monthly_mortgage_payment: number | null;
          monthly_gross_income: number | null;
          monthly_expenses: number | null;
          monthly_cash_flow: number | null;
          annual_cash_flow: number | null;
          cash_on_cash_return: number | null;
          cap_rate: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          property_id?: string | null;
          title: string;
          holding_length?: number;
          purchase_price: number;
          down_payment_percent: number;
          closing_costs?: number;
          repair_costs?: number;
          interest_rate: number;
          loan_term_years?: number;
          monthly_rent: number;
          other_monthly_income?: number;
          vacancy_rate?: number;
          annual_rent_increase?: number;
          property_tax_annual: number;
          insurance_annual: number;
          hoa_monthly?: number;
          maintenance_monthly?: number;
          property_management_percent?: number;
          utilities_monthly?: number;
          other_expenses_monthly?: number;
          annual_appreciation_rate?: number;
          sale_closing_costs_percent?: number;
          total_investment?: number | null;
          monthly_mortgage_payment?: number | null;
          monthly_gross_income?: number | null;
          monthly_expenses?: number | null;
          monthly_cash_flow?: number | null;
          annual_cash_flow?: number | null;
          cash_on_cash_return?: number | null;
          cap_rate?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          property_id?: string | null;
          title?: string;
          holding_length?: number;
          purchase_price?: number;
          down_payment_percent?: number;
          closing_costs?: number;
          repair_costs?: number;
          interest_rate?: number;
          loan_term_years?: number;
          monthly_rent?: number;
          other_monthly_income?: number;
          vacancy_rate?: number;
          annual_rent_increase?: number;
          property_tax_annual?: number;
          insurance_annual?: number;
          hoa_monthly?: number;
          maintenance_monthly?: number;
          property_management_percent?: number;
          utilities_monthly?: number;
          other_expenses_monthly?: number;
          annual_appreciation_rate?: number;
          sale_closing_costs_percent?: number;
          total_investment?: number | null;
          monthly_mortgage_payment?: number | null;
          monthly_gross_income?: number | null;
          monthly_expenses?: number | null;
          monthly_cash_flow?: number | null;
          annual_cash_flow?: number | null;
          cash_on_cash_return?: number | null;
          cap_rate?: number | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      projections: {
        Row: {
          id: string;
          calculation_id: string;
          year: number;
          gross_income: number;
          vacancy_loss: number;
          net_income: number;
          property_tax: number;
          insurance: number;
          hoa: number;
          maintenance: number;
          property_management: number;
          utilities: number;
          other_expenses: number;
          total_expenses: number;
          mortgage_payment: number;
          principal_paid: number;
          interest_paid: number;
          cash_flow: number;
          cumulative_cash_flow: number;
          property_value: number;
          loan_balance: number;
          equity: number;
          cash_on_cash_return: number | null;
          equity_multiple: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          calculation_id: string;
          year: number;
          gross_income: number;
          vacancy_loss: number;
          net_income: number;
          property_tax: number;
          insurance: number;
          hoa: number;
          maintenance: number;
          property_management: number;
          utilities: number;
          other_expenses: number;
          total_expenses: number;
          mortgage_payment: number;
          principal_paid: number;
          interest_paid: number;
          cash_flow: number;
          cumulative_cash_flow: number;
          property_value: number;
          loan_balance: number;
          equity: number;
          cash_on_cash_return?: number | null;
          equity_multiple?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          calculation_id?: string;
          year?: number;
          gross_income?: number;
          vacancy_loss?: number;
          net_income?: number;
          property_tax?: number;
          insurance?: number;
          hoa?: number;
          maintenance?: number;
          property_management?: number;
          utilities?: number;
          other_expenses?: number;
          total_expenses?: number;
          mortgage_payment?: number;
          principal_paid?: number;
          interest_paid?: number;
          cash_flow?: number;
          cumulative_cash_flow?: number;
          property_value?: number;
          loan_balance?: number;
          equity?: number;
          cash_on_cash_return?: number | null;
          equity_multiple?: number | null;
          created_at?: string;
        };
      };
      shared_links: {
        Row: {
          id: string;
          calculation_id: string;
          user_id: string;
          token: string;
          expires_at: string | null;
          view_count: number;
          last_viewed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          calculation_id: string;
          user_id: string;
          token: string;
          expires_at?: string | null;
          view_count?: number;
          last_viewed_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          calculation_id?: string;
          user_id?: string;
          token?: string;
          expires_at?: string | null;
          view_count?: number;
          last_viewed_at?: string | null;
          created_at?: string;
        };
      };
      audit_logs: {
        Row: {
          id: string;
          user_id: string | null;
          action: string;
          entity_type: string | null;
          entity_id: string | null;
          metadata: Json | null;
          ip_address: string | null;
          user_agent: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          action: string;
          entity_type?: string | null;
          entity_id?: string | null;
          metadata?: Json | null;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          action?: string;
          entity_type?: string | null;
          entity_id?: string | null;
          metadata?: Json | null;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      get_user_tier: {
        Args: Record<PropertyKey, never>;
        Returns: SubscriptionTier;
      };
      is_subscription_active: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      get_calculations_this_month: {
        Args: Record<PropertyKey, never>;
        Returns: number;
      };
      reset_monthly_calculations: {
        Args: Record<PropertyKey, never>;
        Returns: void;
      };
    };
    Enums: {
      subscription_tier: SubscriptionTier;
      property_type: PropertyType;
    };
  };
}
