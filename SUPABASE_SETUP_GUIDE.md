# Supabase Setup Guide - RentalROI

## Overview

You have two Supabase projects set up:
- **DEV:** `rentalroi.app-dev` (ID: `czdenl1ortsyxuoqvalp`)
- **PROD:** `rentalroi-prod` (ID: `mgpacftgrgcyvpjguoxs`)

This guide will walk you through completing the setup.

---

## Step 1: Get API Keys

For **BOTH** projects (DEV and PROD), get the following:

### In Supabase Dashboard:

1. Go to **Settings → API**
2. Copy these values:

   ```
   Project URL: https://czdenl1ortsyxuoqvalp.supabase.co  (DEV)
                https://mgpacftgrgcyvpjguoxs.supabase.co  (PROD)

   anon public: eyJ...  (safe for client-side)
   service_role: eyJ...  (keep secret, server-side only)
   ```

### Create Environment Files:

**For DEV (`apps/web/.env.development.local`):**
```bash
NEXT_PUBLIC_SUPABASE_URL=https://czdenl1ortsyxuoqvalp.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_dev_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_dev_service_role_key_here
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

**For PROD (`apps/web/.env.production.local`):**
```bash
NEXT_PUBLIC_SUPABASE_URL=https://mgpacftgrgcyvpjguoxs.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_prod_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_prod_service_role_key_here
NEXT_PUBLIC_APP_URL=https://rentalroi.app
NODE_ENV=production
```

**For Mobile (`apps/mobile/.env`):**
```bash
EXPO_PUBLIC_SUPABASE_URL=https://czdenl1ortsyxuoqvalp.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_dev_anon_key_here
```

---

## Step 2: Install Supabase CLI

```bash
# Install via Homebrew (Mac)
brew install supabase/tap/supabase

# Verify installation
supabase --version
```

---

## Step 3: Apply Migrations to DEV

```bash
# 1. Link to DEV project
pnpm run db:link:dev

# You'll be prompted for:
# - Supabase access token (create at: https://supabase.com/dashboard/account/tokens)
# - Database password (from Settings → Database in Supabase dashboard)

# 2. Push migrations to DEV
pnpm run db:push

# This will apply:
# - 20260126000001_initial_schema.sql (tables, indexes, triggers)
# - 20260126000002_rls_policies.sql (Row-Level Security)
```

### Verify in DEV:

Go to: https://supabase.com/dashboard/project/czdenl1ortsyxuoqvalp/editor

You should see tables:
- `users`
- `properties`
- `calculations`
- `projections`
- `shared_links`
- `audit_logs`

---

## Step 4: Configure Authentication (DEV)

### In Supabase Dashboard → Authentication → Providers:

#### A. Email Provider (Already enabled)
✅ Already works out of the box

#### B. Google OAuth (Optional)
1. Go to **Providers → Google**
2. Enable Google provider
3. Add OAuth credentials:
   - Get from: [Google Cloud Console](https://console.cloud.google.com/)
   - Create OAuth 2.0 Client ID
   - Add redirect URL: `https://czdenl1ortsyxuoqvalp.supabase.co/auth/v1/callback`

#### C. Apple OAuth (Optional, for iOS)
1. Go to **Providers → Apple**
2. Enable Apple provider
3. Add credentials from Apple Developer Account
4. Add redirect URL: `https://czdenl1ortsyxuoqvalp.supabase.co/auth/v1/callback`

### Authentication Settings:

Go to **Settings → Authentication**:

- **Site URL:** `http://localhost:3000`
- **Additional Redirect URLs:**
  ```
  http://localhost:3000/auth/callback
  http://localhost:3000/reset-password
  exp://localhost:8081  (for Expo mobile)
  ```
- **Confirm email:** OFF (for dev, enable in prod)
- **Email templates:** Customize later if needed

---

## Step 5: Test the Setup

### A. Start the Web App:

```bash
cd apps/web
pnpm dev
```

Open http://localhost:3000

### B. Test Database Connection:

Create a test file: `apps/web/test-supabase.ts`

```typescript
import { supabase } from '@repo/database';

async function testConnection() {
  // Test 1: Check connection
  const { data, error } = await supabase.from('users').select('count');
  console.log('Connection test:', { data, error });

  // Test 2: Sign up
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email: 'test@example.com',
    password: 'testpassword123',
  });
  console.log('Sign up test:', { signUpData, signUpError });
}

testConnection();
```

