-- ============================================
-- LABEL WINK — PRODUCTION DATABASE SCHEMA
-- CLEAN SLATE MODE: DROPS EXISTING TABLES
-- ============================================

-- Drop existing tables to ensure clean recreation
DROP TABLE IF EXISTS newsletter_subscriptions CASCADE;
DROP TABLE IF EXISTS site_settings CASCADE;
DROP TABLE IF EXISTS notify_me CASCADE;
DROP TABLE IF EXISTS homepage_sections CASCADE;
DROP TABLE IF EXISTS announcements CASCADE;
DROP TABLE IF EXISTS banners CASCADE;
DROP TABLE IF EXISTS wink_points_log CASCADE;
DROP TABLE IF EXISTS coupons CASCADE;
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS wishlists CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS addresses CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS product_images CASCADE;
DROP TABLE IF EXISTS product_variants CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS categories CASCADE;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── CATEGORIES ───────────────────────────
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  image_cloudinary_id TEXT,
  seo_title TEXT,
  seo_description TEXT,
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── PRODUCTS ─────────────────────────────
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  fabric TEXT,
  care_instructions TEXT,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  tags TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT false,
  seo_title TEXT,
  seo_description TEXT,
  og_image_cloudinary_id TEXT,
  size_guide JSONB,
  related_product_ids UUID[] DEFAULT '{}',
  complete_the_look_ids UUID[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── PRODUCT VARIANTS ─────────────────────
CREATE TABLE product_variants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  size TEXT NOT NULL,
  color TEXT NOT NULL,
  color_hex TEXT,
  sku TEXT UNIQUE,
  price NUMERIC(10,2) NOT NULL,
  mrp NUMERIC(10,2) NOT NULL,
  stock_qty INT DEFAULT 0,
  image_cloudinary_ids TEXT[] DEFAULT '{}',
  video_cloudinary_id TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── PRODUCT IMAGES ───────────────────────
CREATE TABLE product_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  variant_id UUID REFERENCES product_variants(id) ON DELETE CASCADE,
  cloudinary_public_id TEXT NOT NULL,
  resource_type TEXT DEFAULT 'image',
  alt_text TEXT,
  sort_order INT DEFAULT 0,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── USERS ────────────────────────────────
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  phone TEXT UNIQUE,
  email TEXT,
  role TEXT DEFAULT 'customer',
  wink_points INT DEFAULT 0,
  date_of_birth DATE,
  gender TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── ADDRESSES ────────────────────────────
CREATE TABLE addresses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  label TEXT DEFAULT 'Home',
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  line1 TEXT NOT NULL,
  line2 TEXT,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  pincode TEXT NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── ORDERS ───────────────────────────────
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  guest_email TEXT,
  guest_phone TEXT,
  status TEXT DEFAULT 'pending',
  payment_method TEXT NOT NULL,
  payment_status TEXT DEFAULT 'pending',
  razorpay_order_id TEXT,
  razorpay_payment_id TEXT,
  shipping_address JSONB NOT NULL,
  subtotal NUMERIC(10,2) NOT NULL,
  discount_amount NUMERIC(10,2) DEFAULT 0,
  coupon_code TEXT,
  shipping_fee NUMERIC(10,2) DEFAULT 0,
  total NUMERIC(10,2) NOT NULL,
  tracking_id TEXT,
  courier TEXT,
  shiprocket_order_id TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── ORDER ITEMS ──────────────────────────
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  variant_size TEXT NOT NULL,
  variant_color TEXT NOT NULL,
  image_cloudinary_id TEXT,
  quantity INT NOT NULL DEFAULT 1,
  price_at_purchase NUMERIC(10,2) NOT NULL,
  mrp_at_purchase NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── WISHLISTS ────────────────────────────
CREATE TABLE wishlists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- ─── REVIEWS ──────────────────────────────
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  body TEXT,
  image_cloudinary_ids TEXT[] DEFAULT '{}',
  admin_reply TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── COUPONS ──────────────────────────────
CREATE TABLE coupons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL,
  value NUMERIC(10,2) NOT NULL,
  min_order_amount NUMERIC(10,2) DEFAULT 0,
  max_uses INT,
  used_count INT DEFAULT 0,
  valid_from TIMESTAMPTZ DEFAULT NOW(),
  valid_to TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── WINK POINTS LOG ──────────────────────
CREATE TABLE wink_points_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  points_earned INT DEFAULT 0,
  points_spent INT DEFAULT 0,
  balance_after INT NOT NULL,
  action TEXT NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── BANNERS ──────────────────────────────
CREATE TABLE banners (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  cloudinary_public_id TEXT,
  cta_text TEXT,
  cta_link TEXT,
  position TEXT DEFAULT 'hero',
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT false,
  valid_from TIMESTAMPTZ,
  valid_to TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── ANNOUNCEMENTS ────────────────────────
CREATE TABLE announcements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  text TEXT NOT NULL,
  link TEXT,
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── HOMEPAGE SECTIONS ────────────────────
CREATE TABLE homepage_sections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  section_key TEXT UNIQUE NOT NULL,
  title TEXT,
  config JSONB DEFAULT '{}',
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── NOTIFY ME ────────────────────────────
CREATE TABLE notify_me (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  variant_id UUID REFERENCES product_variants(id) ON DELETE CASCADE NOT NULL,
  email TEXT,
  phone TEXT,
  notified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── SITE SETTINGS ────────────────────────
CREATE TABLE site_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default site settings
INSERT INTO site_settings (key, value) VALUES
  ('free_shipping_threshold', '{"amount": 999}'),
  ('razorpay_live_mode', '{"enabled": false}'),
  ('cod_enabled', '{"enabled": true}'),
  ('wink_points_rate', '{"earn_per_rupee": 1, "redeem_per_point": 0.1}'),
  ('whatsapp_number', '{"number": ""}'),
  ('store_email', '{"email": ""}'),
  ('announcement_bar_speed', '{"ms": 3000}')
ON CONFLICT (key) DO NOTHING;

-- Insert default homepage sections
INSERT INTO homepage_sections (section_key, title, sort_order, is_active) VALUES
  ('announcement_bar', 'Announcement Bar', 1, false),
  ('hero_banner', 'Hero Banner', 2, false),
  ('trust_strip', 'Trust Strip', 3, true),
  ('category_highlights', 'Category Highlights', 4, false),
  ('new_arrivals', 'New Arrivals', 5, false),
  ('featured_collection', 'Featured Collection', 6, false),
  ('instagram_feed', 'Instagram / UGC Feed', 7, false),
  ('newsletter', 'Newsletter Signup', 8, true)
ON CONFLICT (section_key) DO NOTHING;

-- ─── FUNCTIONS & TRIGGERS ─────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE OR REPLACE TRIGGER orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE OR REPLACE TRIGGER users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.order_number := 'LW-' || TO_CHAR(NOW(), 'YYYY') || '-' || 
    LPAD(CAST(FLOOR(RANDOM() * 90000 + 10000) AS TEXT), 5, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER set_order_number BEFORE INSERT ON orders FOR EACH ROW WHEN (NEW.order_number IS NULL) EXECUTE FUNCTION generate_order_number();

-- ─── RLS POLICIES ─────────────────────────
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE wink_points_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE homepage_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE notify_me ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_categories" ON categories FOR SELECT USING (is_active = true);
CREATE POLICY "public_read_products" ON products FOR SELECT USING (is_active = true);
CREATE POLICY "public_read_variants" ON product_variants FOR SELECT USING (is_active = true);
CREATE POLICY "public_read_images" ON product_images FOR SELECT USING (true);
CREATE POLICY "public_read_banners" ON banners FOR SELECT USING (is_active = true);
CREATE POLICY "public_read_announcements" ON announcements FOR SELECT USING (is_active = true);
CREATE POLICY "public_read_homepage_sections" ON homepage_sections FOR SELECT USING (is_active = true);
CREATE POLICY "public_read_site_settings" ON site_settings FOR SELECT USING (true);
CREATE POLICY "public_read_approved_reviews" ON reviews FOR SELECT USING (status = 'approved');

CREATE POLICY "users_own_profile" ON users FOR ALL USING (auth.uid() = id);
CREATE POLICY "users_own_addresses" ON addresses FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "users_own_orders" ON orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "users_insert_orders" ON orders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users_own_order_items" ON order_items FOR SELECT USING (EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid()));
CREATE POLICY "users_own_wishlist" ON wishlists FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "users_insert_review" ON reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users_own_reviews" ON reviews FOR SELECT USING (auth.uid() = user_id OR status = 'approved');
CREATE POLICY "users_own_points" ON wink_points_log FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "anyone_notify_me" ON notify_me FOR INSERT WITH CHECK (true);
CREATE POLICY "public_validate_coupon" ON coupons FOR SELECT USING (is_active = true);

-- ─── AUTH TRIGGER ────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, name, phone, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', NEW.phone),
    COALESCE(NEW.email, ''),
    'customer'
  ) ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─── HELPER FUNCTIONS ────────────────────
CREATE OR REPLACE FUNCTION get_daily_revenue_last_7_days()
RETURNS TABLE (date TEXT, revenue NUMERIC) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    TO_CHAR(DATE_TRUNC('day', created_at), 'Mon DD') as date,
    COALESCE(SUM(total), 0) as revenue
  FROM orders WHERE payment_status = 'paid' AND created_at >= NOW() - INTERVAL '7 days'
  GROUP BY DATE_TRUNC('day', created_at) ORDER BY DATE_TRUNC('day', created_at);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION reduce_stock(var_id UUID, qty INT)
RETURNS VOID AS $$
BEGIN
  UPDATE product_variants SET stock_qty = stock_qty - qty WHERE id = var_id;
END;
$$ LANGUAGE plpgsql;

-- ─── NEWSLETTER ──────────────────────────
CREATE TABLE newsletter_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE newsletter_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can subscribe" ON newsletter_subscriptions FOR INSERT WITH CHECK (true);
