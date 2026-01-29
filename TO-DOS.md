# TO-DOS

## Completed ✅

### Phase 2 - Calculator Wizard
- ~~Implement Light and Dark Mode~~ - **DONE** (2026-01-26) - Added next-themes, ThemeProvider, ThemeToggle
- ~~Add Zip Code Field to Property Details~~ - **DONE** (2026-01-26) - Added to Step 1 form

### Phase 3 - Authentication & Saved Calculations
- ~~Install Supabase SDK~~ - **DONE** (2026-01-26) - Added @supabase/supabase-js, @supabase/ssr
- ~~Create Supabase client utilities~~ - **DONE** - lib/supabase/client.ts, server.ts, middleware.ts
- ~~Add auth middleware for protected routes~~ - **DONE** - middleware.ts with route protection
- ~~Add login/signup pages~~ - **DONE** - (auth)/login, signup, forgot-password
- ~~Configure Supabase Auth~~ - **DONE** - OAuth callback route, session refresh
- ~~Implement saveCalculation() API~~ - **DONE** - lib/supabase/calculations.ts
- ~~Implement getCalculations() API~~ - **DONE**
- ~~Implement getCalculation(id) API~~ - **DONE**
- ~~Implement deleteCalculation(id) API~~ - **DONE**
- ~~Add "Save" button to Step 5 results~~ - **DONE** - SaveCalculationButton component
- ~~Create calculations history page~~ - **DONE** - /calculations with cards
- ~~Load saved calculation into wizard (edit flow)~~ - **DONE** - ?id= query param support
- ~~Apply migrations to DEV and PROD~~ - **DONE** (2026-01-26) - All columns verified

---

## Pending

### Phase 3 - Remaining Items
- [x] Generate shareable links (share calculation with others) - **DONE** (2026-01-29)
- [x] Create shared view page (`/s/[token]`) - **DONE** (2026-01-29)
- [ ] Configure OAuth providers in Supabase Dashboard (Google, Apple)

### Testing
- [ ] Run full test suite for calculation engine
- [ ] Add integration tests for Supabase operations
- [ ] Test auth flow end-to-end

### Phase 4 - Polish & Production
- [ ] Error handling improvements
- [ ] Loading states and skeletons
- [ ] Mobile responsiveness audit
- [ ] Performance optimization
- [ ] Production deployment setup