Run: `npx tsx apps/web/test-supabase.ts`

---

## Step 6: Generate TypeScript Types

After migrations are applied, generate types from your schema:

```bash
pnpm run db:types
```

This updates `packages/database/src/types.ts` with your actual schema.

---

## Step 7: Apply to Production (When Ready)

**⚠️ IMPORTANT:** Only do this AFTER thorough testing in DEV!

```bash
# 1. Link to PROD project
pnpm run db:link:prod

# 2. Push migrations to PROD
pnpm run db:push
```

Then repeat Step 4 (Authentication) for PROD with production URLs.

---

## Step 8: Update Mobile App Configuration

Edit `apps/mobile/app.json`:

```json
{
  "expo": {
    "scheme": "rentalroi",
    "ios": {
      "bundleIdentifier": "app.rentalroi",
      "associatedDomains": [
        "applinks:czdenl1ortsyxuoqvalp.supabase.co"
      ]
    },
    "android": {
      "package": "app.rentalroi",
      "intentFilters": [
        {
          "action": "VIEW",
          "data": [
            {
              "scheme": "https",
              "host": "czdenl1ortsyxuoqvalp.supabase.co"
            }
          ],
          "category": ["BROWSABLE", "DEFAULT"]
        }
      ]
    }
  }
}
```

---

## Useful Commands

```bash
# Database Management
pnpm run db:link:dev          # Link to DEV project
pnpm run db:link:prod         # Link to PROD project
pnpm run db:push              # Push migrations
pnpm run db:types             # Generate TypeScript types
pnpm run db:migration <name>  # Create new migration

# Check migration status
supabase migration list

# View diff (what changed)
supabase db diff

# Reset database (DEV only, destructive!)
supabase db reset
```

---

## Database Schema Overview

### Users Table
- Extends `auth.users` with subscription info
- Tracks tier (`free`, `pro`, `premium`)
- Counts monthly calculations
- Stores RevenueCat user ID

### Calculations Table
- All inputs (40+ fields)
- Calculated results (cash flow, ROI, cap rate)
- Belongs to user and optionally property
- RLS enforces tier limits (free: 3/month)

### Projections Table
- Multi-year projections (year-by-year)
- Only accessible to Pro/Premium users
- Linked to calculations

### Properties Table
- Property details (address, type, characteristics)
- One user can have many properties
- One property can have many calculations

### Shared Links Table
- Shareable calculation links
- Free tier: 7-day expiry
- Pro/Premium: no expiry
- Tracks view count

---

## Row-Level Security (RLS) Highlights

### Free Tier Limits:
- ✅ 3 calculations per month
- ✅ Can only view first year results
- ✅ Share links expire in 7 days
- ❌ No multi-year projections

### Pro/Premium:
- ✅ Unlimited calculations
- ✅ Multi-year projections (up to 30/50 years)
- ✅ Share links never expire
- ✅ All features

RLS policies **automatically enforce** these limits at the database level!

---

## Next Steps

After completing this setup:

1. ✅ **Test authentication** - Sign up, sign in, sign out
2. ✅ **Test calculations** - Create, read, update, delete
3. ✅ **Test tier enforcement** - Try creating 4th calculation as free user (should fail)
4. ✅ **Test mobile app** - Connect mobile app to DEV Supabase
5. 📱 **Continue with Phase 2** - Build the calculator UI

---

## Troubleshooting

### "Missing Supabase environment variables"
- Make sure you created `.env.development.local` in `apps/web/`
- Check that keys are correct (no extra spaces)

### "relation does not exist"
- Migrations haven't been applied
- Run: `pnpm run db:push`

### "row violates row-level security policy"
- RLS is working! User doesn't have permission
- Check auth state: `supabase.auth.getUser()`

### "Failed to link project"
- Get access token from: https://supabase.com/dashboard/account/tokens
- Make sure you have permission to the project

---

## Questions?

If you encounter any issues:
1. Check Supabase Dashboard logs
2. Check browser console for errors
3. Verify environment variables are loaded
4. Test connection with `test-supabase.ts`

Happy coding! 🚀
