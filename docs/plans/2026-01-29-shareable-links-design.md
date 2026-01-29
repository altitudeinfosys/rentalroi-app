# Shareable Links Design

**Date:** 2026-01-29
**Status:** Approved

---

## Overview

Allow logged-in users to share calculations via short URLs. Links expire after 30 days. Shared view displays full results + all inputs (read-only).

## User Flow

### Sharing a Calculation

1. User completes calculation and views results (Step 5)
2. User clicks "Share" button (next to Save)
3. System checks authentication (redirect to login if needed)
4. System generates 8-character random token
5. System inserts record into `shared_links` table (expires in 30 days)
6. URL copied to clipboard automatically
7. Toast: "Link copied! Expires in 30 days."

### Viewing a Shared Link

1. Visitor opens `/s/abc123xy`
2. System looks up token in `shared_links`
3. If expired or not found → show 404 with CTA to sign up
4. System increments `view_count`, updates `last_viewed_at`
5. System fetches calculation data
6. Renders read-only view with inputs + full 5-tab results

## URL Format

Short token format: `rentalroi.app/s/{token}`

- Token: 8 characters, URL-safe (`a-zA-Z0-9`)
- ~218 trillion combinations
- Generated server-side via `crypto.randomBytes`

Example: `https://rentalroi.app/s/k7xM2pQr`

## Files

### New Files

| File | Purpose |
|------|---------|
| `lib/supabase/shared-links.ts` | CRUD functions for shared links |
| `app/s/[token]/page.tsx` | Public shared view page |
| `components/calculator/share-button.tsx` | Share button with clipboard copy |
| `components/shared/shared-calculation-view.tsx` | Read-only results + inputs |

### Modified Files

| File | Change |
|------|--------|
| `components/calculator/step5-results.tsx` | Add ShareButton next to Save |

## API Functions

```typescript
// lib/supabase/shared-links.ts

// Generate URL-safe random token (8 chars)
function generateToken(): string

// Create shared link, returns full URL
async function createSharedLink(
  calculationId: string,
  userId: string
): Promise<{ url: string; expiresAt: Date }>

// Get calculation by token (public, uses service role)
async function getSharedCalculation(
  token: string
): Promise<{ calculation: DbCalculation; expiresAt: Date } | null>

// Increment view count
async function recordView(token: string): Promise<void>

// Delete shared link (owner only)
async function deleteSharedLink(
  token: string,
  userId: string
): Promise<void>
```

## Database

Uses existing `shared_links` table:

```sql
CREATE TABLE shared_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  calculation_id UUID NOT NULL REFERENCES calculations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ,  -- Set to NOW() + 30 days
  view_count INTEGER NOT NULL DEFAULT 0,
  last_viewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**RLS:** Existing policies allow users to create/read/delete own links. Public read access handled via service role client.

## UI Components

### ShareButton

```tsx
<ShareButton
  calculationId={id}
  disabled={!isLoggedIn || !isSaved}
/>
```

- Disabled if not logged in or calculation not saved
- Shows loading spinner while generating
- Copies URL to clipboard on success

### Shared View Page

- Header: "Shared Calculation" badge + property title
- Collapsible "View Inputs" section showing all assumptions
- Full 5-tab results display (Overview, Cash Flow, Projections, etc.)
- Footer CTA: "Want to analyze your own property?" → `/signup`
- Expired state: "This link has expired" + signup CTA

### Toast Messages

- Success: "Link copied! Expires in 30 days."
- Error: "Failed to create link. Please try again."

## Security Considerations

- Tokens are cryptographically random (collision-resistant)
- Expired links return 404 (no information leakage)
- Service role client used only for public read access
- Users can only create links for their own calculations (RLS enforced)
- Users can delete their own links to revoke access

## Out of Scope

- Custom/vanity slugs
- Configurable expiration periods
- Social sharing buttons (Twitter, Facebook, etc.)
- Password-protected links
- Link management UI (list/revoke links)
