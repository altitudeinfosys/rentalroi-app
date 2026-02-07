# RentalROI - Project TODO

## Completed ✅

### Phase 2 - Calculator Wizard
- [x] Implement Light and Dark Mode (2026-01-26)
- [x] Add Zip Code Field to Property Details (2026-01-26)

### Phase 3 - Authentication & Saved Calculations
- [x] Install Supabase SDK (2026-01-26)
- [x] Create Supabase client utilities
- [x] Add auth middleware for protected routes
- [x] Add login/signup/forgot-password pages
- [x] Configure Supabase Auth with OAuth callback
- [x] Implement saveCalculation() API
- [x] Implement getCalculations() API
- [x] Implement getCalculation(id) API
- [x] Implement deleteCalculation(id) API
- [x] Add "Save" button to Step 5 results
- [x] Create calculations history page (/calculations)
- [x] Load saved calculation into wizard (edit flow)
- [x] Apply migrations to DEV and PROD (2026-01-26)
- [x] Generate shareable links (2026-01-29)
- [x] Create shared view page (`/s/[token]`) (2026-01-29)

### Phase 3.5 - Marketing Landing Page
- [x] Create marketing landing page at "/" (2026-01-30)
- [x] Move dashboard to "/dashboard" route (2026-01-30)
- [x] Add auth redirect (logged-in users "/" → "/dashboard") (2026-01-30)
- [x] Implement editorial design with custom typography (2026-01-30)
- [x] Create all landing sections: hero, features, how-it-works, pricing, testimonials, FAQ, footer (2026-01-30)

### Database & Infrastructure
- [x] **DEV/PROD Database Verification** (2026-01-30)
  - [x] Create script to compare DEV vs PROD schemas
  - [x] Verify all 6 tables match (calculations, users, shared_links, audit_logs, projections, properties)

### Phase 4 - Testing
- [x] **Unit Tests - Calculation Engine** (2026-01-30) - 219 tests, 98% coverage
  - [x] Test mortgage payment calculations (mortgage.test.ts - 26 tests)
  - [x] Test cash flow calculations (cash-flow.test.ts - 25 tests)
  - [x] Test ROI metrics (metrics.test.ts - 43 tests)
  - [x] Test multi-year projection calculations (projections.test.ts - 36 tests)
  - [x] Test expense calculations (cash-flow.test.ts)
  - [x] Test exit/sale calculations (exit.test.ts - 28 tests)
  - [x] Test edge cases (0% down, cash purchase, negative cash flow)
  - [x] Test defaults and validation (defaults.test.ts, validation.test.ts - 49 tests)

- [x] **LLM-Based Calculation Validation** (2026-01-30)
  - [x] Create test suite with real-world scenarios (llm-validation.test.ts - 12 tests)
  - [x] Document formulas for LLM verification
  - [x] Test with textbook examples (matches Excel PMT, standard cap rate)
  - [x] Test edge cases (cash purchase, appreciation play, negative cash flow)

---

## In Progress 🚧

*(None currently)*

---

## Pending 📋

### Phase 3 - Remaining Auth Items
- [ ] Configure OAuth providers in Supabase Dashboard
  - [ ] Google OAuth setup
  - [ ] Apple OAuth setup

### Database & Infrastructure (Remaining)
- [ ] Verify RLS policies are equivalent between DEV/PROD
- [ ] Verify functions/triggers are synced
- [ ] Set up automated schema diff check (CI/CD)
- [ ] Document migration workflow

### Phase 4 - Testing (Remaining)

- [ ] **Integration Tests**
  - [ ] Test Supabase CRUD operations for calculations
  - [ ] Test shareable link generation and retrieval
  - [ ] Test auth flow end-to-end (signup, login, logout, password reset)
  - [ ] Test protected route access

- [ ] **E2E Tests**
  - [ ] Test complete calculator wizard flow
  - [ ] Test save and load calculation flow
  - [ ] Test share link flow

### Phase 5 - Polish & Production
- [x] **Error Handling** (2026-01-30)
  - [x] Add global error boundary (error.tsx, not-found.tsx, global-error.tsx)
  - [ ] Improve form validation error messages
  - [ ] Add API error handling with user-friendly messages
  - [ ] Add retry logic for failed requests

