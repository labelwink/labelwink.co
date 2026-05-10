/*
 * ═══════════════════════════════════════════════════════════════════
 * LabelWink — Supabase Schema Notes
 * This file is the single source of truth for all DB schema changes.
 * ALL SQL must be run in the Supabase SQL Editor.
 * ═══════════════════════════════════════════════════════════════════
 
 * ─────────────────────────────────────────────────────────────────
 * PRE-EXISTING SCHEMA (from earlier batches)
 * ─────────────────────────────────────────────────────────────────
 
 -- Profiles table
 CREATE TABLE IF NOT EXISTS profiles (
   id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
   full_name text,
   phone text,
   role text DEFAULT 'customer',
   avatar_url text,
   created_at timestamptz DEFAULT now()
 );
 ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
 CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
 CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
 
 -- Wishlists
 CREATE TABLE IF NOT EXISTS wishlists (
   id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
   user_id uuid REFERENCES auth.users ON DELETE CASCADE,
   product_id uuid REFERENCES products ON DELETE CASCADE,
   created_at timestamptz DEFAULT now(),
   UNIQUE(user_id, product_id)
 );
 ALTER TABLE wishlists ENABLE ROW LEVEL SECURITY;
 CREATE POLICY "Users can manage own wishlist" ON wishlists USING (auth.uid() = user_id);
 
 -- CMS content
 CREATE TABLE IF NOT EXISTS cms_content (
   page text PRIMARY KEY,
   content jsonb DEFAULT '{}',
   updated_at timestamptz DEFAULT now()
 );
 
 -- Settings
 CREATE TABLE IF NOT EXISTS settings (
   key text PRIMARY KEY,
   value jsonb,
   updated_at timestamptz DEFAULT now()
 );
 
 -- Collections extensions
 ALTER TABLE collections ADD COLUMN IF NOT EXISTS is_featured boolean DEFAULT false;
 ALTER TABLE collections ADD COLUMN IF NOT EXISTS sort_order integer DEFAULT 0;
 
 * ─────────────────────────────────────────────────────────────────
 * BATCH 1A: EXTEND ORDERS TABLE
 * ─────────────────────────────────────────────────────────────────
 
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
 
 * ─────────────────────────────────────────────────────────────────
 * BATCH 1B: ORDER MANAGEMENT TABLES
 * ─────────────────────────────────────────────────────────────────
 
 CREATE TABLE IF NOT EXISTS order_status_history (
   id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
   order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
   status text NOT NULL,
   note text,
   changed_by text DEFAULT 'admin',
   created_at timestamptz DEFAULT now()
 );
 ALTER TABLE order_status_history ENABLE ROW LEVEL SECURITY;
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
 CREATE POLICY "user_own_returns" ON return_requests USING (auth.uid() = user_id);
 CREATE POLICY "admin_all_returns" ON return_requests USING (true);
 
 * ─────────────────────────────────────────────────────────────────
 * BATCH 1C: DISCOUNTS & LOYALTY
 * ─────────────────────────────────────────────────────────────────
 
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
 CREATE POLICY "user_own_loyalty_tx" ON loyalty_transactions
   USING (auth.uid() = user_id);
 CREATE POLICY "admin_all_loyalty_tx" ON loyalty_transactions USING (true);
 
 * ─────────────────────────────────────────────────────────────────
 * BATCH 1D: PROFILES & ADDRESSES (extend existing profiles)
 * ─────────────────────────────────────────────────────────────────
 
 ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email text;
 ALTER TABLE profiles ADD COLUMN IF NOT EXISTS date_of_birth date;
 ALTER TABLE profiles ADD COLUMN IF NOT EXISTS gender text CHECK (gender IN ('male','female','other','prefer_not_to_say'));
 ALTER TABLE profiles ADD COLUMN IF NOT EXISTS chest numeric;
 ALTER TABLE profiles ADD COLUMN IF NOT EXISTS waist numeric;
 ALTER TABLE profiles ADD COLUMN IF NOT EXISTS hips numeric;
 ALTER TABLE profiles ADD COLUMN IF NOT EXISTS height numeric;
 ALTER TABLE profiles ADD COLUMN IF NOT EXISTS weight numeric;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS loyalty_tier text DEFAULT 'Bronze';
 ALTER TABLE profiles ADD COLUMN IF NOT EXISTS referral_code text UNIQUE DEFAULT UPPER(LEFT(gen_random_uuid()::text, 8));
 ALTER TABLE profiles ADD COLUMN IF NOT EXISTS referred_by uuid REFERENCES auth.users(id);
 ALTER TABLE profiles ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
 ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role text DEFAULT 'customer'
   CHECK (role IN ('customer','admin','store_manager','warehouse','support','finance'));
 
 -- Fix admin policy to allow admin access
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
 CREATE POLICY "user_own_addresses" ON addresses USING (auth.uid() = user_id);
 CREATE POLICY "admin_all_addresses" ON addresses USING (true);
 
 * ─────────────────────────────────────────────────────────────────
 * BATCH 1E: PRODUCTS & INVENTORY EXTENSIONS
 * ─────────────────────────────────────────────────────────────────
 
 ALTER TABLE products ADD COLUMN IF NOT EXISTS compare_at_price numeric;
 ALTER TABLE products ADD COLUMN IF NOT EXISTS status text DEFAULT 'published'
   CHECK (status IN ('draft','published','archived'));
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
 
 * ─────────────────────────────────────────────────────────────────
 * BATCH 1F: REVIEWS (enhance existing table)
 * ─────────────────────────────────────────────────────────────────
 
 ALTER TABLE reviews ADD COLUMN IF NOT EXISTS title text;
 ALTER TABLE reviews ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending'
   CHECK (status IN ('pending','approved','rejected'));
 ALTER TABLE reviews ADD COLUMN IF NOT EXISTS is_verified_purchase boolean DEFAULT false;
 ALTER TABLE reviews ADD COLUMN IF NOT EXISTS admin_reply text;
 
 -- Fix policies
 DROP POLICY IF EXISTS "reviews_read" ON reviews;
 DROP POLICY IF EXISTS "reviews_insert" ON reviews;
 CREATE POLICY "public_approved_reviews" ON reviews FOR SELECT USING (status = 'approved');
 CREATE POLICY "user_own_reviews" ON reviews USING (auth.uid() = user_id);
 CREATE POLICY "admin_all_reviews" ON reviews USING (true);
 
 * ─────────────────────────────────────────────────────────────────
 * BATCH 1G: WISHLIST (enhance existing table)
 * ─────────────────────────────────────────────────────────────────
 
 ALTER TABLE wishlists ADD COLUMN IF NOT EXISTS variant_id uuid REFERENCES product_variants(id);
 ALTER TABLE wishlists RENAME COLUMN created_at TO added_at;
 -- (Run rename only if column exists with old name)
 
 * ─────────────────────────────────────────────────────────────────
 * BATCH 1H: CMS & CONTENT TABLES
 * ─────────────────────────────────────────────────────────────────
 
 CREATE TABLE IF NOT EXISTS banners (
   id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
   title text,
   image_url text,
   mobile_image_url text,
   target_url text,
   position text DEFAULT 'hero' CHECK (position IN ('hero','category','sidebar','announcement')),
   starts_at timestamptz,
   ends_at timestamptz,
   is_active boolean DEFAULT true,
   sort_order integer DEFAULT 0,
   variant_a_url text,
   variant_b_url text,
   click_count_a integer DEFAULT 0,
   click_count_b integer DEFAULT 0,
   created_at timestamptz DEFAULT now()
 );
 ALTER TABLE banners ENABLE ROW LEVEL SECURITY;
 CREATE POLICY "admin_all_banners" ON banners USING (true);
 CREATE POLICY "public_read_active_banners" ON banners FOR SELECT
   USING (is_active = true AND (starts_at IS NULL OR starts_at <= now())
     AND (ends_at IS NULL OR ends_at >= now()));
 
 CREATE TABLE IF NOT EXISTS pages (
   id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
   slug text UNIQUE NOT NULL,
   title text,
   meta_title text,
   meta_description text,
   content jsonb,
   is_published boolean DEFAULT false,
   published_at timestamptz,
   created_at timestamptz DEFAULT now(),
   updated_at timestamptz DEFAULT now()
 );
 ALTER TABLE pages ENABLE ROW LEVEL SECURITY;
 CREATE POLICY "admin_all_pages" ON pages USING (true);
 CREATE POLICY "public_published_pages" ON pages FOR SELECT USING (is_published = true);
 
 CREATE TABLE IF NOT EXISTS blog_posts (
   id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
   slug text UNIQUE NOT NULL,
   title text,
   body text,
   excerpt text,
   cover_image_url text,
   author_name text,
   tags text[],
   meta_title text,
   meta_description text,
   og_image_url text,
   related_product_ids uuid[],
   is_published boolean DEFAULT false,
   published_at timestamptz,
   created_at timestamptz DEFAULT now(),
   updated_at timestamptz DEFAULT now()
 );
 ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
 CREATE POLICY "admin_all_posts" ON blog_posts USING (true);
 CREATE POLICY "public_published_posts" ON blog_posts FOR SELECT USING (is_published = true);
 
 * ─────────────────────────────────────────────────────────────────
 * BATCH 1I: ADMIN SYSTEM TABLES
 * ─────────────────────────────────────────────────────────────────
 
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
 CREATE POLICY "admin_only_logs" ON audit_logs USING (true);
 
 -- Extend admin_notifications (already exists, add is_read if missing)
 ALTER TABLE admin_notifications ADD COLUMN IF NOT EXISTS is_read boolean DEFAULT false;
 ALTER TABLE admin_notifications ADD COLUMN IF NOT EXISTS type text;
 ALTER TABLE admin_notifications ADD COLUMN IF NOT EXISTS title text;
 ALTER TABLE admin_notifications ADD COLUMN IF NOT EXISTS body text;
 ALTER TABLE admin_notifications ADD COLUMN IF NOT EXISTS data jsonb;
 ALTER TABLE admin_notifications ENABLE ROW LEVEL SECURITY;
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
 CREATE POLICY "admin_all_templates" ON email_templates USING (true);
 
 * ─────────────────────────────────────────────────────────────────
 * BATCH 1J: DB TRIGGERS
 * ─────────────────────────────────────────────────────────────────
 
 -- Auto-generate invoice on order insert
 CREATE OR REPLACE FUNCTION generate_invoice()
 RETURNS TRIGGER AS $$
 DECLARE
   cgst numeric := 0;
   sgst numeric := 0;
   igst numeric := 0;
 BEGIN
   IF NEW.total > 1000 THEN
     IF NEW.is_inter_state THEN
       igst := ROUND(NEW.subtotal * 0.12, 2);
     ELSE
       cgst := ROUND(NEW.subtotal * 0.06, 2);
       sgst := ROUND(NEW.subtotal * 0.06, 2);
     END IF;
   END IF;
   INSERT INTO invoices (
     order_id, invoice_number, total, subtotal,
     cgst, sgst, igst, shipping, discount, data
   ) VALUES (
     NEW.id,
     'INV-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || UPPER(LEFT(NEW.id::text, 6)),
     NEW.total, NEW.subtotal, cgst, sgst, igst,
     COALESCE(NEW.shipping_amount, 0),
     COALESCE(NEW.discount_amount, 0),
     jsonb_build_object(
       'customer_name', NEW.customer_name,
       'customer_email', NEW.customer_email,
       'customer_phone', NEW.customer_phone
     )
   );
   RETURN NEW;
 END;
 $$ LANGUAGE plpgsql;
 DROP TRIGGER IF EXISTS on_order_created ON orders;
 CREATE TRIGGER on_order_created
   AFTER INSERT ON orders FOR EACH ROW EXECUTE FUNCTION generate_invoice();
 
 -- Auto-log status changes
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
   AFTER UPDATE OF status ON orders FOR EACH ROW EXECUTE FUNCTION log_order_status();
 
 -- Stock management on status change
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
   AFTER UPDATE OF status ON orders FOR EACH ROW EXECUTE FUNCTION manage_stock_on_status();
 
 -- Auto-create loyalty record + profile for new users
 CREATE OR REPLACE FUNCTION create_loyalty_on_signup()
 RETURNS TRIGGER AS $$
 BEGIN
   INSERT INTO loyalty_points (user_id, balance, lifetime_earned)
   VALUES (NEW.id, 0, 0) ON CONFLICT (user_id) DO NOTHING;
   INSERT INTO profiles (id, email)
   VALUES (NEW.id, NEW.email) ON CONFLICT (id) DO NOTHING;
   RETURN NEW;
 END;
 $$ LANGUAGE plpgsql;
 DROP TRIGGER IF EXISTS on_user_signup ON auth.users;
 CREATE TRIGGER on_user_signup
   AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION create_loyalty_on_signup();
 
 NOTIFY pgrst, 'reload schema';
 
 * ─────────────────────────────────────────────────────────────────
 * BATCH 21B: PROFILES ROLE COLUMN (if not already added above)
 * ─────────────────────────────────────────────────────────────────
 
 ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role text DEFAULT 'customer'
   CHECK (role IN ('customer','admin','store_manager','warehouse','support','finance'));
 
 -- Set your admin user (replace with your actual email):
 -- UPDATE profiles SET role = 'admin'
 -- WHERE id = (SELECT id FROM auth.users WHERE email = 'your@email.com');
 
 NOTIFY pgrst, 'reload schema';
 
 * ─────────────────────────────────────────────────────────────────
 * BATCH: PROFILES, ADDRESSES, ORDERS, INVOICES, NOTIFICATIONS, LOYALTY, SETTINGS
 * ─────────────────────────────────────────────────────────────────
 
 -- PROFILES
 CREATE TABLE IF NOT EXISTS profiles (
   id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
   first_name text,
   last_name text,
   email text,
   phone text,
   alt_phone text,
   date_of_birth date,
   gender text,
   avatar_url text,
   chest numeric, waist numeric, hips numeric,
   height numeric, weight numeric,
   created_at timestamptz DEFAULT now(),
   updated_at timestamptz DEFAULT now()
 );
 ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
 DROP POLICY IF EXISTS "user_own_profile" ON profiles;
 DROP POLICY IF EXISTS "admin_all_profiles" ON profiles;
 CREATE POLICY "user_own_profile" ON profiles
   USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
 CREATE POLICY "admin_all_profiles" ON profiles FOR ALL USING (true);
 
 CREATE OR REPLACE FUNCTION handle_new_user()
 RETURNS TRIGGER AS $$
 BEGIN
   INSERT INTO profiles (id, email, first_name)
   VALUES (
     NEW.id,
     NEW.email,
     COALESCE(NEW.raw_user_meta_data->>'full_name',
              NEW.raw_user_meta_data->>'name', '')
   ) ON CONFLICT (id) DO NOTHING;
   RETURN NEW;
 END;
 $$ LANGUAGE plpgsql SECURITY DEFINER;
 DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
 CREATE TRIGGER on_auth_user_created
   AFTER INSERT ON auth.users
   FOR EACH ROW EXECUTE FUNCTION handle_new_user();
 
 -- ADDRESSES
 CREATE TABLE IF NOT EXISTS addresses (
   id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
   user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
   label text DEFAULT 'Home',
   first_name text NOT NULL,
   last_name text,
   phone text NOT NULL,
   alt_phone text,
   line1 text NOT NULL,
   line2 text,
   city text NOT NULL,
   state text NOT NULL,
   pincode text NOT NULL,
   country text DEFAULT 'India',
   is_default boolean DEFAULT false,
   created_at timestamptz DEFAULT now()
 );
 ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;
 DROP POLICY IF EXISTS "user_own_addresses" ON addresses;
 CREATE POLICY "user_own_addresses" ON addresses
   USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
 
 -- ORDERS (add missing columns)
 ALTER TABLE orders ADD COLUMN IF NOT EXISTS subtotal numeric DEFAULT 0;
 ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_amount numeric DEFAULT 0;
 ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_amount numeric DEFAULT 0;
 ALTER TABLE orders ADD COLUMN IF NOT EXISTS tax_amount numeric DEFAULT 0;
 ALTER TABLE orders ADD COLUMN IF NOT EXISTS loyalty_points_used integer DEFAULT 0;
 ALTER TABLE orders ADD COLUMN IF NOT EXISTS coupon_code text;
 ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_name text;
 ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_email text;
 ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_phone text;
 ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_address jsonb;
 ALTER TABLE orders ADD COLUMN IF NOT EXISTS razorpay_order_id text;
 ALTER TABLE orders ADD COLUMN IF NOT EXISTS razorpay_payment_id text;
 ALTER TABLE orders ADD COLUMN IF NOT EXISTS razorpay_signature text;
 ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_carrier text;
 ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_number text;
 ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_url text;
 ALTER TABLE orders ADD COLUMN IF NOT EXISTS shiprocket_order_id text;
 ALTER TABLE orders ADD COLUMN IF NOT EXISTS label_url text;
 ALTER TABLE orders ADD COLUMN IF NOT EXISTS admin_note text;
 ALTER TABLE orders ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending';
 ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'paid';
 ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_method text DEFAULT 'standard';
 
 -- ORDER ITEMS (add missing columns)
 ALTER TABLE order_items ADD COLUMN IF NOT EXISTS product_name text;
 ALTER TABLE order_items ADD COLUMN IF NOT EXISTS product_image text;
 ALTER TABLE order_items ADD COLUMN IF NOT EXISTS size text;
 ALTER TABLE order_items ADD COLUMN IF NOT EXISTS color text;
 ALTER TABLE order_items ADD COLUMN IF NOT EXISTS sku text;
 ALTER TABLE order_items ADD COLUMN IF NOT EXISTS unit_price numeric DEFAULT 0;
 ALTER TABLE order_items ADD COLUMN IF NOT EXISTS total_price numeric DEFAULT 0;
 
 -- INVOICES
 CREATE TABLE IF NOT EXISTS invoices (
   id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
   order_id uuid REFERENCES orders(id) ON DELETE CASCADE UNIQUE,
   invoice_number text UNIQUE NOT NULL,
   issued_at timestamptz DEFAULT now(),
   subtotal numeric DEFAULT 0,
   discount numeric DEFAULT 0,
   shipping numeric DEFAULT 0,
   cgst numeric DEFAULT 0,
   sgst numeric DEFAULT 0,
   igst numeric DEFAULT 0,
   total numeric DEFAULT 0,
   data jsonb DEFAULT '{}'
 );
 ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
 DROP POLICY IF EXISTS "user_own_invoices" ON invoices;
 DROP POLICY IF EXISTS "admin_all_invoices" ON invoices;
 CREATE POLICY "user_own_invoices" ON invoices FOR SELECT
   USING (order_id IN (SELECT id FROM orders WHERE user_id = auth.uid()));
 CREATE POLICY "admin_all_invoices" ON invoices FOR ALL USING (true);
 
 CREATE OR REPLACE FUNCTION generate_invoice_on_order()
 RETURNS TRIGGER AS $$
 DECLARE
   inv_number text;
   cgst_amt numeric := 0;
   sgst_amt numeric := 0;
 BEGIN
   inv_number := 'INV-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-'
                 || UPPER(SUBSTRING(NEW.id::text FROM 1 FOR 6));
   IF COALESCE(NEW.subtotal, 0) > 1000 THEN
     cgst_amt := ROUND((COALESCE(NEW.subtotal, 0) * 0.06)::numeric, 2);
     sgst_amt := cgst_amt;
   END IF;
   INSERT INTO invoices (
     order_id, invoice_number, subtotal, discount,
     shipping, cgst, sgst, igst, total, data
   ) VALUES (
     NEW.id, inv_number,
     COALESCE(NEW.subtotal, 0),
     COALESCE(NEW.discount_amount, 0),
     COALESCE(NEW.shipping_amount, 0),
     cgst_amt, sgst_amt, 0,
     COALESCE(NEW.total, 0),
     jsonb_build_object(
       'customer_name', NEW.customer_name,
       'customer_email', NEW.customer_email,
       'customer_phone', NEW.customer_phone,
       'shipping_address', NEW.shipping_address
     )
   ) ON CONFLICT (order_id) DO NOTHING;
   RETURN NEW;
 END;
 $$ LANGUAGE plpgsql SECURITY DEFINER;
 DROP TRIGGER IF EXISTS on_order_created_invoice ON orders;
 CREATE TRIGGER on_order_created_invoice
   AFTER INSERT ON orders
   FOR EACH ROW EXECUTE FUNCTION generate_invoice_on_order();
 
 -- ORDER STATUS HISTORY
 CREATE TABLE IF NOT EXISTS order_status_history (
   id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
   order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
   status text NOT NULL,
   note text,
   changed_by text DEFAULT 'system',
   created_at timestamptz DEFAULT now()
 );
 ALTER TABLE order_status_history ENABLE ROW LEVEL SECURITY;
 DROP POLICY IF EXISTS "admin_status_history" ON order_status_history;
 DROP POLICY IF EXISTS "user_own_status_history" ON order_status_history;
 CREATE POLICY "admin_status_history" ON order_status_history FOR ALL USING (true);
 CREATE POLICY "user_own_status_history" ON order_status_history FOR SELECT
   USING (order_id IN (SELECT id FROM orders WHERE user_id = auth.uid()));
 
 CREATE OR REPLACE FUNCTION log_order_status_change()
 RETURNS TRIGGER AS $$
 BEGIN
   IF NEW.status IS DISTINCT FROM OLD.status THEN
     INSERT INTO order_status_history (order_id, status, changed_by)
     VALUES (NEW.id, NEW.status, 'system');
   END IF;
   RETURN NEW;
 END;
 $$ LANGUAGE plpgsql;
 DROP TRIGGER IF EXISTS on_order_status_change ON orders;
 CREATE TRIGGER on_order_status_change
   AFTER UPDATE OF status ON orders
   FOR EACH ROW EXECUTE FUNCTION log_order_status_change();
 
 -- ADMIN NOTIFICATIONS
 CREATE TABLE IF NOT EXISTS admin_notifications (
   id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
   type text NOT NULL,
   title text NOT NULL,
   body text,
   read boolean DEFAULT false,
   entity_type text,
   entity_id text,
   data jsonb DEFAULT '{}',
   created_at timestamptz DEFAULT now()
 );
 ALTER TABLE admin_notifications ENABLE ROW LEVEL SECURITY;
 DROP POLICY IF EXISTS "admin_notifications_all" ON admin_notifications;
 CREATE POLICY "admin_notifications_all" ON admin_notifications USING (true);
 
 -- LOYALTY POINTS
 CREATE TABLE IF NOT EXISTS loyalty_points (
   id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
   user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
   balance integer DEFAULT 0,
   lifetime_earned integer DEFAULT 0,
   updated_at timestamptz DEFAULT now()
 );
 ALTER TABLE loyalty_points ENABLE ROW LEVEL SECURITY;
 DROP POLICY IF EXISTS "user_own_loyalty" ON loyalty_points;
 DROP POLICY IF EXISTS "admin_all_loyalty" ON loyalty_points;
 CREATE POLICY "user_own_loyalty" ON loyalty_points USING (auth.uid() = user_id);
 CREATE POLICY "admin_all_loyalty" ON loyalty_points FOR ALL USING (true);
 
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
 CREATE POLICY "user_own_loyalty_tx" ON loyalty_transactions
   USING (auth.uid() = user_id);
 CREATE POLICY "admin_all_loyalty_tx" ON loyalty_transactions USING (true);
 
 -- SHOP SETTINGS
 CREATE TABLE IF NOT EXISTS shop_settings (
   id integer DEFAULT 1 PRIMARY KEY CHECK (id = 1),
   store_name text DEFAULT 'LabelWink',
   store_tagline text,
   store_email text,
   store_phone text,
   store_address text,
   store_city text,
   store_state text DEFAULT 'Tamil Nadu',
   store_pincode text,
   gst_number text,
   hsn_code text DEFAULT '6211',
   logo_url text,
   favicon_url text,
   currency text DEFAULT 'INR',
   free_shipping_threshold numeric DEFAULT 999,
   standard_shipping_charge numeric DEFAULT 79,
   express_shipping_charge numeric DEFAULT 149,
   loyalty_enabled boolean DEFAULT true,
   loyalty_points_per_rupee numeric DEFAULT 1,
   loyalty_redemption_ratio numeric DEFAULT 100,
   return_window_days integer DEFAULT 7,
   invoice_footer_note text DEFAULT
     'Goods once sold are not returnable if tampered or damaged. Returns accepted within 7 days of delivery.',
   invoice_terms text DEFAULT
     'All prices are inclusive of GST where applicable. For support contact us.',
   label_warning_text text DEFAULT 'Handle with care. Do not bend.',
   shiprocket_mode text DEFAULT 'test',
   razorpay_key_id text,
   updated_at timestamptz DEFAULT now()
 );
 INSERT INTO shop_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;
 ALTER TABLE shop_settings ENABLE ROW LEVEL SECURITY;
 DROP POLICY IF EXISTS "public_read_settings" ON shop_settings;
 DROP POLICY IF EXISTS "admin_write_settings" ON shop_settings;
 CREATE POLICY "public_read_settings" ON shop_settings FOR SELECT USING (true);
 CREATE POLICY "admin_write_settings" ON shop_settings FOR ALL USING (true);
 
 -- Add bg_color + text_color to shop_settings
 ALTER TABLE shop_settings ADD COLUMN IF NOT EXISTS
   announcement_bar_bg text DEFAULT '#c9a84c';
 ALTER TABLE shop_settings ADD COLUMN IF NOT EXISTS
   announcement_bar_text_color text DEFAULT '#ffffff';
 ALTER TABLE shop_settings ADD COLUMN IF NOT EXISTS
   announcement_bar_link text;
 
 NOTIFY pgrst, 'reload schema';
 
 * ─────────────────────────────────────────────────────────────────
 * BATCH: HOMEPAGE CMS (Phase 2)
 * ─────────────────────────────────────────────────────────────────
 
 -- ── BANNERS (hero + promotional) ─────────────────
 CREATE TABLE IF NOT EXISTS banners (
   id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
   title text NOT NULL,
   subtitle text,
   cta_text text,
   cta_url text,
   image_url text NOT NULL,
   mobile_image_url text,
   position text DEFAULT 'hero',
   sort_order integer DEFAULT 0,
   is_active boolean DEFAULT true,
   starts_at timestamptz,
   ends_at timestamptz,
   created_at timestamptz DEFAULT now(),
   updated_at timestamptz DEFAULT now()
 );
 ALTER TABLE banners ENABLE ROW LEVEL SECURITY;
 DROP POLICY IF EXISTS "public_read_banners" ON banners;
 DROP POLICY IF EXISTS "admin_all_banners" ON banners;
 CREATE POLICY "public_read_banners" ON banners FOR SELECT USING (true);
 CREATE POLICY "admin_all_banners" ON banners FOR ALL USING (true);
 
 -- ── HOMEPAGE SECTIONS ─────────────────────────────
 CREATE TABLE IF NOT EXISTS homepage_sections (
   id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
   section_key text UNIQUE NOT NULL,
   title text,
   subtitle text,
   body text,
   image_url text,
   cta_text text,
   cta_url text,
   is_active boolean DEFAULT true,
   sort_order integer DEFAULT 0,
   config jsonb DEFAULT '{}',
   updated_at timestamptz DEFAULT now()
 );
 ALTER TABLE homepage_sections ENABLE ROW LEVEL SECURITY;
 DROP POLICY IF EXISTS "public_read_sections" ON homepage_sections;
 DROP POLICY IF EXISTS "admin_all_sections" ON homepage_sections;
 CREATE POLICY "public_read_sections" ON homepage_sections FOR SELECT USING (true);
 CREATE POLICY "admin_all_sections" ON homepage_sections FOR ALL USING (true);
 
 -- Seed default sections
 INSERT INTO homepage_sections (section_key, title, subtitle, is_active, sort_order) VALUES
   ('announcement_bar', 'Free shipping on orders above ₹3,499', null, false, 0),
   ('featured_collections', 'Shop by Collection', 'Explore our latest arrivals', true, 1),
   ('new_arrivals', 'New Arrivals', 'Fresh styles added daily', true, 2),
   ('shop_by_occasion', 'Shop by Occasion', null, true, 3),
   ('trust_badges', null, null, true, 4),
   ('about_preview', 'Our Story', 'Crafted with love in India', true, 5),
   ('testimonials', 'What Our Customers Say', null, true, 6),
   ('newsletter', 'Stay in the Loop', 'Get updates on new arrivals and exclusive offers', true, 7)
 ON CONFLICT (section_key) DO NOTHING;
 
 -- ── FLASH SALES ───────────────────────────────────
 CREATE TABLE IF NOT EXISTS flash_sales (
   id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
   title text NOT NULL,
   discount_percent numeric NOT NULL,
   starts_at timestamptz NOT NULL,
   ends_at timestamptz NOT NULL,
   banner_image_url text,
   is_active boolean DEFAULT true,
   collection_id uuid,
   created_at timestamptz DEFAULT now()
 );
 ALTER TABLE flash_sales ENABLE ROW LEVEL SECURITY;
 DROP POLICY IF EXISTS "public_read_flash" ON flash_sales;
 DROP POLICY IF EXISTS "admin_all_flash" ON flash_sales;
 CREATE POLICY "public_read_flash" ON flash_sales FOR SELECT USING (true);
 CREATE POLICY "admin_all_flash" ON flash_sales FOR ALL USING (true);
 
 -- ── OCCASIONS ─────────────────────────────────────
 CREATE TABLE IF NOT EXISTS occasions (
   id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
   name text NOT NULL,
   slug text UNIQUE NOT NULL,
   image_url text,
   link_url text,
   sort_order integer DEFAULT 0,
   is_active boolean DEFAULT true
 );
 ALTER TABLE occasions ENABLE ROW LEVEL SECURITY;
 DROP POLICY IF EXISTS "public_read_occasions" ON occasions;
 DROP POLICY IF EXISTS "admin_all_occasions" ON occasions;
 CREATE POLICY "public_read_occasions" ON occasions FOR SELECT USING (true);
 CREATE POLICY "admin_all_occasions" ON occasions FOR ALL USING (true);
 
 INSERT INTO occasions (name, slug, link_url, sort_order) VALUES
   ('Ethnic', 'ethnic', '/products?occasion=ethnic', 0),
   ('Casual', 'casual', '/products?occasion=casual', 1),
   ('Festive', 'festive', '/products?occasion=festive', 2),
   ('Bridal', 'bridal', '/products?occasion=bridal', 3),
   ('Formal', 'formal', '/products?occasion=formal', 4)
 ON CONFLICT (slug) DO NOTHING;
 
 -- ── TRUST BADGES ─────────────────────────────────
 CREATE TABLE IF NOT EXISTS trust_badges (
   id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
   icon text NOT NULL,
   title text NOT NULL,
   subtitle text,
   sort_order integer DEFAULT 0,
   is_active boolean DEFAULT true
 );
 ALTER TABLE trust_badges ENABLE ROW LEVEL SECURITY;
 DROP POLICY IF EXISTS "public_read_badges" ON trust_badges;
 DROP POLICY IF EXISTS "admin_all_badges" ON trust_badges;
 CREATE POLICY "public_read_badges" ON trust_badges FOR SELECT USING (true);
 CREATE POLICY "admin_all_badges" ON trust_badges FOR ALL USING (true);
 
 INSERT INTO trust_badges (icon, title, subtitle, sort_order) VALUES
   ('✨', 'Premium Quality', 'Handpicked fabrics', 0),
   ('🔒', 'Secure Payments', 'Razorpay protected', 1),
   ('🚚', 'Fast Delivery', 'Pan India shipping', 2),
   ('↩️', 'Easy Returns', '7-day return policy', 3)
 ON CONFLICT DO NOTHING;
 
 -- ── ABOUT PAGE ────────────────────────────────────
 CREATE TABLE IF NOT EXISTS about_page (
   id integer DEFAULT 1 PRIMARY KEY CHECK (id = 1),
   hero_title text DEFAULT 'Our Story',
   hero_subtitle text,
   hero_image_url text,
   story_heading text DEFAULT 'Crafted with love in India',
   story_body text,
   mission_heading text DEFAULT 'Our Mission',
   mission_body text,
   team_heading text DEFAULT 'Meet the Team',
   values jsonb DEFAULT '[]',
   updated_at timestamptz DEFAULT now()
 );
 INSERT INTO about_page (id) VALUES (1) ON CONFLICT (id) DO NOTHING;
 ALTER TABLE about_page ENABLE ROW LEVEL SECURITY;
 DROP POLICY IF EXISTS "public_read_about" ON about_page;
 DROP POLICY IF EXISTS "admin_all_about" ON about_page;
 CREATE POLICY "public_read_about" ON about_page FOR SELECT USING (true);
 CREATE POLICY "admin_all_about" ON about_page FOR ALL USING (true);
 
 -- ── FEATURED COLLECTIONS (homepage display) ───────
 ALTER TABLE collections ADD COLUMN IF NOT EXISTS
   is_featured boolean DEFAULT false;
 ALTER TABLE collections ADD COLUMN IF NOT EXISTS
   homepage_sort_order integer DEFAULT 0;
 ALTER TABLE collections ADD COLUMN IF NOT EXISTS
   banner_image_url text;
 ALTER TABLE collections ADD COLUMN IF NOT EXISTS
   subtitle text;
 
 NOTIFY pgrst, 'reload schema';
 
 */
 
 export {}
 
 /*
 -- Phase 2: Social Links Additions
 ALTER TABLE shop_settings ADD COLUMN IF NOT EXISTS social_links jsonb DEFAULT '{}';
 NOTIFY pgrst, 'reload schema';
 
 -- Phase 3: Warehouse workflow, returns, stock deduction
 -- -- RETURNS ---------------------------------------
 CREATE TABLE IF NOT EXISTS returns (
   id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
   order_id uuid REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
   user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
   reason text NOT NULL,
   description text,
   status text DEFAULT 'requested',
   admin_note text,
   refund_amount numeric,
   refund_status text DEFAULT 'pending',
   photos jsonb DEFAULT '[]',
   created_at timestamptz DEFAULT now(),
   updated_at timestamptz DEFAULT now()
 );
 ALTER TABLE returns ENABLE ROW LEVEL SECURITY;
 DROP POLICY IF EXISTS "user_own_returns" ON returns;
 DROP POLICY IF EXISTS "admin_all_returns" ON returns;
 CREATE POLICY "user_own_returns" ON returns
   USING (auth.uid() = user_id)
   WITH CHECK (auth.uid() = user_id);
 CREATE POLICY "admin_all_returns" ON returns FOR ALL USING (true);
 
 -- -- STOCK DEDUCTION TRIGGER -----------------------
 -- Deduct stock when order confirmed, restore when cancelled
 CREATE OR REPLACE FUNCTION handle_order_stock()
 RETURNS TRIGGER AS $$
 DECLARE
   item RECORD;
 BEGIN
   -- Deduct stock on confirmed
   IF NEW.status = 'confirmed' AND OLD.status = 'pending' THEN
     FOR item IN
       SELECT product_id, size, quantity FROM order_items WHERE order_id = NEW.id
     LOOP
       UPDATE product_variants
         SET stock_qty = stock_qty - item.quantity
         WHERE product_id = item.product_id AND size = item.size;
     END LOOP;
   END IF;
 
   -- Restore stock on cancelled
   IF NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
     FOR item IN
       SELECT product_id, size, quantity FROM order_items WHERE order_id = NEW.id
     LOOP
       UPDATE product_variants
         SET stock_qty = stock_qty + item.quantity
         WHERE product_id = item.product_id AND size = item.size;
     END LOOP;
   END IF;
 
   RETURN NEW;
 END;
 $$ LANGUAGE plpgsql SECURITY DEFINER;
 
 DROP TRIGGER IF EXISTS on_order_stock_change ON orders;
 CREATE TRIGGER on_order_stock_change
   AFTER UPDATE OF status ON orders
   FOR EACH ROW EXECUTE FUNCTION handle_order_stock();
 
 -- -- STOCK ALERT THRESHOLD -------------------------
 ALTER TABLE product_variants
   ADD COLUMN IF NOT EXISTS low_stock_threshold integer DEFAULT 5;
 ALTER TABLE product_variants
   ADD COLUMN IF NOT EXISTS warehouse_location text;
 ALTER TABLE product_variants
   ADD COLUMN IF NOT EXISTS sku text;
 
 -- -- INVOICE EDIT LOG ------------------------------
 CREATE TABLE IF NOT EXISTS invoice_edits (
   id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
   invoice_id uuid REFERENCES invoices(id) ON DELETE CASCADE,
   changed_by text DEFAULT 'admin',
   changes jsonb NOT NULL,
   created_at timestamptz DEFAULT now()
 );
 ALTER TABLE invoice_edits ENABLE ROW LEVEL SECURITY;
 CREATE POLICY "admin_invoice_edits" ON invoice_edits FOR ALL USING (true);
 
 -- -- NEWSLETTER SUBSCRIBERS ------------------------
 CREATE TABLE IF NOT EXISTS newsletter_subscribers (
   id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
   email text UNIQUE NOT NULL,
   subscribed_at timestamptz DEFAULT now(),
   is_active boolean DEFAULT true
 );
 ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;
 CREATE POLICY "admin_newsletter" ON newsletter_subscribers FOR ALL USING (true);
 
 NOTIFY pgrst, 'reload schema';
 
 -- ── EMAIL TEMPLATES ───────────────────────────────────────
 CREATE TABLE IF NOT EXISTS email_templates (
   id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
   template_key text UNIQUE NOT NULL,
   subject text NOT NULL,
   preview_text text,
   body_html text NOT NULL,
   is_active boolean DEFAULT true,
   updated_at timestamptz DEFAULT now()
 );
 ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
 CREATE POLICY "admin_email_templates" ON email_templates FOR ALL USING (true);
 
 -- Seed with current template subjects
 INSERT INTO email_templates (template_key, subject, preview_text, body_html) VALUES
   ('order_confirmation', 'Order Confirmed — {{invoice_number}} | {{store_name}}', 'Your order has been confirmed and is being prepared', '<!-- managed by admin -->'),
   ('order_dispatched', 'Your order is on the way! 🚚 — {{invoice_number}}', 'Your order has been dispatched', '<!-- managed by admin -->'),
   ('welcome', 'Welcome to {{store_name}}! 🎉', 'Thanks for joining us', '<!-- managed by admin -->'),
   ('return_approved', 'Your return has been approved — {{invoice_number}}', 'We have approved your return request', '<!-- managed by admin -->')
 ON CONFLICT (template_key) DO NOTHING;
 
 NOTIFY pgrst, 'reload schema';
 */

