# Kernel — System Architecture

**Brand:** Kernel — "The kernel of your spending"
**Status:** Pre-MVP (solo-dev, evenings + weekends)
**Stack:** Next.js 14 (App Router) + Supabase + Gemini 2.5 Flash Lite + Stripe + Google Sheets API

---

## Table of Contents

1. [Directory / Folder Structure](#1-directory--folder-structure)
2. [Database Schema](#2-database-schema)
3. [API / Route Design](#3-api--route-design)
4. [Component Tree](#4-component-tree)
5. [Data Flow Diagrams](#5-data-flow-diagrams)
6. [Key Technical Decisions](#6-key-technical-decisions)
7. [Open Questions](#7-open-questions)

---

## 1. Directory / Folder Structure

```
kernel/
├── src/
│   ├── app/                          # Next.js App Router pages
│   │   ├── (marketing)/              # Route group — public pages
│   │   │   ├── layout.tsx            # Minimal layout (no sidebar)
│   │   │   ├── page.tsx              # Landing / marketing page
│   │   │   ├── pricing/
│   │   │   │   └── page.tsx          # Pricing + Stripe checkout CTA
│   │   │   ├── privacy/
│   │   │   │   └── page.tsx          # Privacy policy
│   │   │   └── terms/
│   │   │       └── page.tsx          # Terms of service
│   │   │
│   │   ├── (dashboard)/              # Route group — authenticated pages
│   │   │   ├── layout.tsx            # Dashboard layout (sidebar, header, user menu)
│   │   │   ├── page.tsx              # Dashboard home — redirects to /receipts or /insights
│   │   │   ├── scan/
│   │   │   │   └── page.tsx          # Upload + OCR + quick-edit flow
│   │   │   ├── receipts/
│   │   │   │   ├── page.tsx          # Receipt history list (paginated)
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx      # Receipt detail (image, items, export controls)
│   │   │   ├── insights/
│   │   │   │   └── page.tsx          # Spending charts + trends (Phase 2)
│   │   │   └── settings/
│   │   │       └── page.tsx          # Profile, Google Sheets connect, billing
│   │   │
│   │   ├── auth/
│   │   │   ├── login/
│   │   │   │   └── page.tsx          # Login form
│   │   │   ├── signup/
│   │   │   │   └── page.tsx          # Signup form
│   │   │   ├── callback/
│   │   │   │   └── route.ts          # Supabase auth callback handler
│   │   │   └── forgot-password/
│   │   │       └── page.tsx          # Password reset
│   │   │
│   │   ├── api/                      # Next.js API routes (backend logic)
│   │   │   ├── scan/
│   │   │   │   └── route.ts          # POST — upload image → Gemini OCR → return parsed data
│   │   │   ├── receipts/
│   │   │   │   ├── route.ts          # GET (list) / POST (save after edit)
│   │   │   │   └── [id]/
│   │   │   │       ├── route.ts      # GET (detail) / DELETE
│   │   │   │       └── export/
│   │   │   │           └── route.ts  # POST — append items to Google Sheets
│   │   │   ├── sheets/
│   │   │   │   ├── connect/
│   │   │   │   │   └── route.ts      # GET — redirect to Google OAuth
│   │   │   │   └── callback/
│   │   │   │       └── route.ts      # GET — handle OAuth callback, store token
│   │   │   ├── stripe/
│   │   │   │   ├── checkout/
│   │   │   │   │   └── route.ts      # POST — create Stripe Checkout session
│   │   │   │   ├── portal/
│   │   │   │   │   └── route.ts      # POST — create Stripe Customer Portal session
│   │   │   │   └── webhook/
│   │   │   │       └── route.ts      # POST — Stripe webhook (subscription events)
│   │   │   ├── usage/
│   │   │   │   └── route.ts          # GET — current month receipt count + limit
│   │   │   └── user/
│   │   │       └── route.ts          # GET/PATCH profile
│   │   │
│   │   ├── layout.tsx                # Root layout (fonts, metadata, providers)
│   │   ├── not-found.tsx             # 404 page
│   │   └── error.tsx                 # Global error boundary
│   │
│   ├── components/
│   │   ├── ui/                       # Shared / primitives (dumb components)
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Toast.tsx
│   │   │   ├── Spinner.tsx
│   │   │   ├── EmptyState.tsx
│   │   │   ├── Pagination.tsx
│   │   │   ├── Badge.tsx
│   │   │   └── Card.tsx
│   │   │
│   │   ├── layout/                   # Layout components
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Header.tsx
│   │   │   ├── UserMenu.tsx
│   │   │   ├── MobileNav.tsx
│   │   │   └── TrialBanner.tsx
│   │   │
│   │   ├── scan/                     # Scanner feature components
│   │   │   ├── UploadZone.tsx        # Drag-drop + camera + file picker
│   │   │   ├── CameraCapture.tsx     # Mobile camera interface
│   │   │   ├── ScanProgress.tsx      # Loading state during OCR
│   │   │   ├── QuickEditModal.tsx    # Editable line items modal
│   │   │   ├── ReceiptPreview.tsx    # Thumbnail/image preview
│   │   │   └── ExportButton.tsx      # "Export to Sheets" button
│   │   │
│   │   ├── receipts/                 # Receipt list / detail components
│   │   │   ├── ReceiptList.tsx
│   │   │   ├── ReceiptRow.tsx
│   │   │   └── ReceiptDetail.tsx
│   │   │
│   │   ├── insights/                 # Dashboard / insights components (Phase 2)
│   │   │   ├── MonthlyChart.tsx
│   │   │   ├── CategoryBreakdown.tsx
│   │   │   ├── TopMerchants.tsx
│   │   │   └── ComparisonCard.tsx
│   │   │
│   │   ├── auth/                     # Auth components
│   │   │   ├── LoginForm.tsx
│   │   │   ├── SignupForm.tsx
│   │   │   ├── GoogleSheetsConnect.tsx
│   │   │   └── ForgotPasswordForm.tsx
│   │   │
│   │   └── billing/                  # Subscription components
│   │       ├── PricingCards.tsx
│   │       ├── CurrentPlan.tsx
│   │       └── UsageMeter.tsx        # Visual receipt count vs limit
│   │
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts            # Browser Supabase client (singleton)
│   │   │   ├── server.ts            # Server Supabase client (cookies)
│   │   │   ├── admin.ts             # Service-role client (admin operations)
│   │   │   └── middleware.ts        # Supabase auth middleware helper
│   │   │
│   │   ├── gemini/
│   │   │   └── client.ts            # Gemini API client — image → structured JSON
│   │   │
│   │   ├── sheets/
│   │   │   └── client.ts            # Google Sheets API — append rows, create sheet
│   │   │
│   │   ├── stripe/
│   │   │   ├── client.ts            # Stripe server client
│   │   │   └── webhooks.ts          # Webhook signature verification + handlers
│   │   │
│   │   ├── utils/
│   │   │   ├── cn.ts                # clsx + tailwind-merge helper
│   │   │   ├── format.ts            # Currency formatting, date helpers
│   │   │   ├── tier.ts              # Tier limits, checks, trial logic
│   │   │   └── errors.ts            # Error classes, error mapping
│   │   │
│   │   └── validations/
│   │       └── receipt.ts           # Zod schemas for receipt/items validation
│   │
│   ├── hooks/
│   │   ├── useUser.ts               # Auth user + profile hook
│   │   ├── useReceipts.ts           # Receipt CRUD + pagination hook
│   │   ├── useScan.ts               # Upload → OCR state machine hook
│   │   ├── useUsage.ts              # Monthly usage + tier check hook
│   │   ├── useToast.ts              # Toast notification hook
│   │   └── useMediaQuery.ts         # Responsive breakpoint hook
│   │
│   ├── types/
│   │   ├── database.ts              # Supabase DB row types (generated)
│   │   ├── gemini.ts                # Gemini response shape
│   │   ├── sheets.ts                # Google Sheets API types
│   │   └── stripe.ts                # Stripe product/price types
│   │
│   └── middleware.ts                # Next.js middleware (auth check, tier check)
│
├── supabase/
│   ├── migrations/                  # SQL migration files
│   │   ├── 001_profiles.sql
│   │   ├── 002_receipts.sql
│   │   ├── 003_receipt_items.sql
│   │   ├── 004_monthly_usage.sql
│   │   ├── 005_categories.sql
│   │   └── 006_subscriptions.sql
│   ├── seed.sql                     # Test/seeding data
│   └── types.ts                     # Generated Supabase types (via supabase gen types)
│
├── public/
│   ├── icons/                       # PWA icons (192x192, 512x512)
│   ├── manifest.json                # PWA manifest
│   ├── sw.js                        # Service worker (app shell cache)
│   └── og-image.png                 # Social share image
│
├── .env.local                       # Local env vars (gitignored)
├── .env.example                     # Env var template
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── README.md
```

### Rationale for structure

- **`src/` collocation** — keeps app code separate from config files at root. Standard Next.js convention.
- **Route groups `(marketing)` and `(dashboard)`** — clean URL separation without sharing layouts. Marketing pages get a minimal layout; dashboard pages get sidebar + auth.
- **`lib/` split by service** — each external integration (Supabase, Gemini, Sheets, Stripe) is a single file with a clear API. Easy to swap or test.
- **`hooks/`** — encapsulates state + side effects. Keeps components thin.
- **`supabase/` at root** — migrations live alongside app code so schema changes are tracked. Run `supabase migration up` from here.
- **No `services/` layer** — for a solo-dev project, `lib/` files act as services. Adding an abstraction layer is premature.

---

## 2. Database Schema

### Overview

Six tables in the `public` schema. All user data is isolated via RLS.

```
auth.users (Supabase managed)
    │
    └── profiles (1:1, extends auth.users with app fields)
            │
            ├── receipts (1:N — each receipt belongs to one user)
            │       │
            │       └── receipt_items (1:N — line items, cascade delete)
            │
            ├── monthly_usage (1:N per month — usage tracking)
            │
            └── categories (1:N — user-created categories)
```

### Table: `profiles`

Extends `auth.users` with subscription info, preferences, and OAuth token storage.

| Column | Type | Default | Constraints | Notes |
|--------|------|---------|-------------|-------|
| `id` | `UUID` | — | PK, FK → `auth.users(id)` | Same as auth user ID |
| `email` | `TEXT` | — | — | Denormalized from auth for quick queries |
| `display_name` | `TEXT` | — | — | User's display name |
| `stripe_customer_id` | `TEXT` | — | UNIQUE | Stripe customer reference |
| `stripe_subscription_id` | `TEXT` | — | — | Current subscription ID |
| `tier` | `TEXT` | `'free'` | CHECK (`'free'`, `'starter'`, `'pro'`) | Current access tier |
| `trial_ends_at` | `TIMESTAMPTZ` | — | — | NULL if no trial or expired |
| `sheets_token` | `JSONB` | — | — | Encrypted Google OAuth token |
| `sheets_email` | `TEXT` | — | — | Connected Google account email |
| `sheets_sheet_id` | `TEXT` | — | — | Target sheet ID (user picks one) |
| `base_currency` | `TEXT` | `'GBP'` | — | User's home currency |
| `created_at` | `TIMESTAMPTZ` | `now()` | — | — |
| `updated_at` | `TIMESTAMPTZ` | `now()` | — | — |

**RLS Policy:**
```sql
-- Users can read/update their own profile only
CREATE POLICY "Users own their profile"
  ON profiles
  FOR ALL
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Trigger: auto-create profile on signup
-- Handled by Supabase Auth webhook or a trigger function
```

| Action | Policy |
|--------|--------|
| `SELECT` | `id = auth.uid()` |
| `INSERT` | `id = auth.uid()` (via trigger on auth.users insert) |
| `UPDATE` | `id = auth.uid()` |
| `DELETE` | Not allowed (profiles persist) |

### Table: `receipts`

One row per receipt scan. Stores metadata and the raw OCR output.

| Column | Type | Default | Constraints | Notes |
|--------|------|---------|-------------|-------|
| `id` | `UUID` | `gen_random_uuid()` | PK | — |
| `user_id` | `UUID` | — | NOT NULL, FK → `profiles(id)` | Owner |
| `image_url` | `TEXT` | — | — | Supabase Storage path or public URL |
| `image_storage_path` | `TEXT` | — | — | Path in `receipt-images` bucket |
| `merchant` | `TEXT` | — | — | Extracted merchant name |
| `date` | `DATE` | — | — | Receipt date |
| `grand_total` | `DECIMAL(10,2)` | — | — | Total from receipt |
| `currency` | `TEXT` | `'GBP'` | — | ISO 4217 |
| `tax` | `DECIMAL(10,2)` | — | — | Tax amount if detected |
| `raw_ocr` | `JSONB` | — | — | Full Gemini response (for audit/debug) |
| `status` | `TEXT` | `'pending'` | CHECK (`'pending'`, `'edited'`, `'exported'`) | Lifecycle status |
| `exported_at` | `TIMESTAMPTZ` | — | — | When exported to Sheets |
| `created_at` | `TIMESTAMPTZ` | `now()` | — | — |
| `updated_at` | `TIMESTAMPTZ` | `now()` | — | — |

**Indexes:**
- `idx_receipts_user_id` on `user_id`
- `idx_receipts_date` on `date`
- `idx_receipts_merchant` on `merchant`

**RLS Policy:**
```sql
CREATE POLICY "Users own their receipts"
  ON receipts
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
```

### Table: `receipt_items`

Individual line items extracted by Gemini.

| Column | Type | Default | Constraints | Notes |
|--------|------|---------|-------------|-------|
| `id` | `UUID` | `gen_random_uuid()` | PK | — |
| `receipt_id` | `UUID` | — | NOT NULL, FK → `receipts(id)` ON DELETE CASCADE | Parent receipt |
| `name` | `TEXT` | — | NOT NULL | Item description |
| `quantity` | `DECIMAL(10,3)` | `1` | — | Qty (supports decimals for weight) |
| `unit_price` | `DECIMAL(10,2)` | — | — | Price per unit |
| `total_price` | `DECIMAL(10,2)` | — | — | line total (qty × unit_price) |
| `category` | `TEXT` | — | — | Mapped via keyword or manual |
| `sort_order` | `INT` | `0` | — | Display order on receipt |

**Indexes:**
- `idx_items_receipt_id` on `receipt_id`

**RLS Policy:**
```sql
CREATE POLICY "Users own their items"
  ON receipt_items
  FOR ALL
  USING (
    receipt_id IN (
      SELECT id FROM receipts WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    receipt_id IN (
      SELECT id FROM receipts WHERE user_id = auth.uid()
    )
  );
```

### Table: `monthly_usage`

Tracks receipt count per user per month for tier enforcement.

| Column | Type | Default | Constraints | Notes |
|--------|------|---------|-------------|-------|
| `id` | `UUID` | `gen_random_uuid()` | PK | — |
| `user_id` | `UUID` | — | NOT NULL, FK → `profiles(id)` | — |
| `month` | `TEXT` | — | NOT NULL | Format: `'YYYY-MM'` |
| `receipt_count` | `INT` | `0` | — | Incremented on receipt create |
| `created_at` | `TIMESTAMPTZ` | `now()` | — | — |
| `updated_at` | `TIMESTAMPTZ` | `now()` | — | — |

**Constraints:** `UNIQUE(user_id, month)` — one row per user per month.

**RLS Policy:**
```sql
CREATE POLICY "Users own their usage"
  ON monthly_usage
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
```

### Table: `categories`

Predefined + user-created categories for item classification.

| Column | Type | Default | Constraints | Notes |
|--------|------|---------|-------------|-------|
| `id` | `UUID` | `gen_random_uuid()` | PK | — |
| `user_id` | `UUID` | — | FK → `profiles(id)` | NULL for system categories |
| `name` | `TEXT` | — | NOT NULL | Display name |
| `color` | `TEXT` | — | — | Hex colour for charts |
| `keywords` | `TEXT[]` | — | — | Keywords for auto-mapping |
| `is_system` | `BOOLEAN` | `false` | — | Predefined (cannot delete) |
| `created_at` | `TIMESTAMPTZ` | `now()` | — | — |

**Seed data (system categories):** Food & Drink, Transport, Shopping, Utilities, Entertainment, Health, Housing, Income, Other.

**RLS Policy:**
```sql
-- Users see system categories + their own
CREATE POLICY "Users view system + own categories"
  ON categories
  FOR SELECT
  USING (user_id IS NULL OR user_id = auth.uid());

CREATE POLICY "Users manage own categories"
  ON categories
  FOR INSERT
  WITH CHECK (user_id = auth.uid() AND is_system = false);

CREATE POLICY "Users update own categories"
  ON categories
  FOR UPDATE
  USING (user_id = auth.uid() AND is_system = false)
  WITH CHECK (user_id = auth.uid() AND is_system = false);

CREATE POLICY "Users delete own categories"
  ON categories
  FOR DELETE
  USING (user_id = auth.uid() AND is_system = false);
```

### Storage: `receipt-images` bucket

- **Bucket name:** `receipt-images`
- **Public access:** No (serve via signed URLs or Supabase client)
- **RLS:**
  ```sql
  -- Authenticated users can read their own images
  CREATE POLICY "Users read own images"
    ON storage.objects
    FOR SELECT
    USING (
      bucket_id = 'receipt-images' AND
      auth.role() = 'authenticated' AND
      (storage.foldername(name))[1] = auth.uid()::text
    );

  -- Authenticated users can upload to their folder
  CREATE POLICY "Users upload own images"
    ON storage.objects
    FOR INSERT
    WITH CHECK (
      bucket_id = 'receipt-images' AND
      auth.role() = 'authenticated' AND
      (storage.foldername(name))[1] = auth.uid()::text
    );
  ```

### Tier Limits (reference table — enforced in app logic + DB)

| Tier | Monthly Receipt Limit | Insights | Sheet Export | Trial Access |
|------|----------------------|----------|--------------|--------------|
| `free` | 10 | No | Yes | — |
| `starter` | 250 | Yes | Yes | — |
| `pro` | 999999 (unlimited) | Yes | Yes | — |
| `trial` | 999999 (all features) | Yes | Yes | 14 days |

**Enforcement strategy:**
1. **Frontend:** `useUsage` hook shows usage meter + blocks upload at 100%.
2. **API:** `POST /api/scan` increments count, rejects if over limit before calling Gemini (save the API cost).
3. **DB:** `monthly_usage` row is upserted atomically. If count exceeds tier limit, the insert/update is rejected (application-level check, not a DB constraint — tier can change mid-month).

---

## 3. API / Route Design

### 3.1 Frontend Routes (Next.js App Router)

| Path | Method | Page | Auth Required | Notes |
|------|--------|------|---------------|-------|
| `/` | — | Marketing landing | No | Hero, features, CTA |
| `/pricing` | — | Pricing page | No | Toggle monthly/yearly, upgrade CTA |
| `/privacy` | — | Privacy | No | Static |
| `/terms` | — | Terms | No | Static |
| `/auth/login` | — | Login form | No | Redirects to `/` if logged in |
| `/auth/signup` | — | Signup form | No | Redirects to `/` if logged in |
| `/auth/callback` | — | Auth callback | No | Supabase handles token exchange |
| `/auth/forgot-password` | — | Password reset form | No | — |
| `/` (dashboard) | — | Dashboard | Yes | Redirects to `/receipts` |
| `/scan` | — | Scanner page | Yes | Upload → OCR → edit → save flow |
| `/receipts` | — | Receipt history | Yes | Paginated list |
| `/receipts/[id]` | — | Receipt detail | Yes | Image, items, export, delete |
| `/insights` | — | Spending insights | Yes (Starter+) | Phase 2; gated by tier |
| `/settings` | — | Settings | Yes | Profile, sheets, billing, cancel |

### 3.2 API Routes (Next.js — `src/app/api/`)

| Endpoint | Method | Purpose | Auth | Request | Response |
|----------|--------|---------|------|---------|----------|
| `/api/scan` | `POST` | Upload image → Gemini OCR → return parsed data | Required | `FormData` with `image` (File) | `{ items: [...], merchant, date, total, ... }` or `{ error }` |
| `/api/receipts` | `GET` | List user's receipts | Required | Query: `page`, `per_page`, `search`, `merchant`, `date_from`, `date_to` | `{ receipts: [...], total, page, per_page }` |
| `/api/receipts` | `POST` | Save a receipt (after quick-edit) | Required | JSON body with receipt + items | `{ id, ...receipt }` |
| `/api/receipts/[id]` | `GET` | Get single receipt with items | Required | — | `{ ...receipt, items: [...] }` |
| `/api/receipts/[id]` | `DELETE` | Delete receipt + image | Required | — | `{ success: true }` |
| `/api/receipts/[id]/export` | `POST` | Append items to Google Sheets | Required | — | `{ success: true, sheetUrl }` or `{ error }` |
| `/api/sheets/connect` | `GET` | Redirect to Google OAuth | Required | — | 302 redirect |
| `/api/sheets/callback` | `GET` | Handle OAuth response | Required | Query: `code`, `state` | 302 redirect to `/settings` |
| `/api/usage` | `GET` | Current month usage + tier info | Required | — | `{ count, limit, tier, trial_ends_at }` |
| `/api/user` | `GET` | Get profile | Required | — | `{ ...profile }` |
| `/api/user` | `PATCH` | Update profile | Required | JSON body | `{ ...updatedProfile }` |
| `/api/stripe/checkout` | `POST` | Create Stripe Checkout session | Required | `{ price_id, mode }` | `{ url: "https://..." }` |
| `/api/stripe/portal` | `POST` | Create Stripe Customer Portal | Required | — | `{ url: "https://..." }` |
| `/api/stripe/webhook` | `POST` | Stripe event webhook | Stripe signature | Raw body + `stripe-signature` header | `{ received: true }` |

### 3.3 External API Integrations

#### Gemini 2.5 Flash Lite (OCR)

```
POST https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite-001:generateContent?key=${GEMINI_API_KEY}

Request:
{
  "contents": [{
    "parts": [
      { "inline_data": { "mime_type": "image/jpeg", "data": "<base64>" } },
      { "text": "Extract all line items from this receipt. Return JSON with:
        date (YYYY-MM-DD),
        merchant,
        items[{name, quantity, unit_price, total_price}],
        tax,
        grand_total,
        currency (ISO 4217).
        If uncertain, use null. Do not include markdown formatting." }
    ]
  }]
}

Response:
{
  "candidates": [{
    "content": {
      "parts": [{ "text": "{\"merchant\":\"...\", ...}" }]
    }
  }]
}
```

**Error handling:**
- Timeout → retry once after 3s
- Malformed JSON → return raw text + flag for manual review
- Empty response → error "Could not read receipt. Try a clearer photo."

#### Google Sheets API (Append rows)

```
POST https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${range}:append?valueInputOption=USER_ENTERED

Authorization: Bearer ${sheets_token.access_token}

Request:
{
  "values": [
    ["Date", "Merchant", "Item", "Quantity", "Unit Price", "Total", "Category", "Currency"],
    ["2026-06-04", "Tesco", "Milk", 1, 1.50, 1.50, "Food & Drink", "GBP"],
    ...
  ]
}
```

**Flow:**
1. Check if "Kernel" sheet tab exists. If not, create it with headers.
2. Append rows in batches of 10 (stay under rate limits).
3. Return sheet URL for confirmation link.

#### Stripe API

| Operation | Endpoint | Notes |
|-----------|----------|-------|
| Create Checkout | `POST /v1/checkout/sessions` | `mode: "subscription"`, `line_items: [{price: "...", quantity: 1}]` |
| Customer Portal | `POST /v1/billing_portal/sessions` | Returns URL for managing subscription |
| Webhook events | `checkout.session.completed`, `invoice.paid`, `customer.subscription.updated`, `customer.subscription.deleted` | Updates `profiles.tier` and `stripe_subscription_id` |

---

## 4. Component Tree

### 4.1 Layout Components

```
RootLayout
├── AuthProvider (context — user session + profile)
│   ├── MarketingLayout            → /, /pricing, /privacy, /terms
│   │   └── Header (minimal, no auth)
│   │       └── NavLinks, AuthButtons
│   │
│   └── DashboardLayout            → /receipts, /scan, /insights, /settings
│       ├── Sidebar (desktop)
│       │   ├── Logo
│       │   ├── NavItem (Scan, Receipts, Insights, Settings)
│       │   └── UpgradeCTA (if free tier)
│       ├── Header
│       │   ├── Breadcrumb
│       │   ├── UsageMeter (receipt count)
│       │   ├── TrialBanner (if on trial)
│       │   └── UserMenu
│       │       ├── Profile link
│       │       ├── Settings link
│       │       └── Logout
│       └── MobileNav (bottom nav bar on mobile)
│           └── [Scan] [Receipts] [Insights] [Settings]
```

### 4.2 Page Compositions

```
/scan (ScanPage)
├── UploadZone
│   ├── DragDropTarget
│   ├── FilePickerButton
│   └── CameraCapture (mobile)
├── ScanProgress (loading state)
│   ├── Spinner
│   └── "Analysing receipt..." text
├── QuickEditModal (shown after OCR)
│   ├── ReceiptPreview (thumbnail)
│   ├── ItemsTable (editable rows)
│   │   └── ItemRow (name, qty, unit_price, total_price)
│   ├── AddItemButton
│   ├── MerchantInput
│   ├── DateInput
│   ├── TotalInput
│   └── ActionBar
│       ├── CancelButton
│       └── SaveButton → redirects to /receipts/[id]

/receipts (ReceiptListPage)
├── SearchBar + Filters
├── ReceiptList
│   └── ReceiptRow (per item)
│       ├── Date, Merchant, Total, Status badge
│       └── Click → /receipts/[id]
└── Pagination

/receipts/[id] (ReceiptDetailPage)
├── ReceiptImage (full-size preview)
├── ReceiptMeta (merchant, date, total, currency)
├── ItemsTable (read-only)
├── ActionButtons
│   ├── ExportButton ("Export to Sheets")
│   ├── EditButton (re-open quick-edit)
│   └── DeleteButton (with confirm)
└── Toast (success/error feedback)

/insights (InsightsPage) — Phase 2
├── DateRangeSelector
├── SummaryCards (total, avg/day, top category)
├── MonthlyChart (bar chart)
├── CategoryBreakdown (pie/bar chart)
└── TopMerchants (ranked list)

/settings (SettingsPage)
├── ProfileSection (name, email, base currency)
├── SheetsSection
│   ├── ConnectButton / DisconnectButton
│   └── ConnectedAccount (email, sheet name)
├── BillingSection
│   ├── CurrentPlan (current tier, price)
│   ├── UsageMeter (receipt count)
│   ├── UpgradeButton / ManageSubscription
│   └── CancelButton
└── DangerZone (delete account)
```

### 4.3 Shared UI Components

```
ui/
├── Button          — variants: primary, secondary, ghost, danger; sizes: sm, md, lg
├── Input           — with label, error state, icon slot
├── Modal           — overlay, close on Esc, click outside to close
├── Toast           — success/error/info, auto-dismiss, stackable
├── Spinner         — loading indicator, optional label
├── EmptyState      — icon + title + description + optional CTA button
├── Pagination      — prev/next + page numbers
├── Badge           — status indicator (pending/edited/exported)
└── Card            — container with optional header/footer
```

### 4.4 Key Props / States

Every data-fetching component follows this pattern:

```tsx
// Example: ReceiptList
type ReceiptListProps = {
  receipts: Receipt[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  emptyMessage?: string;
};
```

**State matrix for critical flows:**

| Component | Loading | Empty | Error | Success |
|-----------|---------|-------|-------|---------|
| `ReceiptList` | Skeleton rows | EmptyState "No receipts yet. Scan your first one!" | Error banner + Retry button | Data rows |
| `UploadZone` | Uploading progress bar | Drag/drop prompt | "File too large" / "Invalid format" | Preview thumbnail |
| `ScanProgress` | Spinner + "Analysing..." | N/A | "Could not read receipt" + retry | QuickEditModal opens |
| `ExportButton` | "Exporting..." spinner | N/A | Error toast "Sheets API error" | Success toast + link |

---

## 5. Data Flow Diagrams

### 5.1 Receipt Upload → OCR → Save Flow

```
User                     Browser                     Next.js API           Gemini API          Supabase
 │                         │                            │                     │                  │
 │  Navigate to /scan      │                            │                     │                  │
 │────────────────────────>│                            │                     │                  │
 │                         │                            │                     │                  │
 │  Upload image           │                            │                     │                  │
 │  (camera/drag/pick)     │                            │                     │                  │
 │────────────────────────>│                            │                     │                  │
 │                         │  POST /api/scan            │                     │                  │
 │                         │  (FormData: image)         │                     │                  │
 │                         │───────────────────────────>│                     │                  │
 │                         │                            │                     │                  │
 │                         │                            │  ┌─ Check tier limit (query monthly_usage) ──>│
 │                         │                            │  │  If over limit → return 403 + upgrade_url  │
 │                         │                            │  │                    │                     │
 │                         │                            │  └─ If OK, continue  │                     │
 │                         │                            │                     │                  │
 │                         │                            │  Convert image to    │                  │
 │                         │                            │  base64              │                  │
 │                         │                            │  POST generative     │                  │
 │                         │                            │  API                 │                  │
 │                         │                            │─────────────────────>│                  │
 │                         │                            │                     │                  │
 │                         │                            │  Structured JSON     │                  │
 │                         │                            │  (merchant, items,   │                  │
 │                         │                            │   total, date, ...)  │                  │
 │                         │                            │<─────────────────────│                  │
 │                         │                            │                     │                  │
 │                         │  Return parsed data        │                     │                  │
 │                         │<───────────────────────────│                     │                  │
 │                         │                            │                     │                  │
 │  Show QuickEditModal    │                            │                     │                  │
 │  with extracted data    │                            │                     │                  │
 │<────────────────────────│                            │                     │                  │
 │                         │                            │                     │                  │
 │  User edits mistakes    │                            │                     │                  │
 │  (if any) + clicks Save │                            │                     │                  │
 │────────────────────────>│                            │                     │                  │
 │                         │  POST /api/receipts         │                     │                  │
 │                         │  (receipt data + items)    │                     │                  │
 │                         │───────────────────────────>│                     │                  │
 │                         │                            │                     │                  │
 │                         │                            │  Upload image to    │                  │
 │                         │                            │  storage            │                  │
 │                         │                            │─────────────────────────────────────>│
 │                         │                            │                     │                  │
 │                         │                            │  INSERT receipt     │                  │
 │                         │                            │  + items            │                  │
 │                         │                            │─────────────────────────────────────>│
 │                         │                            │                     │                  │
 │                         │                            │  UPSERT monthly_    │                  │
 │                         │                            │  usage (increment   │                  │
 │                         │                            │  receipt_count)     │                  │
 │                         │                            │─────────────────────────────────────>│
 │                         │                            │                     │                  │
 │                         │  Return receipt ID + URL   │                     │                  │
 │                         │<───────────────────────────│                     │                  │
 │                         │                            │                     │                  │
 │  Redirect to            │                            │                     │                  │
 │  /receipts/[id]         │                            │                     │                  │
 │<────────────────────────│                            │                     │                  │
 │                         │                            │                     │                  │
```

### 5.2 Google Sheets Export Flow

```
User                     Browser                     Next.js API            Google Sheets API     Supabase
 │                         │                            │                     │                    │
 │  Click "Export to       │                            │                     │                    │
 │  Sheets" on receipt     │                            │                     │                    │
 │────────────────────────>│                            │                     │                    │
 │                         │                            │                     │                    │
 │                         │  Check: is Google          │                     │                    │
 │                         │  Sheets connected?         │                     │                    │
 │                         │  │                         │                     │                    │
 │                         │  ├─ No → Redirect to       │                     │                    │
 │                         │  │    /api/sheets/connect  │                     │                    │
 │                         │  │    (Google OAuth flow)  │                     │                    │
 │                         │  │    After auth → back    │                     │                    │
 │                         │  │    to this receipt      │                     │                    │
 │                         │  │                         │                     │                    │
 │                         │  └─ Yes → Continue         │                     │                    │
 │                         │                            │                     │                    │
 │                         │  POST /api/receipts/       │                     │                    │
 │                         │  [id]/export               │                     │                    │
 │                         │───────────────────────────>│                     │                    │
 │                         │                            │                     │                    │
 │                         │                            │  Fetch receipt +    │                    │
 │                         │                            │  items from DB      │                    │
 │                         │                            │────────────────────────────────────>│
 │                         │                            │                     │                    │
 │                         │                            │  GET sheets_token   │                    │
 │                         │                            │  from profile       │                    │
 │                         │                            │<────────────────────────────────────│
 │                         │                            │                     │                    │
 │                         │                            │  Check if "Kernel"  │                    │
 │                         │                            │  sheet exists       │                    │
 │                         │                            │─────────────────────>│                    │
 │                         │                            │                     │                    │
 │                         │                            │  If not: create     │                    │
 │                         │                            │  sheet + headers    │                    │
 │                         │                            │─────────────────────>│                    │
 │                         │                            │                     │                    │
 │                         │                            │  Append item rows   │                    │
 │                         │                            │  (batch of 10)      │                    │
 │                         │                            │─────────────────────>│                    │
 │                         │                            │                     │                    │
 │                         │                            │  Update receipt     │                    │
 │                         │                            │  status = 'exported'│                    │
 │                         │                            │  + exported_at      │                    │
 │                         │                            │────────────────────────────────────>│
 │                         │                            │                     │                    │
 │                         │  Return { success,         │                     │                    │
 │                         │  sheetUrl }                │                     │                    │
 │                         │<───────────────────────────│                     │                    │
 │                         │                            │                     │                    │
 │  Show success toast     │                            │                     │                    │
 │  + "Open Sheet" link    │                            │                     │                    │
 │<────────────────────────│                            │                     │                    │
```

### 5.3 Auth Flow

```
User                     Browser                     Supabase Auth          Next.js Middleware
 │                         │                            │                     │
 │  Click "Sign Up"        │                            │                     │
 │────────────────────────>│                            │                     │
 │                         │                            │                     │
 │  Fill email + password  │                            │                     │
 │────────────────────────>│                            │                     │
 │                         │  supabase.auth.signUp()    │                     │
 │                         │───────────────────────────>│                     │
 │                         │                            │                     │
 │                         │  User created + session    │                     │
 │                         │  (email verification off   │                     │
 │                         │   for MVP)                 │                     │
 │                         │<───────────────────────────│                     │
 │                         │                            │                     │
 │                         │  Trigger: auto-create      │                     │
 │                         │  profile row (DB trigger)  │                     │
 │                         │                            │                     │
 │  Redirect to /scan      │                            │                     │
 │<────────────────────────│                            │                     │
 │                         │                            │                     │
 │  ─── On subsequent requests ───                      │                     │
 │                         │                            │                     │
 │  Request /receipts      │                            │                     │
 │────────────────────────>│                            │                     │
 │                         │                            │  middleware.ts:     │
 │                         │                            │  reads session      │
 │                         │                            │  from cookies       │
 │                         │                            │  No session →       │
 │                         │                            │  redirect /auth/    │
 │                         │                            │  login               │
 │                         │                            │                     │
 │                         │  Has session cookie        │                     │
 │                         │──────────────────────────────────────────────>│
 │                         │                            │                     │  Allow
 │                         │<──────────────────────────────────────────────│
 │                         │                            │                     │
 │  Render page            │                            │                     │
 │<────────────────────────│                            │                     │
```

**Google OAuth (for Sheets):**

```
User                     Browser                     Next.js API          Google OAuth
 │                         │                            │                    │
 │  Click "Connect         │                            │                    │
 │  Google Sheets"         │                            │                    │
 │────────────────────────>│                            │                    │
 │                         │  GET /api/sheets/connect   │                    │
 │                         │───────────────────────────>│                    │
 │                         │                            │                    │
 │                         │                            │  Redirect to Google│
 │                         │                            │  OAuth URL         │
 │                         │                            │  (scopes: sheets,  │
 │                         │                            │   userinfo.email)  │
 │                         │<───────────────────────────│                    │
 │                         │                            │                    │
 │  Redirect to Google     │                            │                    │
 │─────────────────────────────────────────────────────────────────────────>│
 │                         │                            │                    │
 │  User authorizes        │                            │                    │
 │<─────────────────────────────────────────────────────────────────────────│
 │                         │                            │                    │
 │  Callback to            │                            │                    │
 │  /api/sheets/callback   │                            │                    │
 │  (with code)            │                            │                    │
 │────────────────────────>│                            │                    │
 │                         │  GET /api/sheets/callback  │                    │
 │                         │───────────────────────────>│                    │
 │                         │                            │                    │
 │                         │                            │  Exchange code     │
 │                         │                            │  for tokens        │
 │                         │                            │────────────────────>│
 │                         │                            │                    │
 │                         │                            │  Store tokens in   │
 │                         │                            │  profile.sheets_   │
 │                         │                            │  token (encrypted) │
 │                         │                            │                    │
 │  Redirect to /settings  │                            │                    │
 │<────────────────────────│                            │                    │
```

### 5.4 Payment / Subscription Flow

```
User                     Browser                     Next.js API          Stripe              Supabase
 │                         │                            │                    │                   │
 │  Click "Upgrade to      │                            │                    │                   │
 │  Starter ($5/mo)"       │                            │                    │                   │
 │────────────────────────>│                            │                    │                   │
 │                         │                            │                    │                   │
 │                         │  POST /api/stripe/         │                    │                   │
 │                         │  checkout                  │                    │                   │
 │                         │  { price_id: "price_...",  │                    │                   │
 │                         │    mode: "subscription" }  │                    │                   │
 │                         │───────────────────────────>│                    │                   │
 │                         │                            │                    │                   │
 │                         │                            │  stripe.checkout   │                   │
 │                         │                            │  .sessions.create() │                   │
 │                         │                            │───────────────────>│                   │
 │                         │                            │                    │                   │
 │                         │                            │  Return session    │                   │
 │                         │                            │  URL               │                   │
 │                         │                            │<───────────────────│                   │
 │                         │                            │                    │                   │
 │                         │  Return { url }            │                    │                   │
 │                         │<───────────────────────────│                    │                   │
 │                         │                            │                    │                   │
 │  Redirect to Stripe     │                            │                    │                   │
 │  Checkout               │                            │                    │                   │
 │─────────────────────────────────────────────────────────────────────────>│                   │
 │                         │                            │                    │                   │
 │  User enters card       │                            │                    │                   │
 │  and completes payment  │                            │                    │                   │
 │<─────────────────────────────────────────────────────────────────────────│                   │
 │                         │                            │                    │                   │
 │  Stripe redirects to    │                            │                    │                   │
 │  {success_url}          │                            │                    │                   │
 │────────────────────────>│                            │                    │                   │
 │                         │                            │                    │                   │
 │  ─── Webhook (async) ───                            │                    │                   │
 │                         │                            │                    │                   │
 │                         │                            │  POST /api/stripe/ │                   │
 │                         │                            │  webhook           │                   │
 │                         │                            │  (checkout.session │                   │
 │                         │                            │   .completed)      │                   │
 │                         │                            │<───────────────────│                   │
 │                         │                            │                    │                   │
 │                         │                            │  Verify signature  │                   │
 │                         │                            │                    │                   │
 │                         │                            │  UPDATE profiles   │                   │
 │                         │                            │  SET tier =        │                   │
 │                         │                            │  'starter'         │                   │
 │                         │                            │────────────────────────────────>│
 │                         │                            │                    │                   │
 │                         │                            │  Return 200 OK     │                   │
 │                         │                            │───────────────────>│                   │
 │                         │                            │                    │                   │
 │  Dashboard shows        │                            │                    │                   │
 │  new tier + receipt     │                            │                    │                   │
 │  limit updated          │                            │                    │                   │
 │                         │                            │                    │                   │
```

**Webhook events handled:**

| Event | Action |
|-------|--------|
| `checkout.session.completed` | Set `tier = mapped from price_id`, `stripe_customer_id`, `stripe_subscription_id`. Clear trial. |
| `invoice.paid` | Refresh subscription status (re-activate if was past_due). |
| `customer.subscription.updated` | Handle upgrades/downgrades (update `tier`). |
| `customer.subscription.deleted` | Revert to `tier = 'free'` at period end. |

---

## 6. Key Technical Decisions

### 6.1 Why Next.js App Router

| Factor | Decision | Rationale |
|--------|----------|-----------|
| Routing | App Router (`src/app/`) | Standard for new Next.js 14+ projects. Nested layouts, loading states, error boundaries built-in. |
| API layer | Route handlers (`route.ts`) | Co-locates backend logic with frontend. No separate Express server. One deploy target. |
| Rendering | Mostly client-side (CSR) with some server components | Receipt scanning is interactive (camera, drag-drop, real-time edits). Dashboard could be server-rendered later for SEO. |
| Data fetching | Supabase client in `useUser` / `useReceipts` hooks | Simple pattern for a solo dev. React Server Components can be adopted incrementally later. |

**Trade-off acknowledged:** Next.js App Router has a learning curve. For a solo dev, the benefit of having API routes co-located and auto-deploying on Vercel outweighs the complexity.

### 6.2 Why Supabase over Firebase

| Concern | Supabase | Firebase | Verdict |
|---------|----------|----------|---------|
| Data model | Postgres (relational) | Firestore (NoSQL document) | Receipts → items → categories is relational. Postgres wins. |
| Pricing | Free tier generous. Pro $25/mo flat. | Per-operation billing. Can spike unpredictably. | Supabase predictable |
| Storage | S3-compatible, RLS policies | Cloud Storage (requires CC since Feb 2026) | Supabase simpler for MVP |
| Auth | Built-in, supports email + Google OAuth | Built-in | Comparable |
| Lock-in | Self-hostable, standard Postgres | Proprietary NoSQL, vendor-locked | Supabase lower risk |
| Type generation | `supabase gen types` → TypeScript types | No equivalent | Supabase better DX |

**Verdict:** Supabase is the right choice for a relational receipt data model with predictable solo-dev costs.

### 6.3 Gemini Model Choice

| Model | Cost per receipt | Speed | Accuracy | Verdict |
|-------|-----------------|-------|----------|---------|
| Gemini 1.5 Flash | ~$0.00005 | Fast | Good | Original plan |
| Gemini 2.0 Flash | ~$0.0001 | Fast | Better | Good enough |
| **Gemini 2.5 Flash Lite** | **~$0.0002** | **Fast** | **Best of Flash family** | **Chosen** |
| Gemini 2.5 Pro | ~$0.001+ | Slower | Best | Overkill for MVP |
| Claude 3 Haiku | ~$0.0005 | Fast | Good | Fallback if Gemini fails |

**Decision:** Gemini 2.5 Flash Lite. Cheapest in the 2.5 family, purpose-built for vision tasks, sub-cent per receipt. If accuracy on blurry receipts is poor, swap prompt or fall back to Claude Haiku.

**Prompt engineering strategy:**
- Single-turn: send image + structured JSON prompt
- Few-shot: include 1-2 examples in system prompt for edge cases (multi-currency, handwritten totals)
- Post-processing: clamp numeric fields, validate date format, normalise currency codes

### 6.4 PWA Strategy

| Feature | Approach | Notes |
|---------|----------|-------|
| Manifest | `public/manifest.json` | Icons, theme_color, display: standalone |
| Service worker | Custom `sw.js` (not Workbox) | Cache app shell + Supabase session. No complex caching for MVP. |
| Camera access | `<input type="file" accept="image/*" capture="environment">` | Works on mobile Safari and Chrome. |
| Offline | Basic app shell cache. No offline OCR. | Offline queueing is post-MVP. For MVP, show "No connection" banner. |
| Install prompt | Chrome `beforeinstallprompt` event listener | No custom install banner for MVP. |

**Decision:** Keep PWA lightweight. App shell caching only. The core flow (upload → OCR → save) requires network anyway, so aggressive offline support adds complexity for marginal gain in MVP.

### 6.5 State Management

| Concern | Approach | Why |
|---------|----------|-----|
| Auth state | React Context (`AuthProvider`) | Single global concern. Supabase client handles session refresh. |
| Server data | Custom hooks (`useReceipts`, `useUsage`) with `fetch` | No need for React Query / SWR in MVP. Hooks encapsulate loading/error/data states. Add SWR later if caching needs grow. |
| Scan flow | Local component state + `useScan` hook | The upload → OCR → edit → save flow is local to `/scan`. Doesn't need global state. |
| Toast notifications | React Context (`ToastProvider`) | Simple context + reducer. ~20 lines of code. |
| Form state | Local `useState` | Quick-edit modal has one form. No form library needed. |

**Anti-patterns to avoid:**
- ❌ Redux / Zustand for MVP. Global state is auth-only.
- ❌ React Query for 3 API calls. Custom hooks are simpler.
- ✅ Add Zustand only if cross-component state sharing becomes painful (e.g., filter state shared between sidebar and receipt list).

### 6.6 Other Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Styling | Tailwind CSS | Already in project plan. Fast iteration, small bundle. |
| Forms | Native `<form>` + Zod validation | No Formik/React Hook Form for MVP. One form (quick-edit) doesn't justify a library. |
| Charts (Phase 2) | Recharts | React-native, simple API, tree-shakeable. |
| Email (Phase 3) | Resend | Free tier (100 emails/day). Simple API. |
| Analytics | Vercel Analytics (free) | Zero config. PostHog self-host if need more detail. |
| Error monitoring | Sentry (free tier) | Breadcrumbs for critical flows. |
| Testing | Manual for MVP | No unit tests. Focus on building. Add Playwright for 3 critical paths post-MVP. |

---

## 7. Open Questions for the Project Manager

These need decisions before development starts:

### 7.1 Auth & Onboarding

1. **Email verification required for MVP?** — The plan says "optional for MVP". If skipped, users get instant access but we lose email contact for re-engagement. Recommend: skip for MVP, add later.

2. **Google OAuth scope for Sheets** — Are we requesting `https://www.googleapis.com/auth/spreadsheets` (read/write) or just append-only? Append-only is safer but limits future features (user might want to edit in-app).

3. **Sheets template** — Let the user pick any existing sheet, or auto-create a "Kernel Export" sheet in their drive? Auto-create is simpler for MVP.

### 7.2 Scanning & OCR

4. **Supported file types at launch** — JPG/PNG only? Or PDF too? PDF requires PDF parsing (pdf.js or similar). Recommend: images only for MVP, PDF in Phase 2.

5. **Image storage retention** — How long should we keep receipt images? Indefinitely? Deleting after 30/90 days saves storage costs. Recommend: keep indefinitely for audit trail, delete only on user account deletion.

6. **Gemini fallback threshold** — At what confidence level should we prompt the user to retake the photo vs. showing the quick-edit modal? This needs experimentation with real receipts.

### 7.3 Payments

7. **Trial duration** — Plan says 14 days free (no card). OK for MVP, but should we require a card to start the trial (standard SaaS pattern to capture upgrade path)?

8. **Yearly pricing** — The plan lists yearly discounts ($45/yr vs $60/yr for Starter). Should we launch with monthly only for MVP simplicity? Yearly adds Stripe complexity (invoice schedules, prorations).

9. **Stripe test vs live mode during dev** — Use test mode keys until launch day. Confirm the product/prices setup in Stripe dashboard before we build the checkout flow.

### 7.4 Engineering

10. **TypeScript strictness** — Recommend strict mode from the start. Saves refactoring pain later.

11. **Supabase local vs cloud dev** — Should we use `supabase start` (local Docker) or point to a dev project on Supabase cloud? Cloud is simpler for a solo dev (no Docker). But local is faster iteration. Recommend: cloud dev project for MVP, local only if Docker is already set up.

12. **Environment branches** — `main` auto-deploys to production. Do we need a `staging` branch + Vercel preview deployment? Yes, for testing the full Stripe loop before merging to prod.

13. **Landing page migration** — The existing landing page (`recietsnap/index.html`) is standalone HTML. Should it remain separate or be folded into the Next.js marketing routes? Recommend: fold into Next.js so there's one domain, one deploy. But can keep as-is for immediate launch.

### 7.5 MVP Scope

14. **Phase 2 insights dashboard** — Should we build the bare minimum (summary numbers, no charts) in the MVP, or wait until Phase 2? Recommendation: add a simple monthly total card in MVP (easy win), full charts in Phase 2.

15. **Receipt search** — The MVP has paginated list. Should we add basic text search (by merchant) before launch? Recommend: yes — it's a simple SQL `ILIKE` query, adds disproportionate value.

---

## Architecture Diagram (Text Overview)

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Vercel (Hosting)                             │
│                                                                     │
│  ┌──────────────┐    ┌─────────────────────────────────────────┐   │
│  │  Next.js App  │    │  Next.js API Routes (serverless)        │   │
│  │  (App Router) │    │                                         │   │
│  │               │    │  /api/scan     → Gemini                 │   │
│  │  / ── landing │    │  /api/receipts → Supabase CRUD          │   │
│  │  /scan ── OCR │    │  /api/sheets/* → Google Sheets          │   │
│  │  /receipts    │    │  /api/stripe/* → Stripe                 │   │
│  │  /insights    │    │  /api/usage    → Tier check             │   │
│  │  /settings    │    │                                         │   │
│  │               │    └─────────────────────────────────────────┘   │
│  │  PWA          │                                                 │
│  │  (manifest +  │    ┌─────────────────────────────────────────┐   │
│  │   sw.js)      │    │  Supabase (BaaS)                        │   │
│  └──────────────┘    │                                         │   │
│                      │  ┌─────────────────────┐                │   │
│                      │  │  PostgreSQL          │                │   │
│                      │  │  ┌───────────────┐  │                │   │
│                      │  │  │ profiles       │  │                │   │
│                      │  │  │ receipts       │  │                │   │
│                      │  │  │ receipt_items  │  │                │   │
│                      │  │  │ monthly_usage  │  │                │   │
│                      │  │  │ categories     │  │                │   │
│                      │  │  └───────────────┘  │                │   │
│                      │  │                     │                │   │
│                      │  │  Auth (built-in)    │                │   │
│                      │  │  Storage (images)   │                │   │
│                      │  └─────────────────────┘                │   │
│                      └─────────────────────────────────────────┘   │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  External APIs                                                │   │
│  │                                                               │   │
│  │  Gemini 2.5 Flash Lite  ←─── receipt OCR (~$0.0002/rec)     │   │
│  │  Google Sheets API     ←─── data export (free quota)         │   │
│  │  Stripe                ←─── payments + subscriptions         │   │
│  │                                                               │   │
│  └──────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Summary

This architecture is designed for a solo developer building on evenings and weekends. Key principles:

1. **Convention over configuration** — Next.js App Router + Supabase provide strong conventions that reduce decision fatigue.
2. **Co-located code** — API routes live next to pages. Components live next to their features.
3. **Minimal abstractions** — No service layer, no state management library, no form library. Add them only when pain emerges.
4. **Cost-aware** — Everything fits within free tiers until hundreds of users.
5. **Swap-ready** — Gemini can be swapped for Claude. Supabase can be migrated to raw Postgres. The abstractions are thin on purpose.

The MVP builds one complete vertical slice: Auth → Scan → OCR → Edit → Save → Sheets Export. Everything after is additive.



