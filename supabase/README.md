# Supabase Setup & Migrations

This directory contains database migrations and Edge Functions for the RentalROI project.

## Projects

We have two Supabase projects:

- **Development:** `rentalroi.app-dev` (Project ID: `czdenl1ortsyxuoqvalp`)
- **Production:** `rentalroi-prod` (Project ID: `mgpacftgrgcyvpjguoxs`)

## Prerequisites

Install the Supabase CLI:

```bash
brew install supabase/tap/supabase
```

## Setup

### 1. Link to Development Project

```bash
# Link to DEV project
supabase link --project-ref czdenl1ortsyxuoqvalp

# You'll be prompted for your database password
# Find it in: Supabase Dashboard → Settings → Database → Database Password
```

### 2. Apply Migrations to DEV

```bash
# Push all migrations to DEV
supabase db push

# Or apply specific migration
supabase db push --include-name 20260126000001_initial_schema.sql
```

### 3. Verify Migration

```bash
# Check migration status
supabase migration list

# Or view in Supabase Studio:
# https://supabase.com/dashboard/project/czdenl1ortsyxuoqvalp/editor
```

### 4. Test in DEV

Update your `.env.development.local` with DEV credentials and test the application.

### 5. Deploy to Production

**IMPORTANT:** Only deploy to production after thorough testing in DEV!

```bash
# Link to PROD project
supabase link --project-ref mgpacftgrgcyvpjguoxs

# Push migrations to PROD
supabase db push
```

## Creating New Migrations

```bash
# Create a new migration file
supabase migration new <migration_name>

# Example:
supabase migration new add_portfolio_table

# This creates: supabase/migrations/YYYYMMDDHHMMSS_add_portfolio_table.sql
# Edit the file, then push to DEV first to test
```

## Migrations

### `20260126000001_initial_schema.sql`

Creates the core database schema:

- **users** - User profiles with subscription tier
- **properties** - Property details
- **calculations** - Investment calculations
- **projections** - Multi-year projections (Pro/Premium)
- **shared_links** - Shareable calculation links
- **audit_logs** - Action tracking

Key features:
- Automatic `updated_at` timestamps
- Monthly calculation count tracking
- Triggers for user creation from auth.users

### `20260126000002_rls_policies.sql`

Implements Row-Level Security:

- **Tier enforcement** - Free (3 calcs/month), Pro/Premium (unlimited)
- **Data isolation** - Users can only access their own data
- **Sharing controls** - Free (7-day expiry), Pro/Premium (no expiry)
- **Multi-year projections** - Pro/Premium only

## Database Schema

### Users Table

```sql
users (
  id UUID PRIMARY KEY,
  email TEXT,
  subscription_tier ENUM('free', 'pro', 'premium'),
  subscription_expires_at TIMESTAMPTZ,
  calculations_this_month INTEGER,
  ...
)
```

### Calculations Table

```sql
calculations (
  id UUID PRIMARY KEY,
  user_id UUID,
  property_id UUID,
  title TEXT,
  holding_length INTEGER,
  -- All calculation inputs
  purchase_price DECIMAL,
  interest_rate DECIMAL,
  monthly_rent DECIMAL,
  -- ... (40+ fields)
  -- Calculated results
  monthly_cash_flow DECIMAL,
  cash_on_cash_return DECIMAL,
  ...
)
```

## Testing RLS Policies

```sql
-- Test as a free user (in Supabase SQL Editor)
SET request.jwt.claims.sub = '<user_id>';

-- Try to create 4th calculation (should fail)
INSERT INTO calculations (user_id, title, ...) VALUES (...);
-- Error: new row violates row-level security policy

-- Test multi-year projections as free user (should fail)
INSERT INTO projections (calculation_id, year, ...) VALUES (...);
-- Error: new row violates row-level security policy
```

## Backup & Restore

### Backup

```bash
# Backup DEV
supabase db dump -f dev_backup.sql --project-ref czdenl1ortsyxuoqvalp

# Backup PROD
supabase db dump -f prod_backup.sql --project-ref mgpacftgrgcyvpjguoxs
```

### Restore

```bash
# Restore to DEV (for testing)
supabase db reset --project-ref czdenl1ortsyxuoqvalp
supabase db push
```

## Troubleshooting

### Migration fails with "relation already exists"

```bash
# Check current schema
supabase db diff --schema public

# Reset database (DEV only!)
supabase db reset
```

### Can't connect to project

```bash
# Re-link project
supabase link --project-ref <project-id>

# Check connection
supabase projects list
```

### RLS policy blocking queries

Check the policy in Supabase Dashboard → Authentication → Policies, or:

```sql
SELECT * FROM pg_policies WHERE tablename = 'calculations';
```

## Edge Functions (To be added)

- `revenuecat-webhook` - Handle subscription updates
- `openai-proxy` - Proxy LLM requests with rate limiting
- `generate-pdf` - Server-side PDF generation