/**
 * BATCH 7: MARKETING, REFERRALS & ABANDONED CARTS
 * ─────────────────────────────────────────────────────────────────
 */

-- ── ABANDONED CART TRACKING ───────────────────────
-- CREATE TABLE IF NOT EXISTS abandoned_carts (
--   id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
--   user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
--   email text NOT NULL,
--   cart_items jsonb NOT NULL DEFAULT '[]',
--   cart_total numeric DEFAULT 0,
--   recovery_token text UNIQUE DEFAULT gen_random_uuid()::text,
--   email_sent_at timestamptz,
--   email_sent_count integer DEFAULT 0,
--   recovered boolean DEFAULT false,
--   recovered_at timestamptz,
--   created_at timestamptz DEFAULT now(),
--   updated_at timestamptz DEFAULT now()
-- );
-- ALTER TABLE abandoned_carts ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "admin_abandoned_carts" ON abandoned_carts FOR ALL USING (true);
-- CREATE INDEX IF NOT EXISTS idx_abandoned_carts_email ON abandoned_carts (email, updated_at DESC);
-- CREATE INDEX IF NOT EXISTS idx_abandoned_carts_token ON abandoned_carts (recovery_token);

-- ── REFERRALS ─────────────────────────────────────
-- ALTER TABLE profiles ADD COLUMN IF NOT EXISTS referral_code text UNIQUE DEFAULT UPPER(SUBSTRING(gen_random_uuid()::text FROM 1 FOR 8));
-- ALTER TABLE profiles ADD COLUMN IF NOT EXISTS referred_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- CREATE TABLE IF NOT EXISTS referrals (
--   id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
--   referrer_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
--   referred_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
--   status text DEFAULT 'pending',
--   referrer_points_awarded integer DEFAULT 0,
--   referred_points_awarded integer DEFAULT 0,
--   qualifying_order_id uuid REFERENCES orders(id),
--   created_at timestamptz DEFAULT now(),
--   UNIQUE (referred_id)
-- );
-- ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "user_own_referrals" ON referrals USING (auth.uid() = referrer_id OR auth.uid() = referred_id);
-- CREATE POLICY "admin_all_referrals" ON referrals FOR ALL USING (true);

