-- ══════════════════════════════════════════════════════════════
-- LabelWink — BATCH 1 SCHEMA MIGRATION (safe/idempotent)
-- Run this ENTIRE file in Supabase SQL Editor → New Query
-- ══════════════════════════════════════════════════════════════

-- ──────────────────────────────────────────────────────────────
-- BATCH 1A: EXTEND ORDERS TABLE
-- ──────────────────────────────────────────────────────────────
ALTER TABLE orders ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS admin_note text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS razorpay_payment_id text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS razorpay_order_id text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS razorpay_signature text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_carrier text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_number text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_url text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shiprocket_order_id text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shiprocket_awb text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS label_url text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_name text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_email text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_phone text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_amount numeric DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_amount numeric DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS subtotal numeric DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS points_redeemed integer DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_method text DEFAULT 'standard';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_state text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS is_inter_state boolean DEFAULT false;

-- ──────────────────────────────────────────────────────────────
-- BATCH 1B: ORDER MANAGEMENT TABLES
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS order_status_history (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  status text NOT NULL,
  note text,
  changed_by text DEFAULT 'admin',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE order_status_history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "admin_order_history" ON order_status_history;
DROP POLICY IF EXISTS "user_own_order_history" ON order_status_history;
CREATE POLICY "admin_order_history" ON order_status_history USING (true);
CREATE POLICY "user_own_order_history" ON order_status_history FOR SELECT
  USING (order_id IN (SELECT id FROM orders WHERE user_id = auth.uid()));

CREATE TABLE IF NOT EXISTS invoices (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  invoice_number text UNIQUE,
  issued_at timestamptz DEFAULT now(),
  subtotal numeric,
  cgst numeric DEFAULT 0,
  sgst numeric DEFAULT 0,
  igst numeric DEFAULT 0,
  shipping numeric DEFAULT 0,
  discount numeric DEFAULT 0,
  total numeric,
  data jsonb
);
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "user_own_invoices" ON invoices;
DROP POLICY IF EXISTS "admin_all_invoices" ON invoices;
CREATE POLICY "user_own_invoices" ON invoices FOR SELECT
  USING (order_id IN (SELECT id FROM orders WHERE user_id = auth.uid()));
CREATE POLICY "admin_all_invoices" ON invoices USING (true);

CREATE TABLE IF NOT EXISTS return_requests (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id),
  reason text,
  description text,
  photo_urls text[],
  status text DEFAULT 'pending',
  refund_amount numeric,
  refund_method text DEFAULT 'razorpay',
  razorpay_refund_id text,
  admin_note text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE return_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "user_own_returns" ON return_requests;
DROP POLICY IF EXISTS "admin_all_returns" ON return_requests;
CREATE POLICY "user_own_returns" ON return_requests USING (auth.uid() = user_id);
CREATE POLICY "admin_all_returns" ON return_requests USING (true);

-- ──────────────────────────────────────────────────────────────
-- BATCH 1C: DISCOUNTS & LOYALTY
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS discount_codes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  code text UNIQUE NOT NULL,
  type text NOT NULL CHECK (type IN ('percentage','flat','bogo','free_shipping')),
  value numeric NOT NULL,
  min_order_amount numeric DEFAULT 0,
  max_uses integer,
  used_count integer DEFAULT 0,
  single_use_per_customer boolean DEFAULT false,
  starts_at timestamptz,
  expires_at timestamptz,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE discount_codes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "admin_discounts" ON discount_codes;
DROP POLICY IF EXISTS "public_read_active_discounts" ON discount_codes;
CREATE POLICY "admin_discounts" ON discount_codes USING (true);
CREATE POLICY "public_read_active_discounts" ON discount_codes
  FOR SELECT USING (is_active = true);

CREATE TABLE IF NOT EXISTS discount_code_uses (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  discount_code_id uuid REFERENCES discount_codes(id),
  user_id uuid REFERENCES auth.users(id),
  order_id uuid REFERENCES orders(id),
  used_at timestamptz DEFAULT now()
);
ALTER TABLE discount_code_uses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "user_own_discount_uses" ON discount_code_uses;
CREATE POLICY "user_own_discount_uses" ON discount_code_uses
  USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS loyalty_points (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  balance integer DEFAULT 0,
  lifetime_earned integer DEFAULT 0,
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE loyalty_points ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "user_own_points" ON loyalty_points;
DROP POLICY IF EXISTS "admin_all_points" ON loyalty_points;
CREATE POLICY "user_own_points" ON loyalty_points USING (auth.uid() = user_id);
CREATE POLICY "admin_all_points" ON loyalty_points USING (true);

CREATE TABLE IF NOT EXISTS loyalty_transactions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  points integer NOT NULL,
  type text NOT NULL CHECK (type IN ('earn','redeem','bonus','expire','referral','birthday')),
  reason text,
  order_id uuid REFERENCES orders(id),
  created_at timestamptz DEFAULT now()
);
ALTER TABLE loyalty_transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "user_own_loyalty_tx" ON loyalty_transactions;
DROP POLICY IF EXISTS "admin_all_loyalty_tx" ON loyalty_transactions;
CREATE POLICY "user_own_loyalty_tx" ON loyalty_transactions
  USING (auth.uid() = user_id);
CREATE POLICY "admin_all_loyalty_tx" ON loyalty_transactions USING (true);

-- ──────────────────────────────────────────────────────────────
-- BATCH 1D: PROFILES EXTENSIONS & ADDRESSES
-- ──────────────────────────────────────────────────────────────
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS date_of_birth date;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS gender text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS chest numeric;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS waist numeric;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS hips numeric;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS height numeric;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS weight numeric;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS referral_code text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS referred_by uuid REFERENCES auth.users(id);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role text DEFAULT 'customer';

-- Unique referral codes (only if column was just added)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE tablename = 'profiles' AND indexname = 'profiles_referral_code_key'
  ) THEN
    UPDATE profiles SET referral_code = UPPER(LEFT(gen_random_uuid()::text, 8))
    WHERE referral_code IS NULL;
    ALTER TABLE profiles ADD CONSTRAINT profiles_referral_code_key UNIQUE (referral_code);
  END IF;
