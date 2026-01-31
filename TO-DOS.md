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

---

## In Progress 🚧

*(None currently)*

---

## Pending 📋

### Phase 3 - Remaining Auth Items
- [ ] Configure OAuth providers in Supabase Dashboard
  - [ ] Google OAuth setup
  - [ ] Apple OAuth setup

### Phase 4 - Testing
- [ ] **Unit Tests - Calculation Engine**
  - [ ] Test mortgage payment calculations
  - [ ] Test cash flow calculations
  - [ ] Test ROI metrics (cap rate, cash-on-cash, total ROI)
  - [ ] Test multi-year projection calculations
  - [ ] Test expense calculations (taxes, insurance, maintenance, vacancy)
  - [ ] Test edge cases (0% down, cash purchase, negative cash flow)

- [ ] **LLM-Based Calculation Validation**
  - [ ] Create test suite that sends scenarios to LLM for verification
  - [ ] Compare LLM calculations against our engine results
  - [ ] Document any discrepancies and validate correctness
  - [ ] Test with real-world property examples

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
- [ ] **Error Handling**
  - [ ] Add global error boundary
  - [ ] Improve form validation error messages
  - [ ] Add API error handling with user-friendly messages
  - [ ] Add retry logic for failed requests

- [ ] **Loading States & UX**
  - [ ] Add skeleton loaders for calculations list
  - [ ] Add loading spinners for async operations
  - [ ] Add optimistic updates where appropriate
  - [ ] Add success/error toast notifications

- [ ] **Mobile Responsiveness**
  - [ ] Audit calculator wizard on mobile
  - [ ] Audit calculations list on mobile
  - [ ] Audit shared view page on mobile
  - [ ] Test touch interactions

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

### Future Enhancements 🔮
- [ ] PDF export for calculations
- [ ] Property comparison tool
- [ ] Pro subscription with Stripe
- [ ] Email notifications
- [ ] Property address autocomplete
- [ ] Import property data from Zillow/Redfin APIs

---

## Notes

**Calculation Engine Location:** `apps/web/lib/calculations.ts`

**Key Formulas to Test:**
- Monthly Mortgage: `P * [r(1+r)^n] / [(1+r)^n - 1]`
- Cap Rate: `NOI / Purchase Price`
- Cash-on-Cash: `Annual Cash Flow / Total Cash Invested`
- Total ROI: `(Cash Flow + Appreciation + Equity) / Investment`
