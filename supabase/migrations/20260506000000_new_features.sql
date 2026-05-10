-- New categories, occasions, size surcharge, about us fields, homepage sections
-- Migration: 20260506000000_new_features.sql

-- Create occasions table
CREATE TABLE IF NOT EXISTS occasions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE occasions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_occasions" ON occasions FOR SELECT USING (true);

-- Add new collections
INSERT INTO collections (name, slug, description, visible, sort_order)
VALUES
  ('Kurti Sets',     'kurti-sets',    'Matching kurti and bottom sets', true, 1),
  ('Co-ords',        'co-ords',       'Coordinated top and bottom sets', true, 2),
  ('A-Line Tops',    'aline-tops',    'Elegant A-line style tops', true, 3),
  ('Western Wear',   'western-wear',  'Contemporary western styles', true, 4),
  ('Anarkali',       'anarkali',      'Traditional Anarkali suits', true, 5)
ON CONFLICT (slug) DO NOTHING;

-- Add new occasions
INSERT INTO occasions (name, slug, description, is_active, sort_order)
VALUES
  ('Casual',    'casual',    'Everyday casual wear', true, 1),
  ('Festive',   'festive',   'Festival and celebration wear', true, 2),
  ('Party',     'party',     'Party and night out styles', true, 3),
  ('Wedding',   'wedding',   'Wedding and formal occasions', true, 4),
  ('Office',    'office',    'Professional office wear', true, 5)
ON CONFLICT (slug) DO NOTHING;

-- Add size surcharge fields to shop_settings
ALTER TABLE shop_settings
  ADD COLUMN IF NOT EXISTS size_surcharge_enabled boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS size_surcharge_from_size text DEFAULT '4XL',
  ADD COLUMN IF NOT EXISTS size_surcharge_amount numeric DEFAULT 100;

-- Update default values
UPDATE shop_settings SET
  size_surcharge_enabled = true,
  size_surcharge_from_size = '4XL',
  size_surcharge_amount = 100;

-- Add about us fields to shop_settings
ALTER TABLE shop_settings
  ADD COLUMN IF NOT EXISTS about_us_text text,
  ADD COLUMN IF NOT EXISTS about_us_image_url text;

-- Create homepage_sections table
CREATE TABLE IF NOT EXISTS homepage_sections (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  section_key text UNIQUE NOT NULL,
  is_visible boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  config jsonb DEFAULT '{}',
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE homepage_sections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_manage_sections" ON homepage_sections FOR ALL USING (true);

-- Insert default homepage sections
INSERT INTO homepage_sections (section_key, is_visible, sort_order)
VALUES
  ('hero_banner',        true, 1),
  ('flash_sale',         true, 2),
  ('featured_products',  true, 3),
  ('collections_grid',   true, 4),
  ('occasions_grid',     true, 5),
  ('trust_badges',       true, 6),
  ('newsletter',         true, 7)
ON CONFLICT (section_key) DO NOTHING;

-- Update product_variants size constraint
ALTER TABLE product_variants DROP CONSTRAINT IF EXISTS valid_size;
ALTER TABLE product_variants ADD CONSTRAINT valid_size
  CHECK (size IN (
    'XXS','XS','S','M','L',
    'XL','2XL','3XL','4XL','5XL','6XL',
    'Free Size'
  ));

-- Update shop_settings for size surcharge
UPDATE shop_settings SET
  size_surcharge_from_size = '4XL',
  size_surcharge_amount = 100,
  size_surcharge_enabled = true;

NOTIFY pgrst, 'reload schema';