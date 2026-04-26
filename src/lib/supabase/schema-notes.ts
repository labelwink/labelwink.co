/*
RUN THESE IN SUPABASE SQL EDITOR IF TABLES ARE MISSING:

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