-- ── REFERRAL SETTINGS in shop_settings ────────────
-- ALTER TABLE shop_settings ADD COLUMN IF NOT EXISTS referral_enabled boolean DEFAULT false;
-- ALTER TABLE shop_settings ADD COLUMN IF NOT EXISTS referral_referrer_points integer DEFAULT 200;
-- ALTER TABLE shop_settings ADD COLUMN IF NOT EXISTS referral_referred_points integer DEFAULT 100;
-- ALTER TABLE shop_settings ADD COLUMN IF NOT EXISTS referral_qualifying_min_order numeric DEFAULT 500;

-- ── EMAIL CAMPAIGNS ───────────────────────────────
-- CREATE TABLE IF NOT EXISTS email_campaigns (
--   id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
--   name text NOT NULL,
--   subject text NOT NULL,
--   preview_text text,
--   body_html text NOT NULL,
--   segment text DEFAULT 'all',
--   status text DEFAULT 'draft',
--   scheduled_at timestamptz,
--   sent_at timestamptz,
--   recipient_count integer DEFAULT 0,
--   open_count integer DEFAULT 0,
--   click_count integer DEFAULT 0,
--   created_at timestamptz DEFAULT now(),
--   updated_at timestamptz DEFAULT now()
-- );
-- ALTER TABLE email_campaigns ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "admin_campaigns" ON email_campaigns FOR ALL USING (true);

