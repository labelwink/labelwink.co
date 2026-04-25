-- Check and create missing tables
CREATE TABLE IF NOT EXISTS banners (
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

CREATE TABLE IF NOT EXISTS announcements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  text TEXT NOT NULL,
  link TEXT,
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS homepage_sections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  section_key TEXT UNIQUE NOT NULL,
  title TEXT,
  config JSONB DEFAULT '{}',
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE homepage_sections ENABLE ROW LEVEL SECURITY;

-- Public read policies
DROP POLICY IF EXISTS " public_read_active_banners\ ON banners;
CREATE POLICY \public_read_active_banners\ ON banners FOR SELECT USING (is_active = true);
DROP POLICY IF EXISTS \public_read_active_announcements\ ON announcements;
CREATE POLICY \public_read_active_announcements\ ON announcements FOR SELECT USING (is_active = true);
DROP POLICY IF EXISTS \public_read_homepage_sections\ ON homepage_sections;
CREATE POLICY \public_read_homepage_sections\ ON homepage_sections FOR SELECT USING (is_active = true);

-- Seed default homepage sections
INSERT INTO homepage_sections (section_key, title, sort_order, is_active) VALUES
 ('announcement_bar', 'Announcement Bar', 1, false),
 ('hero_banner', 'Hero Banner', 2, false),
 ('trust_strip', 'Trust Strip', 3, true),
 ('category_highlights', 'Category Highlights', 4, false),
 ('new_arrivals', 'New Arrivals', 5, false),
 ('featured_collection', 'Featured Collection', 6, false),
 ('instagram_feed', 'Instagram Feed', 7, false),
 ('newsletter', 'Newsletter', 8, true)
ON CONFLICT (section_key) DO NOTHING;

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
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

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS \public_read_categories\ ON categories;
CREATE POLICY \public_read_categories\ ON categories FOR SELECT USING (is_active = true);

INSERT INTO categories (name, slug, sort_order, is_active) VALUES
 ('New Arrivals', 'new-arrivals', 1, true),
 ('Kurtas', 'kurtas', 2, true),
 ('Kurta Sets', 'kurta-sets', 3, true),
 ('Co-ords', 'co-ords', 4, true),
 ('Dresses', 'dresses', 5, true),
 ('Tops', 'tops', 6, true),
 ('Bottoms', 'bottoms', 7, true),
 ('Sale', 'sale', 8, true)
ON CONFLICT (slug) DO NOTHING;
