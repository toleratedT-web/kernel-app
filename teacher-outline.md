# ReceiptSnap — Project Proposal

## Problem
Freelancers and sole traders track expenses with spreadsheets or expensive bloatware (Expensify $10+/mo). There's nothing simple and affordable.

## Solution — ReceiptSnap
web app/ mobile app: snap a receipt → AI extracts items/prices → one-tap append to Google Sheets → monthly spending insights.

## Target Users
- Students tracking part-time income and expenses
- Freelancers, gig workers, Airbnb hosts, contractors

## Tech Stack
- Next.js / Tailwind (web app + PWA)
- Supabase (auth + database)
- Gemini 2.0 Flash (receipt OCR — ~$0.00005 per receipt)
- Vercel (hosting)
- Stripe (payments)
- Google Sheets API (export)

## Pricing
- Free: 10 receipts/month
- Starter: $5/month (100 receipts + insights)
- Pro: $10/month (unlimited + multi-currency)

## Business Case
$5/mo × 100 users = $500 rev. Infrastructure cost ~$60. Gross margin ~88%. Breakeven at 1 paid user.

## Timeline
- Week 1: Core snap → extract → save → sheet export
- Week 2: Dashboard + insights + payments
- Week 3: Polish + launch to 5 beta users

## Key Risk
Vision API accuracy on blurry/photos of screens. Mitigation: fallback to manual quick-edit, swap to Claude Haiku if Gemini doesn't cut it.


