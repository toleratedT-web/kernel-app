# Kernel — Product Specification

**Brand:** Kernel — "The kernel of your spending"
**Tagline:** Snap a receipt. AI extracts every line item. One tap to Google Sheets.
**Status:** Pre-MVP (solo-dev, evenings + weekends)

---

## 1. Epics

### Epic 1: Auth & Accounts
Users sign in, manage their profile, and control connected services.

### Epic 2: Phase 1 — Scanner
Core loop: capture receipt → AI extracts line items → review/edit → save → export to sheets.

### Epic 3: Phase 2 — Insights
Dashboard showing where money goes: category breakdowns, trends, top merchants.

### Epic 4: Phase 3 — Niceties
Search, multi-currency, email summaries, UX polish.

### Epic 5: Payments & Subscriptions
Stripe billing, tier enforcement, upgrade/downgrade flows.

### Epic 6: PWA & Deployment
Offline-capable PWA, Vercel deploy, domain, landing page integration.

---

## 2. User Stories

### Epic 1: Auth & Accounts

| ID | Story | Acceptance Criteria |
|----|-------|---------------------|
| AUTH-1 | As a new user, I want to sign up with email/password so I can start scanning receipts. | Supabase Auth sign-up form; email verification optional for MVP; redirect to onboarding or dashboard. |
| AUTH-2 | As a returning user, I want to log in with email/password so I can access my data. | Login form with error states; session persists via cookie/token; "forgot password" flow. |
| AUTH-3 | As a user, I want to connect my Google account so I can export to Google Sheets. | Google OAuth via Supabase; scoped to sheets API; token stored for API calls. |
| AUTH-4 | As a user, I want to disconnect Google Sheets and see my export history. | Settings page shows connected account; revoke button; export log table. |

### Epic 2: Phase 1 — Scanner

| ID | Story | Acceptance Criteria |
|----|-------|---------------------|
| SCAN-1 | As a user, I want to upload a receipt photo from my phone or computer so I can digitise it. | Camera capture via PWA (desktop: file picker for image/PDF); drag-and-drop zone; file size limit (10 MB); preview thumbnail. |
| SCAN-2 | As a user, I want the AI to extract every line item with price, quantity, merchant, and date so I don't have to type. | Upload triggers Gemini 2.5 Flash Lite call; structured JSON returned: date, merchant, items[{name, qty, unit_price, total_price}], tax, grand_total, currency; loading state with progress indicator. |
| SCAN-3 | As a user, I want to correct any AI mistakes in a quick-edit modal before saving. | Modal shows all extracted fields; editable cells for items (name, qty, price); add/remove rows; save discards original and stores edited version. |
| SCAN-4 | As a user, I want to save the receipt to my Kernel account so I can view it later. | Receipt saved to Supabase (receipts + items tables); image uploaded to Supabase storage; redirect to receipt detail/dashboard. |
| SCAN-5 | As a user, I want to append the receipt items to my Google Sheet with one tap so I don't have to copy-paste. | "Export to Sheets" button; OAuth check → if not connected, prompt OAuth flow; appends header row (if new sheet) + item rows; confirmation toast; retry on failure. |
| SCAN-6 | As a user, I want to see a receipt history so I can review past scans. | Paginated list of receipts with date, merchant, total; click to expand items; delete action. |

### Epic 3: Phase 2 — Insights

| ID | Story | Acceptance Criteria |
|----|-------|---------------------|
| INS-1 | As a user, I want to see a monthly spending overview so I can track my habits. | Bar chart (monthly spend); summary cards (total, avg/day, top category); data range selector (current month, last 3 months, custom). |
| INS-2 | As a user, I want to see spending broken down by category so I know where my money goes. | Pie/bar chart by category; backend maps items → categories via keyword matching or manual assignment; category legend with amounts. |
| INS-3 | As a user, I want to see my top merchants so I know who gets the most of my money. | Ranked list of merchants by total spend; click to drill down; optional filter by date range. |
| INS-4 | As a user, I want to see month-over-month changes so I can spot trends. | "You spent X on Y this month — that's +Z% vs last month" comparison cards; green/red indicators. |

### Epic 4: Phase 3 — Niceties

| ID | Story | Acceptance Criteria |
|----|-------|---------------------|
| NICE-1 | As a user, I want to search past receipts by merchant, date range, or amount so I can find specific items. | Search bar with filters (merchant, date from/to, min/max amount, category); results list with match highlights. |
| NICE-2 | As a user, I want receipts in foreign currencies to be converted so I can see everything in my base currency. | Currency field on receipt; exchange rate lookup at time of scan; display in both original and base currency; base currency set in settings. |
| NICE-3 | As a user, I want a monthly email summary so I don't have to log in. | Scheduled email (Resend/SendGrid) with top-line numbers, category breakdown, biggest merchant; unsubscribe link; toggle in settings. |
| NICE-4 | As a user, I want to export my data in bulk so I can analyse it elsewhere. | CSV download of all receipts and items; "export all" button in settings; email large exports. |

