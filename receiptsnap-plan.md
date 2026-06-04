# Kernel — Project Plan (formerly ReceiptSnap)

## The One-Liner
Snap a receipt, AI extracts every item and price, one tap to Google Sheets. See where your money actually goes.

## Brand
- **Name:** Kernel
- **Logo:** Single kernel/grain icon (copper accent)
- **Tagline:** The kernel of your spending
- **Domains to check:** `kernelreceipts.app`, `kernelreceipts.com`, `usekernel.app`
- **Landing page:** Built (HTML/CSS/JS, dark/light mode, copper accent)

## Target Users
- Students tracking part-time income and expenses
- Freelancers, gig workers, Airbnb hosts
- Small businesses / sole traders
- Specific lead: the pool workplace (manager spends hours on receipts)

## Core Features (MVP)

### Phase 1 — Scanner
- Snap receipt photo (mobile camera) or drag/drop (desktop PDF/image)
- AI extracts each line item: date, merchant, items, prices, quantity, tax
- Quick-edit modal to correct any mistakes
- One-tap append to Google Sheet (user's own template)
- Receipt image stored in cloud (for audit trail)

### Phase 2 — Insights
- Monthly spending by category (bar chart)
- "You spent X on Y this month — that's +Z% vs last month"
- Top merchants by spend
- Descriptive only, not financial advice

### Phase 3 — Niceties
- Receipt search (by merchant, date range, amount)
- Multi-currency support
- Email monthly spending summary

## Differentiator (USP)
**Line-item extraction.** Most apps (Expensify, etc.) store the receipt as a single total. Kernel extracts each item into its own row in the sheet. This makes the data useful for actual tracking, not just storage.

## Tech Stack
| Layer | Choice | Why |
|---|---|---|
| Frontend | HTML/CSS/JS landing page first, Next.js + Tailwind for app | Simple start |
| Mobile | PWA (no app store) | Zero install friction |
| Auth | Supabase Auth | Free tier, 50K MAU |
| DB | Supabase Postgres | Relational data, RLS, predictable pricing |
| Vision AI | Gemini 2.5 Flash Lite | ~$0.0002/receipt (near-free) |
| Hosting | Vercel Hobby (Free) | Free until thousands of users |
| Payments | Stripe | Standard 2.9% + $0.30 |
| Spreadsheet | Google Sheets API | Free with quotas |

### Why Supabase over Firebase (teacher's suggestion)
- Receipt data is relational (receipt → items → categories) — Postgres handles this naturally
- Predictable pricing ($25/mo flat vs Firebase's per-operation billing that explodes at scale)
- Row Level Security built-in for user data isolation
- Can self-host or migrate later (no lock-in)
- Firebase free tier removed Cloud Storage (Feb 2026), needs credit card for image uploads

## Pricing

| Tier | Price | Receipts | Insights | Sheet Export |
|---|---|---|---|---|
| Free | $0 | 10/mo | No | Yes |
| Starter (monthly) | $5/mo | 250/mo | Yes | Yes |
| Starter (yearly) | $45/yr ($3.75/mo) | 250/mo | Yes | Yes |
| Pro (monthly) | $10/mo | Unlimited | Yes | Yes |
| Pro (yearly) | $84/yr ($7/mo) | Unlimited | Yes | Yes |

### Trials
- 14 days free (no card required) — all features unlocked
- 1 month with card (capture upgrade path)
- 2 months for discounted amount (decoy option)

### Business / Workplace
- £10/mo per workspace (unlimited receipts for the team)
- Direct scanner integration via drag/drop PDF uploads
- Future: Electron exe with TWAIN scanner support

## Researched Cost Breakdown

| Stage | AI (Gemini) | Supabase | Vercel | Stripe | Total |
|---|---|---|---|---|---|
| **0 users (dev)** | $0 (free tier) | $0 (free) | $0 (Hobby) | $0 | **<$1/mo** |
| **100 Starter users** | ~$2 | $0 (free) | $0 | ~$45 | **~$47/mo** |
| **1000 Starter users** | ~$20 | $25 (Pro) | $0 | ~$450 | **~$495/mo** |

### Running costs detailed
- **Gemini 2.5 Flash Lite:** $0.075/1M input tokens, $0.30/1M output. Per receipt: ~$0.0002
- **Supabase Free:** 500MB DB, 5GB egress, 50K MAU, pauses after 7 days inactivity
- **Supabase Pro:** $25/mo — 8GB DB, 250GB egress, 100K MAU, no pause, daily backups
- **Vercel Hobby:** Free — 1M function invocations/mo, 100GB bandwidth
- **Stripe:** 2.9% + $0.30 per charge
- **Google Sheets API:** Free (60 req/min/user limit)
- **Domain:** $5-10/yr

### Stripe fee impact
- $5 subscription → $0.445 fee (8.9% — the $0.30 fixed fee hurts low tiers)
- $10 subscription → $0.59 fee (5.9%)
- Annual billing reduces Stripe overhead (~$0.30 once vs 12 times)

## Development Timeline (with AI assistance, evenings + weekends)
- **Auth + DB schema + basic pages:** ~1 week
- **Receipt upload + Gemini extraction:** ~1-2 weeks
- **Quick-edit UI + saving to DB:** ~1 week
- **Google Sheets export:** ~3-5 days
- **Spending insights dashboard:** ~1-2 weeks
- **Stripe subscriptions + tier logic:** ~1-2 weeks
- **PWA + polish + edge cases:** ~1 week
- **Total:** ~6-10 weeks (2-3 weeks full-time)

## Business Model
- Free tier: user acquisition / habit building
- Paid tiers: $5-$10/mo per user
- 90% gross margin at scale
- Micro-SaaS portfolio approach: 5-10 small products, each with 2-10 paid users, diversified income
- CV value even if it fails

## Acquisition Channels
1. **Workplace beta:** Pool manager (real receipts, real feedback)
2. **Reddit:** r/freelance, r/beermoney, r/AirbnbHosts, r/UKPersonalFinance
3. **Indie Hackers:** Build in public thread
4. **Direct outreach:** Student finance contact, Airbnb host contact
5. **Product Hunt:** Launch after MVP

## Teacher Feedback
- Ideas solid, gap exists in market
- Line-item extraction is the real USP
- Free or 99p first month to build trust
- Firebase suggestion considered but Supabase chosen for relational data needs
- Take pricing advice, build the differentiator

## Landing Page Status
- **Built:** Single HTML file with embedded CSS/JS
- **Features:** Dark/light mode toggle with localStorage persistence, kernel SVG logo, copper accent, responsive mobile-first, scroll reveal animations, scroll progress bar, pricing toggle (monthly/annual), FAQ accordion, mobile sticky CTA, scroll snap on sections
- **File location:** `recietsnap/index.html`
- **Testimonials:** Placeholder cards — real quotes from real users needed post-launch

## Risks
| Risk | Mitigation |
|---|---|
| Gemini accuracy too low on blurry receipts | Quick-edit screen; fallback to Claude Haiku if needed |
| Users stop scanning after 2 weeks | Insights + email weekly summary |
| Google Sheets API rate limits | Batch writes, buffer requests |
| No traction / 0 users | CV value alone worth the build; micro-SaaS portfolio approach |
| Competitors (Expensify $5/mo unlimited) | Line-item extraction is differentiator; simpler UX |