-- ── SEASONAL SALES ────────────────────────────────
-- CREATE TABLE IF NOT EXISTS seasonal_sales (
--   id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
--   name text NOT NULL,
--   discount_percent numeric NOT NULL,
--   applies_to text DEFAULT 'all',
--   collection_ids uuid[] DEFAULT '{}',
--   product_ids uuid[] DEFAULT '{}',
--   starts_at timestamptz NOT NULL,
--   ends_at timestamptz NOT NULL,
--   is_active boolean DEFAULT true,
--   created_at timestamptz DEFAULT now()
-- );
-- ALTER TABLE seasonal_sales ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "admin_seasonal_sales" ON seasonal_sales FOR ALL USING (true);
-- CREATE POLICY "public_read_seasonal" ON seasonal_sales FOR SELECT USING (true);

-- ── NEWSLETTER CAMPAIGNS LOG ──────────────────────
-- CREATE TABLE IF NOT EXISTS campaign_sends (
--   id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
--   campaign_id uuid REFERENCES email_campaigns(id) ON DELETE CASCADE,
--   email text NOT NULL,
--   sent_at timestamptz DEFAULT now(),
--   status text DEFAULT 'sent'
-- );
-- ALTER TABLE campaign_sends ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "admin_campaign_sends" ON campaign_sends FOR ALL USING (true);

-- NOTIFY pgrst, 'reload schema';
 */


