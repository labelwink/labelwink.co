/*
RUN THESE IN SUPABASE SQL EDITOR IF TABLES ARE MISSING:

-- ==================== BATCH 1 ADDITIONS ====================

-- Wishlists RLS fix
ALTER TABLE wishlists ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "wishlist_policy" ON wishlists;
CREATE POLICY "wishlist_policy" ON wishlists USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id uuid REFERENCES orders(id),
  rating integer CHECK (rating BETWEEN 1 AND 5),
  title text,
  body text,
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reviews_read" ON reviews FOR SELECT USING (status = 'approved' OR auth.uid() = user_id);
CREATE POLICY "reviews_insert" ON reviews FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Orders: add customer info + shipping columns
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_carrier text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_number text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_url text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shiprocket_order_id text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS label_url text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_name text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_email text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_phone text;

-- Notifications table
CREATE TABLE IF NOT EXISTS admin_notifications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  type text, -- 'new_order' | 'low_stock' | 'new_review'
  title text,
  body text,
  read boolean DEFAULT false,
  data jsonb,
  created_at timestamptz DEFAULT now()
);

NOTIFY pgrst, 'reload schema';

-- ============================================================

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

-- Collections: add is_featured and sort_order columns
ALTER TABLE collections ADD COLUMN IF NOT EXISTS is_featured boolean DEFAULT false;
ALTER TABLE collections ADD COLUMN IF NOT EXISTS sort_order integer DEFAULT 0;

-- Set admin role (replace with your email)
INSERT INTO profiles (id, role)
SELECT id, 'admin' FROM auth.users WHERE email = 'YOUR_ADMIN_EMAIL'
ON CONFLICT (id) DO UPDATE SET role = 'admin';
*/

export {}
