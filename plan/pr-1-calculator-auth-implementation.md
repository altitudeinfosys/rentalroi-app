# PR #1 Code Review Implementation Plan

**PR**: [feat: Complete Phase 2 & 3 - Calculator Wizard + Authentication](https://github.com/altitudeinfosys/rentalroi-app/pull/1)

**Reviewed by**:
- CodeRabbit (coderabbitai[bot]) - 17+ review iterations with 50+ actionable comments
- Claude (internal review) - Grade: A- (93/100)
- Codex - No review found

**Last Updated**: 2026-02-06

---

## Consolidated Review Summary

| Reviewer   | Status    | Critical | Major | Medium | Low  |
| ---------- | --------- | -------- | ----- | ------ | ---- |
| CodeRabbit | COMMENTED | 5        | 15    | ~12    | ~25  |
| Claude     | APPROVED  | 0        | 3     | 3      | 4    |
| Codex      | N/A       | -        | -     | -      | -    |

---

## Status: Issues Fixed

### ✅ Critical Security Fixes Applied (2026-02-06)

| Issue | Status | File |
| ----- | ------ | ---- |
| SQL function search_path hijacking | ✅ Fixed | `supabase/migrations/20260206000001_fix_search_path_security.sql` |
| Safe redirect path bypass (control chars) | ✅ Hardened | `apps/web/lib/utils/safe-redirect.ts` |

### ✅ Security Fixes Applied (Commit 4bf31ba)

| Issue | Status |
| ----- | ------ |
| Open redirect in auth callback | ✅ Fixed with `getSafeRedirectUrl()` |
| Open redirect in login form | ✅ Fixed with `getSafeRedirectPath()` |
| Dashboard not in protected routes | ✅ Added to middleware |
| Rate limit bypass on error | ✅ Returns `canCreate: false` |
| Reset password auth state | ✅ Added session validation |

### ✅ Accessibility Fixes Applied

| Component | Status |
| --------- | ------ |
| Delete dialog ARIA | ✅ Added role, aria-modal, aria-labelledby |
| Mobile menu button | ✅ Added aria-label |
| Skeleton component | ✅ Added role="status" |
| Error page button | ✅ Added aria-label |

### ✅ Type/Build Fixes Applied

| Issue | Status |
| ----- | ------ |
| dbToSummary return type | ✅ Fixed |
| TooltipProps in results-chart | ✅ Fixed |
| sellingCostPercent property | ✅ Fixed → saleClosingCostsPercent |
| ThemeProvider import | ✅ Fixed |

---

## Remaining Issues (From Latest CodeRabbit Reviews)

### Critical Security Issues ✅ RESOLVED

#### 1. ✅ SQL Function Search Path Hijacking - FIXED
**Files**: `supabase/migrations/20260206000001_fix_search_path_security.sql`
**Issue**: `SECURITY DEFINER` functions (`get_user_tier()`, `get_calculations_this_month()`) don't pin `search_path`, allowing potential hijacking.
**Fix Applied**: Created new migration that replaces functions with `SET search_path = public, pg_catalog` both in function body and definition.
**Status**: ✅ Fixed

#### 2. ✅ Safe Redirect Path Bypass - HARDENED
**File**: `apps/web/lib/utils/safe-redirect.ts`
**Issue**: Potential bypass via control characters or malformed encoding.
**Fix Applied**: Added control character rejection (null bytes, etc.) to `normalizePath()`. The implementation already correctly decoded and normalized paths via URL constructor.
**Status**: ✅ Fixed

### High Priority Issues (Should Fix)

#### 3. 🟠 Division by Zero / NaN Errors in Results
**Files**: `apps/web/components/calculator/step5-results.tsx:562-564, 795-797, 1218-1231`
**Issue**: Multiple calculations can produce NaN or Infinity:
- ROI calculation divides by `totalInvestment` which could be 0
- Profit margin divides by `netIncome` which could be 0
- Amortization info box assumes non-empty array
**Fix**: Add guards before all divisions, render "N/A" or fallback when denominator is 0
**Priority**: High

#### 4. 🟠 Non-Null Assertion on Optional user.email
**File**: `apps/web/app/api/calculations/save/route.ts:54-56`
**Issue**: `user.email!` can crash for phone/OAuth signups where email is null.
**Fix**: Use nullish coalescing: `email: user.email ?? user.user_metadata?.email ?? null`
**Priority**: High

#### 5. 🟠 Unbounded Recursion in createSharedLink
**File**: `apps/web/lib/supabase/shared-links.ts:42-47`
**Issue**: On unique violation (Postgres error 23505), the function recurses indefinitely.
**Fix**: Add `maxRetries` parameter (e.g., 5) and throw after exhausting retries.
**Priority**: High

#### 6. 🟠 canSave and canViewResults useMemo Ineffective
**Files**: `apps/web/app/(dashboard)/calculator/page.tsx:203-220, 309-318`
**Issue**: `form.watch()` returns a new object each render, defeating memoization.
**Fix**: Watch specific fields: `form.watch(['title', 'propertyType', 'purchasePrice', 'monthlyRent'])`
**Priority**: High

#### 7. 🟠 NaN Values in Save Path
**File**: `apps/web/app/(dashboard)/calculator/page.tsx:198-219`
**Issue**: Numeric fields may be undefined when saving, producing NaN in calculations.
**Fix**: Defensively default each numeric field to 0 when computing derived values.
**Priority**: High

### Medium Priority Issues (Recommended)

#### 8. 🟡 Missing Form Fields in Save
**File**: `apps/web/components/calculator/step5-results.tsx:175-206`
**Issue**: `formDataForSave` is missing `propertyManagementMode` and `propertyManagementMonthly`
**Fix**: Add these fields to the useMemo that constructs formDataForSave
**Priority**: Medium

#### 9. 🟡 Amortization Chart X-Axis Key Mismatch
**File**: `apps/web/components/calculator/step5-results.tsx:1152-1158`
**Issue**: Amortization data uses `year` key but ResultsChart expects `label`
**Fix**: Map to use `label: \`Year ${year.year}\``
**Priority**: Medium

#### 10. 🟡 0% Interest Rate Treated as Falsy
**File**: `apps/web/components/calculator/progress-preview.tsx:50-53`
**Issue**: Guard incorrectly treats 0 interestRate as falsy and skips calculation
**Fix**: Use `interestRate !== null && interestRate !== undefined` or `Number.isFinite()`
**Priority**: Medium

#### 11. 🟡 Race Condition in View Count Increment
**File**: `apps/web/lib/supabase/shared-links.ts:116-131`
**Issue**: Read-then-update pattern can lose increments under concurrent requests.
**Fix**: Use atomic increment via RPC or raw SQL
**Priority**: Medium

#### 12. 🟡 expiresAt Prop Type Mismatch
**File**: `apps/web/components/shared/shared-calculation-view.tsx:21`
**Issue**: Prop declared as Date but may arrive as ISO string after JSON serialization.
**Fix**: Accept `string | Date`, normalize with `new Date()` before formatting.
**Priority**: Medium

#### 13. 🟡 parseFormattedValue Coerces Empty to 0
**File**: `apps/web/components/calculator/input-field.tsx:55-58`
**Issue**: Empty/invalid input coerced to 0 instead of allowing undefined.
**Fix**: Return `null` for empty/invalid parses, let validation treat null as "empty".
**Priority**: Medium

#### 14. 🟡 Debounce Logic Multiple Timeouts
**File**: `apps/web/app/(dashboard)/calculator/page.tsx:113-131`
**Issue**: Each change schedules new setTimeout without cancelling previous.
**Fix**: Use a ref to hold current timeout ID, clear before setting new one.
**Priority**: Medium

#### 15. 🟡 safeToFixed Ignores Fallback Parameter
**File**: `apps/web/lib/utils/format.ts:10-19`
**Issue**: Function ignores fallback parameter when value is undefined/null/NaN.
**Fix**: Use fallback value when value is invalid.
**Priority**: Medium

### Low Priority / Nitpicks

#### 16. 🟢 Middleware forEach Lint Errors
**File**: `apps/web/lib/supabase/middleware.ts:17-24`
**Issue**: Expression-bodied arrow functions in forEach trigger lint errors
**Fix**: Convert to block-bodied callbacks
**Priority**: Low

#### 17. 🟢 Sidebar Active Check Fails for Query Params
**File**: `apps/web/components/dashboard/sidebar.tsx:79-81, 88-90`
**Fix**: Use prefix match with `pathname.startsWith(item.href)` for non-root items.
**Priority**: Low

#### 18. 🟢 Default Mode/Value Mismatch in Defaults
**File**: `packages/calculations/src/defaults.ts:23-37`
**Issue**: Percent defaults set but modes are 'dollar'.
**Fix**: If percent defaults are set, modes should be `'percent'`.
**Priority**: Low

#### 19. 🟢 Accessibility Improvements
- FAQ accordion: Add `aria-expanded`
- Sidebar close button: Add `aria-label="Close sidebar"`
- Mobile menu: Add `aria-label` and `aria-expanded`
**Priority**: Low

#### 20. 🟢 Code Quality
- Inconsistent return types in `getCalculationServer`
- Magic numbers for thresholds (8% cash-on-cash, 6% cap rate)
- Duplicate formatters across files
- Unused props in `ExpenseToggleField`
- Unused `containerRef` in features-grid.tsx
**Priority**: Low

---

## Previously Identified Issues (Verified)

### ✅ No Action Needed

| Issue | Status |
| ----- | ------ |
| Secrets in HANDOFF doc | ✅ Uses `[REDACTED]` placeholders |
| Sensitive data in migration | ✅ Only PRIMARY KEY definitions |
| RLS policy restrictions | ✅ Already enforces auth.uid() check |

---

## Implementation Priority

### Phase 1: Critical Security (Before Merge)
1. [ ] **Task 1.1**: Fix SQL function search_path hijacking (new migration)
2. [ ] **Task 1.2**: Harden safe-redirect.ts against path traversal

### Phase 2: High Priority Bug Fixes
3. [ ] **Task 2.1**: Fix division by zero in step5-results.tsx
4. [ ] **Task 2.2**: Fix non-null assertion on user.email
5. [ ] **Task 2.3**: Add retry limit to createSharedLink
6. [ ] **Task 2.4**: Fix canSave/canViewResults memoization
7. [ ] **Task 2.5**: Fix NaN in save path

### Phase 3: Medium Priority
8. [ ] **Task 3.1**: Add propertyManagementMode to form save
9. [ ] **Task 3.2**: Fix amortization chart label key
10. [ ] **Task 3.3**: Fix 0% interest rate falsy check
11. [ ] **Task 3.4**: Add atomic view count increment
12. [ ] **Task 3.5**: Fix expiresAt prop type
13. [ ] **Task 3.6**: Fix parseFormattedValue empty handling
14. [ ] **Task 3.7**: Fix debounce timeout cleanup
15. [ ] **Task 3.8**: Fix safeToFixed fallback

### Phase 4: Low Priority (Post-Merge)
16. [ ] Middleware forEach lint fixes
17. [ ] Sidebar active check improvements
18. [ ] Default mode/value alignment
19. [ ] Accessibility improvements
20. [ ] Code quality cleanup

---

## Files to Modify

### Critical (Phase 1)
| File | Change |
| ---- | ------ |
| `supabase/migrations/` (new) | Fix search_path in SECURITY DEFINER functions |
| `apps/web/lib/utils/safe-redirect.ts` | Add path normalization |

### High Priority (Phase 2)
| File | Change |
| ---- | ------ |
| `apps/web/components/calculator/step5-results.tsx` | Division guards |
| `apps/web/app/api/calculations/save/route.ts` | Fix email assertion |
| `apps/web/lib/supabase/shared-links.ts` | Add retry limit |
| `apps/web/app/(dashboard)/calculator/page.tsx` | Fix memoization, NaN |

### Medium Priority (Phase 3)
| File | Change |
| ---- | ------ |
| `apps/web/components/calculator/progress-preview.tsx` | 0% rate fix |
| `apps/web/components/shared/shared-calculation-view.tsx` | Type fix |
| `apps/web/components/calculator/input-field.tsx` | Empty handling |
| `apps/web/lib/utils/format.ts` | Fallback fix |

---

## Testing Requirements

### Security Testing
- [ ] Test redirect bypass attempts (`/dashboard/../admin`, `//evil.com`, encoded paths)
- [ ] Verify protected routes require authentication
- [ ] Test SQL function search_path is pinned

### Functional Testing
- [ ] Calculator with edge cases (0 values, empty fields, 0% interest)
- [ ] Save/load calculations with all field modes
- [ ] Shared link creation with max retries triggered
- [ ] View count under concurrent access

### Regression Testing
- [ ] All existing calculator tests pass
- [ ] Auth flows work (login, signup, logout)
- [ ] Save/load calculations work
- [ ] Edit existing calculation works

---

## Testing Verification Commands

```bash
# Build passes
pnpm build --filter=web

# Tests pass
pnpm test --filter=@repo/calculations  # 219 tests, 98% coverage
```

---

## Recommendation

**Current Status**: Requires critical security fixes before merge

### Before Merge (Required)
1. Fix SQL function search_path hijacking - Critical security issue
2. Harden safe-redirect.ts path normalization - Security bypass

### Can Merge After Critical Fixes
The following can be addressed in follow-up PRs:
- High priority bug fixes (division by zero, NaN, etc.)
- Medium priority improvements
- Low priority cleanups

### Risk Assessment
| Phase | Effort | Risk |
| ----- | ------ | ---- |
| Phase 1 (Security) | Low-Medium | High if not fixed |
| Phase 2 (Bugs) | Medium | Medium |
| Phase 3 (Improvements) | Medium | Low |
| Phase 4 (Cleanup) | Low | Very Low |