### Epic 5: Payments & Subscriptions

| ID | Story | Acceptance Criteria |
|----|-------|---------------------|
| BILL-1 | As a potential customer, I want to see pricing and choose a plan so I can upgrade from free. | Pricing page with tier comparison; "Upgrade" → Stripe Checkout; success redirect to dashboard with new tier active. |
| BILL-2 | As a subscribed user, I want to downgrade or cancel so I'm not overcharged. | Settings shows current plan; "Cancel subscription" → Stripe customer portal; reverts to free at end of billing period. |
| BILL-3 | As Kernel, I want to enforce receipt limits per tier so users are incentivised to upgrade. | Middleware checks receipt count vs tier limit before scan starts; soft warning at 80% usage; blocks at 100% with upgrade CTA. |
| BILL-4 | As a new user, I want a 14-day free trial with all features so I can evaluate before paying. | Trial flag on account; all tiers unlocked; shows trial end date in header; converts to free tier after expiry. |

### Epic 6: PWA & Deployment

| ID | Story | Acceptance Criteria |
|----|-------|---------------------|
| PWA-1 | As a mobile user, I want to install the app on my home screen so I can open it like a native app. | manifest.json with icons, theme colour, display: standalone; service worker caches app shell; install prompt on supported browsers. |
| PWA-2 | As a user, I want the app to work offline so I can scan receipts without signal. | Service worker caches recent receipts; offline indicator banner; queued upload retries on reconnect. |
| DEP-1 | As a developer, I want automated deploys so I can iterate quickly. | GitHub → Vercel auto-deploy; staging branch for testing; preview deployments on PRs. |

---

## 3. MVP Scope

The sole-dev MVP focuses on **Phase 1 (Scanner)** + **Auth** + **basic subscription gating**.

### In scope
- Email/password auth + Google OAuth
- Receipt upload (camera + drag/drop)
- Gemini 2.5 Flash Lite extraction
- Quick-edit modal
- Save receipt + items to Supabase
- Receipt history list
- Google Sheets export (one-tap append)
- 14-day free trial
- Stripe subscriptions (Free / Starter / Pro)
- Receipt count enforcement per tier
- PWA manifest + basic service worker
- Vercel deployment

### Out of scope (post-MVP)
- Insights dashboard (Phase 2)
- Search, multi-currency, email summaries (Phase 3)
- Offline-first sync queue
- Workplace / team accounts
- TWAIN scanner integration
- Bulk CSV export

---

## 4. Phase 1 (Scanner) — Technical Task Breakdown

Implementation order for a solo developer (evenings + weekends):

### Week 1: Foundation

| # | Task | Dependencies | Est. time |
|---|------|-------------|-----------|
| 1.1 | Scaffold Next.js app with Tailwind, project structure (pages, components, lib, types) | None | 2 hrs |
| 1.2 | Set up Supabase project, create schema (profiles, receipts, items, categories tables), write RLS policies, seed test data | 1.1 | 3 hrs |
| 1.3 | Implement Supabase Auth (email/password signup, login, logout, session handling, protected routes) | 1.2 | 3 hrs |
| 1.4 | Google OAuth integration for Sheets scope + token storage | 1.3 | 2 hrs |
| 1.5 | Build basic layout shell (sidebar/nav, header with user menu) | 1.1 | 2 hrs |
| 1.6 | Create receipt list page (history table with fetch, pagination, delete) | 1.2, 1.5 | 3 hrs |

### Week 2: Core Scanner Loop

| # | Task | Dependencies | Est. time |
|---|------|-------------|-----------|
| 2.1 | Build upload UI: camera capture, drag-drop zone, file picker, preview thumbnail, file validation | 1.5 | 4 hrs |
| 2.2 | Implement Gemini 2.5 Flash Lite integration: multipart API call with image, parse structured JSON response, handle errors/timeouts | 1.1 | 4 hrs |
| 2.3 | Build quick-edit modal: populate extracted data, editable line items, add/remove rows, save action | 2.2 | 4 hrs |
| 2.4 | Connect save flow: write receipt + items to Supabase, upload image to storage, redirect to history | 2.3, 1.2 | 3 hrs |
| 2.5 | Build receipt detail page: view receipt image, line items, export controls | 2.4 | 2 hrs |