- [x] **Loading States & UX** (2026-01-30)
  - [x] Add skeleton loaders for calculations list
  - [ ] Add loading spinners for async operations
  - [ ] Add optimistic updates where appropriate
  - [ ] Add success/error toast notifications

- [x] **Mobile Responsiveness** (2026-01-30)
  - [x] Audit calculator wizard on mobile (verified at 375px)
  - [x] Audit calculations list on mobile (responsive grid)
  - [x] Audit shared view page on mobile (verified)
  - [x] Test touch interactions (verified)

- [ ] **Performance**
  - [ ] Audit bundle size
  - [ ] Add code splitting where needed
  - [ ] Optimize images
  - [ ] Add caching headers

- [ ] **Production Deployment**
  - [ ] Set up production environment variables
  - [ ] Configure production Supabase instance
  - [ ] Set up CI/CD pipeline
  - [ ] Configure domain and SSL
  - [ ] Set up monitoring and error tracking

### Phase 6 - Mobile App 📱
- [ ] **React Native / Expo Setup**
  - [ ] Configure apps/mobile with shared packages
  - [ ] Set up navigation (React Navigation)
  - [ ] Configure Supabase client for mobile
  - [ ] Set up secure token storage

- [ ] **Core Screens**
  - [ ] Login / Signup screens
  - [ ] Dashboard / Home screen
  - [ ] Calculator wizard (mobile-optimized)
  - [ ] Saved calculations list
  - [ ] Calculation detail view
  - [ ] Settings / Profile screen

- [ ] **Mobile-Specific Features**
  - [ ] Push notifications
  - [ ] Biometric authentication (Face ID / Touch ID)
  - [ ] Offline support with local storage
  - [ ] Share sheet integration

- [ ] **App Store Deployment**
  - [ ] iOS App Store submission
  - [ ] Google Play Store submission
  - [ ] App Store screenshots and metadata

### Phase 7 - Property Data Integration 🏠
- [ ] **Zillow Link Scraper**
  - [ ] Create API endpoint to accept Zillow URL
  - [ ] Parse Zillow page for property data (price, beds, baths, sqft, address)
  - [ ] Extract property tax estimates
  - [ ] Handle rate limiting and error cases
  - [ ] Pre-populate calculator form with scraped data
  - [ ] Add "Import from Zillow" button to calculator

- [ ] **Alternative Data Sources**
  - [ ] Redfin integration
  - [ ] Realtor.com integration
  - [ ] MLS API integration (if available)

### Future Enhancements 🔮
- [ ] PDF export for calculations
- [ ] Property comparison tool
- [ ] Pro subscription with Stripe
- [ ] Email notifications
- [ ] Property address autocomplete with Google Places API
- [ ] Rental estimate integration (Rentometer, Zillow Rent Zestimate)
- [ ] Neighborhood data (crime stats, schools, walkability)

---

## Notes

**Calculation Engine Location:** `packages/calculations/src/`
- `mortgage.ts` - Mortgage payment, amortization
- `cash-flow.ts` - NOI, cash flow calculations
- `metrics.ts` - Cap rate, cash-on-cash, IRR, DSCR
- `projections.ts` - Multi-year projections
- `exit.ts` - Sale proceeds, total return

**Key Formulas to Test:**
- Monthly Mortgage: `P * [r(1+r)^n] / [(1+r)^n - 1]`
- Cap Rate: `NOI / Purchase Price`
- Cash-on-Cash: `Annual Cash Flow / Total Cash Invested`
- Total ROI: `(Cash Flow + Appreciation + Equity) / Investment`

**Mobile App Location:** `apps/mobile/` (React Native / Expo)

**Database Verification Commands:**
```bash
# Compare schemas using Supabase CLI
supabase db diff --linked --schema public

# Pull schema from remote
supabase db pull --linked

# Check migration status
supabase migration list --linked
```

**Supabase Projects:**
- DEV: `czdenllortsyxuoqvalp`
- PROD: `mgpacftgrgcyvpjguoxs`

**Test Commands:**
```bash
# Run calculation tests
pnpm test --filter=@repo/calculations

# Run with coverage
cd packages/calculations && pnpm test:coverage
```