END $$;

DROP POLICY IF EXISTS "admin_all_profiles" ON profiles;
CREATE POLICY "admin_all_profiles" ON profiles USING (true);

CREATE TABLE IF NOT EXISTS addresses (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  label text DEFAULT 'Home' CHECK (label IN ('Home','Office','Other')),
  full_name text,
  phone text,
  line1 text,
  line2 text,
  city text,
  state text,
  pincode text,
  country text DEFAULT 'India',
  is_default boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "user_own_addresses" ON addresses;
DROP POLICY IF EXISTS "admin_all_addresses" ON addresses;
CREATE POLICY "user_own_addresses" ON addresses USING (auth.uid() = user_id);
CREATE POLICY "admin_all_addresses" ON addresses USING (true);

-- ──────────────────────────────────────────────────────────────
-- BATCH 1E: PRODUCTS & VARIANTS EXTENSIONS
-- ──────────────────────────────────────────────────────────────
ALTER TABLE products ADD COLUMN IF NOT EXISTS compare_at_price numeric;
ALTER TABLE products ADD COLUMN IF NOT EXISTS status text DEFAULT 'published';
ALTER TABLE products ADD COLUMN IF NOT EXISTS size_chart_data jsonb;
ALTER TABLE products ADD COLUMN IF NOT EXISTS tags text[];
ALTER TABLE products ADD COLUMN IF NOT EXISTS fabric text;
ALTER TABLE products ADD COLUMN IF NOT EXISTS occasion text;
ALTER TABLE products ADD COLUMN IF NOT EXISTS fit text;
ALTER TABLE products ADD COLUMN IF NOT EXISTS season text;
ALTER TABLE products ADD COLUMN IF NOT EXISTS hsn_code text DEFAULT '6211';
ALTER TABLE products ADD COLUMN IF NOT EXISTS meta_title text;
ALTER TABLE products ADD COLUMN IF NOT EXISTS meta_description text;
ALTER TABLE products ADD COLUMN IF NOT EXISTS og_image_url text;
ALTER TABLE products ADD COLUMN IF NOT EXISTS weight numeric DEFAULT 0.5;

ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS sku text;
ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS color text;
ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS low_stock_threshold integer DEFAULT 5;
ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS warehouse_location text;
ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS reorder_qty integer DEFAULT 10;
ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS price numeric;
ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS image_url text;

-- ──────────────────────────────────────────────────────────────
-- BATCH 1F: REVIEWS TABLE
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reviews (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id),
  order_id uuid REFERENCES orders(id),
  rating integer CHECK (rating BETWEEN 1 AND 5),
  title text,
  body text,
  status text DEFAULT 'pending',
  is_verified_purchase boolean DEFAULT false,
  admin_reply text,
  created_at timestamptz DEFAULT now()
);
-- Add new columns in case table already existed without them
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS title text;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS is_verified_purchase boolean DEFAULT false;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS admin_reply text;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "reviews_read" ON reviews;
DROP POLICY IF EXISTS "reviews_insert" ON reviews;
DROP POLICY IF EXISTS "public_approved_reviews" ON reviews;
DROP POLICY IF EXISTS "user_own_reviews" ON reviews;
DROP POLICY IF EXISTS "admin_all_reviews" ON reviews;
CREATE POLICY "public_approved_reviews" ON reviews FOR SELECT USING (status = 'approved');
CREATE POLICY "user_own_reviews" ON reviews USING (auth.uid() = user_id);
CREATE POLICY "admin_all_reviews" ON reviews USING (true);

