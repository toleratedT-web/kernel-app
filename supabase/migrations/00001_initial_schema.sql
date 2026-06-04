-- ============================================================================
-- Kernel — Initial Schema Migration
-- Migration: 00001_initial_schema
-- Description: Creates all core tables, indexes, RLS policies, and storage
-- ============================================================================

-- 0. Extensions
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Profiles (extends auth.users)
-- ============================================================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  display_name TEXT,
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT,
  tier TEXT NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'starter', 'pro')),
  trial_ends_at TIMESTAMPTZ,
  sheets_token JSONB,
  sheets_email TEXT,
  sheets_sheet_id TEXT,
  base_currency TEXT NOT NULL DEFAULT 'GBP',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Trigger: auto-update updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Function: auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: auto-create profile when auth user is created
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS policies for profiles
CREATE POLICY "Users can read own profile"
  ON public.profiles
  FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Profile insert is handled by trigger, but allow it via service role
CREATE POLICY "Service role can insert profiles"
  ON public.profiles
  FOR INSERT
  WITH CHECK (true);

-- No DELETE policy — profiles persist

-- 2. Receipts
-- ============================================================================
CREATE TABLE public.receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  image_url TEXT,
  image_storage_path TEXT,
  merchant TEXT,
  date DATE,
  grand_total DECIMAL(10,2),
  currency TEXT NOT NULL DEFAULT 'GBP',
  tax DECIMAL(10,2),
  raw_ocr JSONB,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'edited', 'exported')),
  exported_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER set_receipts_updated_at
  BEFORE UPDATE ON public.receipts
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Indexes
CREATE INDEX idx_receipts_user_id ON public.receipts(user_id);
CREATE INDEX idx_receipts_date ON public.receipts(date);
CREATE INDEX idx_receipts_merchant ON public.receipts(merchant);

-- Enable RLS
ALTER TABLE public.receipts ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users own their receipts"
  ON public.receipts
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 3. Receipt Items
-- ============================================================================
CREATE TABLE public.receipt_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_id UUID NOT NULL REFERENCES public.receipts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  quantity DECIMAL(10,3) NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2),
  total_price DECIMAL(10,2),
  category TEXT,
  sort_order INT NOT NULL DEFAULT 0
);

-- Indexes
CREATE INDEX idx_items_receipt_id ON public.receipt_items(receipt_id);

-- Enable RLS
ALTER TABLE public.receipt_items ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users own their items"
  ON public.receipt_items
  FOR ALL
  USING (
    receipt_id IN (
      SELECT id FROM public.receipts WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    receipt_id IN (
      SELECT id FROM public.receipts WHERE user_id = auth.uid()
    )
  );

-- 4. Monthly Usage
-- ============================================================================
CREATE TABLE public.monthly_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  month TEXT NOT NULL,  -- Format: 'YYYY-MM'
  receipt_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, month)
);

CREATE TRIGGER set_monthly_usage_updated_at
  BEFORE UPDATE ON public.monthly_usage
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Enable RLS
ALTER TABLE public.monthly_usage ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users own their usage"
  ON public.monthly_usage
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 5. Categories
-- ============================================================================
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT,
  keywords TEXT[],
  icon TEXT,
  is_system BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users view system and own categories"
  ON public.categories
  FOR SELECT
  USING (user_id IS NULL OR user_id = auth.uid());

CREATE POLICY "Users create own categories"
  ON public.categories
  FOR INSERT
  WITH CHECK (user_id = auth.uid() AND is_system = false);

CREATE POLICY "Users update own categories"
  ON public.categories
  FOR UPDATE
  USING (user_id = auth.uid() AND is_system = false)
  WITH CHECK (user_id = auth.uid() AND is_system = false);

CREATE POLICY "Users delete own categories"
  ON public.categories
  FOR DELETE
  USING (user_id = auth.uid() AND is_system = false);

-- Seed system categories
INSERT INTO public.categories (name, color, keywords, icon, is_system) VALUES
  ('Food & Drink', '#ef4444', ARRAY['food', 'drink', 'restaurant', 'cafe', 'groceries', 'supermarket', 'takeaway'], 'utensils', true),
  ('Transport', '#f97316', ARRAY['transport', 'fuel', 'petrol', 'uber', 'taxi', 'train', 'bus', 'parking'], 'car', true),
  ('Shopping', '#eab308', ARRAY['shopping', 'clothes', 'retail', 'amazon', 'online'], 'shopping-bag', true),
  ('Utilities', '#22c55e', ARRAY['utility', 'electric', 'gas', 'water', 'internet', 'phone', 'bill'], 'zap', true),
  ('Entertainment', '#3b82f6', ARRAY['entertainment', 'cinema', 'netflix', 'spotify', 'game', 'subscription'], 'film', true),
  ('Health', '#a855f7', ARRAY['health', 'pharmacy', 'doctor', 'dentist', 'medical', 'gym'], 'heart', true),
  ('Housing', '#ec4899', ARRAY['rent', 'mortgage', 'repair', 'maintenance', 'furniture'], 'home', true),
  ('Income', '#14b8a6', ARRAY['salary', 'income', 'payment', 'transfer', 'invoice'], 'trending-up', true),
  ('Other', '#6b7280', ARRAY[]::TEXT[], 'more-horizontal', true);

-- 6. Subscriptions (audit trail of subscription changes)
-- ============================================================================
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT,
  stripe_price_id TEXT,
  status TEXT NOT NULL DEFAULT 'incomplete' CHECK (status IN ('incomplete', 'active', 'past_due', 'canceled', 'unpaid', 'trialing')),
  tier TEXT NOT NULL CHECK (tier IN ('free', 'starter', 'pro')),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_subscriptions_profile_id ON public.subscriptions(profile_id);
CREATE INDEX idx_subscriptions_stripe_id ON public.subscriptions(stripe_subscription_id);

CREATE TRIGGER set_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Enable RLS
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users view own subscriptions"
  ON public.subscriptions
  FOR SELECT
  USING (profile_id = auth.uid());

-- 7. Storage bucket: receipt-images
-- ============================================================================
INSERT INTO storage.buckets (id, name, public) VALUES ('receipt-images', 'receipt-images', false)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for storage
CREATE POLICY "Users read own receipt images"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'receipt-images' AND
    auth.role() = 'authenticated' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users upload own receipt images"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'receipt-images' AND
    auth.role() = 'authenticated' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users delete own receipt images"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'receipt-images' AND
    auth.role() = 'authenticated' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- 8. Helper functions
-- ============================================================================

-- Function: increment monthly usage count atomically
CREATE OR REPLACE FUNCTION public.increment_monthly_usage(
  p_user_id UUID,
  p_month TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.monthly_usage (user_id, month, receipt_count)
  VALUES (p_user_id, p_month, 1)
  ON CONFLICT (user_id, month)
  DO UPDATE SET
    receipt_count = public.monthly_usage.receipt_count + 1,
    updated_at = now();
END;
$$;

-- ============================================================================
-- End of migration
-- ============================================================================