### Week 3: Sheets Export & Gating

| # | Task | Dependencies | Est. time |
|---|------|-------------|-----------|
| 3.1 | Implement Google Sheets append: create sheet if not exists, write headers, batch append item rows, error handling + retry | 1.4, 2.4 | 5 hrs |
| 3.2 | Add Stripe integration: products/prices in Stripe dashboard, Checkout session, webhook handler, update profile tier | 1.2 | 5 hrs |
| 3.3 | Implement receipt count enforcement: middleware checks monthly count vs tier limit, warning banner, block modal | 3.2, 1.2 | 2 hrs |
| 3.4 | 14-day trial flag on new signups, trial end UI, automatic expiry | 3.2 | 2 hrs |
| 3.5 | Loading states, error boundaries, toast notifications, empty states | All above | 3 hrs |
| 3.6 | PWA manifest, icons, basic service worker for app shell caching | 1.5 | 2 hrs |
| 3.7 | Final integration test: full loop (upload → AI → edit → save → sheets) | All above | 3 hrs |

### Buffer & Polish

| # | Task | Dependencies | Est. time |
|---|------|-------------|-----------|
| 3.8 | Bug fixes, edge cases (blurry receipt fallback, network retry, mobile camera quirks) | All | 4 hrs |
| 3.9 | Copy / help text, onboarding hints | 1.5 | 2 hrs |

**Total Phase 1 effort:** ~56-60 hrs over ~3-4 weeks (evenings + weekends)

---

## 5. MVP Success Criteria

The MVP is ready to ship when all of the following are true:

### Functional
1. A user can sign up, log in, and connect their Google account.
2. A user can upload a receipt (photo or file) and see extracted line items within <10 seconds.
3. A user can correct any extraction errors and save the receipt.
4. A user can append receipt line items to a Google Sheet with one tap.
5. A user can view a paginated history of their receipts.
6. A new user gets a 14-day free trial with all tiers unlocked.
7. Receipt counts are enforced per tier (10 free, 250 starter, unlimited pro).
8. A user can upgrade, downgrade, or cancel a Stripe subscription.
9. The app installs as a PWA on mobile home screen.

### Quality
10. All critical paths have loading states, error handling, and empty states.
11. Camera capture works on iOS Safari and Android Chrome.
12. The app passes Lighthouse PWA audit (score >80).
13. No unhandled promise rejections or console errors in the happy path.

### Business
14. The onboarding flow explains the value prop in <30 seconds.
15. Pricing page clearly shows tier differences.
16. Stripe checkout works end-to-end with test mode.
17. Developer has personally run the full loop (upload → sheets) with 3 test receipts.

### Launch Check
- [ ] Supabase project on Free tier
- [ ] Vercel project linked to GitHub with auto-deploy
- [ ] Custom domain (e.g. kernelreceipts.app) pointed to Vercel
- [ ] Landing page (`recietsnap/index.html`) linked to live app
- [ ] Stripe products/prices created in live mode
- [ ] 5 beta testers recruited (pool workplace contact, Reddit, direct outreach)
- [ ] Analytics (posthog or just vercel analytics) enabled
- [ ] Basic error monitoring (Sentry free tier or vercel error logs)

---

## Appendix: Data Model (MVP)

```sql
-- Core tables for Phase 1

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT,
  display_name TEXT,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  tier TEXT DEFAULT 'free' CHECK (tier IN ('free', 'starter', 'pro')),
  trial_ends_at TIMESTAMPTZ,
  sheets_token JSONB,  -- encrypted Google OAuth token
  base_currency TEXT DEFAULT 'GBP',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) NOT NULL,
  image_url TEXT,  -- Supabase storage path
  merchant TEXT,
  date DATE,
  grand_total DECIMAL(10,2),
  currency TEXT DEFAULT 'GBP',
  tax DECIMAL(10,2),
  raw_ocr JSONB,   -- full Gemini response for audit
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'edited', 'exported')),
  exported_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE receipt_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_id UUID REFERENCES receipts(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  quantity DECIMAL(10,3) DEFAULT 1,
  unit_price DECIMAL(10,2),
  total_price DECIMAL(10,2),
  category TEXT,   -- mapped via keyword matching
  sort_order INT DEFAULT 0
);

CREATE TABLE monthly_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) NOT NULL,
  month TEXT NOT NULL,  -- 'YYYY-MM'
  receipt_count INT DEFAULT 0,
  UNIQUE(user_id, month)
);
```

RLS: All tables have `FOR ALL USING (user_id = auth.uid())` policies. Storage bucket `receipt-images` has RLS for authenticated users only.