-- ──────────────────────────────────────────────────────────────
-- BATCH 1G: WISHLIST EXTENSIONS
-- ──────────────────────────────────────────────────────────────
ALTER TABLE wishlists ADD COLUMN IF NOT EXISTS variant_id uuid REFERENCES product_variants(id);

-- Safely rename created_at → added_at only if needed
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'wishlists' AND column_name = 'created_at'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'wishlists' AND column_name = 'added_at'
  ) THEN
    ALTER TABLE wishlists RENAME COLUMN created_at TO added_at;
  END IF;
END $$;

-- ──────────────────────────────────────────────────────────────
-- BATCH 1H: CMS & CONTENT TABLES
-- ──────────────────────────────────────────────────────────────

-- banners: create if new, OR add missing columns if it already exists
CREATE TABLE IF NOT EXISTS banners (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text,
  image_url text,
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
-- Add all new columns (safe — skipped if already present)
ALTER TABLE banners ADD COLUMN IF NOT EXISTS mobile_image_url text;
ALTER TABLE banners ADD COLUMN IF NOT EXISTS target_url text;
ALTER TABLE banners ADD COLUMN IF NOT EXISTS position text DEFAULT 'hero';
ALTER TABLE banners ADD COLUMN IF NOT EXISTS starts_at timestamptz;
ALTER TABLE banners ADD COLUMN IF NOT EXISTS ends_at timestamptz;
ALTER TABLE banners ADD COLUMN IF NOT EXISTS variant_a_url text;
ALTER TABLE banners ADD COLUMN IF NOT EXISTS variant_b_url text;
ALTER TABLE banners ADD COLUMN IF NOT EXISTS click_count_a integer DEFAULT 0;
ALTER TABLE banners ADD COLUMN IF NOT EXISTS click_count_b integer DEFAULT 0;
ALTER TABLE banners ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "admin_all_banners" ON banners;
DROP POLICY IF EXISTS "public_read_active_banners" ON banners;
CREATE POLICY "admin_all_banners" ON banners USING (true);
CREATE POLICY "public_read_active_banners" ON banners FOR SELECT
  USING (
    is_active = true
    AND (starts_at IS NULL OR starts_at <= now())
    AND (ends_at IS NULL OR ends_at >= now())
  );

-- pages: create if new, OR add missing columns
CREATE TABLE IF NOT EXISTS pages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  slug text UNIQUE NOT NULL,
  title text,
  is_published boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE pages ADD COLUMN IF NOT EXISTS meta_title text;
ALTER TABLE pages ADD COLUMN IF NOT EXISTS meta_description text;
ALTER TABLE pages ADD COLUMN IF NOT EXISTS content jsonb;
ALTER TABLE pages ADD COLUMN IF NOT EXISTS published_at timestamptz;
ALTER TABLE pages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "admin_all_pages" ON pages;
DROP POLICY IF EXISTS "public_published_pages" ON pages;
CREATE POLICY "admin_all_pages" ON pages USING (true);
CREATE POLICY "public_published_pages" ON pages FOR SELECT USING (is_published = true);

-- blog_posts
CREATE TABLE IF NOT EXISTS blog_posts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  slug text UNIQUE NOT NULL,
  title text,
  body text,
  is_published boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS excerpt text;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS cover_image_url text;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS author_name text;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS tags text[];
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS meta_title text;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS meta_description text;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS og_image_url text;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS related_product_ids uuid[];
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS published_at timestamptz;
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "admin_all_posts" ON blog_posts;
DROP POLICY IF EXISTS "public_published_posts" ON blog_posts;
CREATE POLICY "admin_all_posts" ON blog_posts USING (true);
CREATE POLICY "public_published_posts" ON blog_posts FOR SELECT USING (is_published = true);

-- ──────────────────────────────────────────────────────────────
-- BATCH 1I: ADMIN SYSTEM TABLES
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS shop_settings (
  id integer DEFAULT 1 PRIMARY KEY,
  store_name text DEFAULT 'LabelWink',
  store_email text,
  store_phone text,
  store_address text,
  store_state text DEFAULT 'Tamil Nadu',
  gst_number text,
  logo_url text,
  currency text DEFAULT 'INR',
  free_shipping_threshold numeric DEFAULT 999,
  standard_shipping_rate numeric DEFAULT 79,
  express_shipping_rate numeric DEFAULT 149,
  loyalty_points_per_rupee numeric DEFAULT 1,
  points_to_rupee_ratio numeric DEFAULT 100,
  return_window_days integer DEFAULT 7,
  low_stock_notify_email text,
  updated_at timestamptz DEFAULT now()
);
INSERT INTO shop_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id uuid REFERENCES auth.users(id),
  admin_email text,
  action text,
  entity text,
  entity_id text,
  changes jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "admin_only_logs" ON audit_logs;
CREATE POLICY "admin_only_logs" ON audit_logs USING (true);

-- admin_notifications may already exist — just extend it
CREATE TABLE IF NOT EXISTS admin_notifications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  type text,
  title text,
  body text,
  data jsonb,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE admin_notifications ADD COLUMN IF NOT EXISTS type text;
ALTER TABLE admin_notifications ADD COLUMN IF NOT EXISTS title text;
ALTER TABLE admin_notifications ADD COLUMN IF NOT EXISTS body text;
ALTER TABLE admin_notifications ADD COLUMN IF NOT EXISTS data jsonb;
ALTER TABLE admin_notifications ADD COLUMN IF NOT EXISTS is_read boolean DEFAULT false;
ALTER TABLE admin_notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "admin_all_notifications" ON admin_notifications;
CREATE POLICY "admin_all_notifications" ON admin_notifications USING (true);

CREATE TABLE IF NOT EXISTS email_templates (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text UNIQUE NOT NULL,
  subject text,
  html_body text,
  variables text[],
  is_active boolean DEFAULT true,
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "admin_all_templates" ON email_templates;
CREATE POLICY "admin_all_templates" ON email_templates USING (true);

-- ──────────────────────────────────────────────────────────────
-- BATCH 1J: DATABASE TRIGGERS
-- ──────────────────────────────────────────────────────────────

-- 1) Auto-generate invoice on order insert
CREATE OR REPLACE FUNCTION generate_invoice()
RETURNS TRIGGER AS $$
DECLARE
  cgst_val numeric := 0;
  sgst_val numeric := 0;
  igst_val numeric := 0;
BEGIN
  IF COALESCE(NEW.total, 0) > 1000 THEN
    IF COALESCE(NEW.is_inter_state, false) THEN
      igst_val := ROUND(COALESCE(NEW.subtotal, 0) * 0.12, 2);
    ELSE
      cgst_val := ROUND(COALESCE(NEW.subtotal, 0) * 0.06, 2);
      sgst_val := ROUND(COALESCE(NEW.subtotal, 0) * 0.06, 2);
    END IF;
  END IF;

  INSERT INTO invoices (
    order_id, invoice_number, total, subtotal,
    cgst, sgst, igst, shipping, discount, data
  ) VALUES (
    NEW.id,
    'INV-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || UPPER(LEFT(NEW.id::text, 6)),
    NEW.total,
    NEW.subtotal,
    cgst_val,
    sgst_val,
    igst_val,
    COALESCE(NEW.shipping_amount, 0),
    COALESCE(NEW.discount_amount, 0),
    jsonb_build_object(
      'customer_name',  NEW.customer_name,
      'customer_email', NEW.customer_email,
      'customer_phone', NEW.customer_phone
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_order_created ON orders;
CREATE TRIGGER on_order_created
  AFTER INSERT ON orders
  FOR EACH ROW EXECUTE FUNCTION generate_invoice();

-- 2) Auto-log order status changes
CREATE OR REPLACE FUNCTION log_order_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO order_status_history (order_id, status)
    VALUES (NEW.id, NEW.status);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_order_status_log ON orders;
CREATE TRIGGER on_order_status_log
  AFTER UPDATE OF status ON orders
  FOR EACH ROW EXECUTE FUNCTION log_order_status();

-- 3) Stock management on order status change
CREATE OR REPLACE FUNCTION manage_stock_on_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'confirmed' AND OLD.status = 'pending' THEN
    UPDATE product_variants pv
    SET stock_qty = stock_qty - oi.quantity
    FROM order_items oi
    WHERE oi.order_id = NEW.id
      AND pv.product_id = oi.product_id
      AND pv.size = oi.size;
  END IF;

  IF NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
    UPDATE product_variants pv
    SET stock_qty = stock_qty + oi.quantity
    FROM order_items oi
    WHERE oi.order_id = NEW.id
      AND pv.product_id = oi.product_id
      AND pv.size = oi.size;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_order_status_stock ON orders;
CREATE TRIGGER on_order_status_stock
  AFTER UPDATE OF status ON orders
  FOR EACH ROW EXECUTE FUNCTION manage_stock_on_status();

-- 4) Auto-create loyalty + profile on user signup
CREATE OR REPLACE FUNCTION create_loyalty_on_signup()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO loyalty_points (user_id, balance, lifetime_earned)
  VALUES (NEW.id, 0, 0)
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO profiles (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_user_signup ON auth.users;
CREATE TRIGGER on_user_signup
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_loyalty_on_signup();

-- ──────────────────────────────────────────────────────────────
-- RELOAD SCHEMA
-- ──────────────────────────────────────────────────────────────
NOTIFY pgrst, 'reload schema';
