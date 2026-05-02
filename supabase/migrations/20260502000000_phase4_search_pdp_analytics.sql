-- ═══════════════════════════════════════════════════════════════════════════════
-- LabelWink Phase 4: Search, Filters, PDP Improvements, Customer Management
-- Run in: Supabase SQL Editor (https://supabase.com/dashboard/project/cjnuohqnaiggbvmbsqdx/sql/new)
-- ═══════════════════════════════════════════════════════════════════════════════

-- ── PRODUCT ADDITIONAL INFO ───────────────────────────────────────────────────
ALTER TABLE products ADD COLUMN IF NOT EXISTS
  sleeve_type text; -- 'sleeveless' | 'half_sleeve' | 'full_sleeve' | '3/4_sleeve'
ALTER TABLE products ADD COLUMN IF NOT EXISTS
  fit_type text; -- 'regular' | 'slim' | 'oversized' | 'relaxed'
ALTER TABLE products ADD COLUMN IF NOT EXISTS
  fabric_material text;
ALTER TABLE products ADD COLUMN IF NOT EXISTS
  care_instructions text;
ALTER TABLE products ADD COLUMN IF NOT EXISTS
  occasion_tags text[] DEFAULT '{}';
ALTER TABLE products ADD COLUMN IF NOT EXISTS
  size_guide jsonb DEFAULT '{}';
  -- shape: { headers: ['Size','Chest','Waist','Hips','Length'],
  --          rows: [['XS','32','26','34','52'], ...],
  --          unit: 'cm',
  --          guide_image_url: '' }
ALTER TABLE products ADD COLUMN IF NOT EXISTS
  additional_info jsonb DEFAULT '{}';
  -- shape: { key: value } e.g. { 'Pattern': 'Floral', 'Work': 'Embroidery' }
ALTER TABLE products ADD COLUMN IF NOT EXISTS
  search_vector tsvector;

-- ── FULL-TEXT SEARCH INDEX ────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_products_search
  ON products USING GIN (search_vector);

-- ── AUTO-UPDATE search_vector ON INSERT/UPDATE ────────────────────────────────
CREATE OR REPLACE FUNCTION update_product_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', COALESCE(NEW.name, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.fabric_material, '')), 'C') ||
    setweight(to_tsvector('english', COALESCE(NEW.sleeve_type, '')), 'C') ||
    setweight(to_tsvector('english', COALESCE(array_to_string(NEW.occasion_tags, ' '), '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_product_search_update ON products;
CREATE TRIGGER on_product_search_update
  BEFORE INSERT OR UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_product_search_vector();

-- Backfill existing products to populate search_vector
UPDATE products SET name = name;

-- ── PRODUCT VIEWS (analytics) ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS product_views (
  id          uuid      DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id  uuid      REFERENCES products(id) ON DELETE CASCADE,
  session_id  text,
  user_id     uuid      REFERENCES auth.users(id) ON DELETE SET NULL,
  viewed_at   timestamptz DEFAULT now()
);
ALTER TABLE product_views ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone_insert_views"  ON product_views FOR INSERT WITH CHECK (true);
CREATE POLICY "admin_read_views"     ON product_views FOR SELECT USING (true);
CREATE INDEX IF NOT EXISTS idx_product_views_product
  ON product_views (product_id, viewed_at DESC);

-- ── REVIEW ENHANCEMENTS ───────────────────────────────────────────────────────
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS photos           jsonb       DEFAULT '[]';
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS title            text;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS is_verified_purchase boolean DEFAULT false;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS admin_reply      text;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS admin_replied_at timestamptz;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS helpful_count    integer     DEFAULT 0;

-- Auto-mark verified purchase on review insert
CREATE OR REPLACE FUNCTION mark_verified_purchase()
RETURNS TRIGGER AS $$
DECLARE
  order_count integer;
BEGIN
  SELECT COUNT(*) INTO order_count
  FROM orders o
  JOIN order_items oi ON oi.order_id = o.id
  WHERE o.user_id    = NEW.user_id
    AND oi.product_id = NEW.product_id
    AND o.status      = 'delivered';

  NEW.is_verified_purchase := order_count > 0;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_review_verify ON reviews;
CREATE TRIGGER on_review_verify
  BEFORE INSERT ON reviews
  FOR EACH ROW EXECUTE FUNCTION mark_verified_purchase();

-- ── SEARCH LOGS (analytics) ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS search_logs (
  id             uuid    DEFAULT gen_random_uuid() PRIMARY KEY,
  query          text    NOT NULL,
  results_count  integer DEFAULT 0,
  user_id        uuid    REFERENCES auth.users(id) ON DELETE SET NULL,
  searched_at    timestamptz DEFAULT now()
);
ALTER TABLE search_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone_insert_search" ON search_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "admin_read_search"    ON search_logs FOR SELECT USING (true);

-- ── DISCOUNT CODE USES ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS discount_code_uses (
  id                 uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  discount_code_id   uuid REFERENCES discount_codes(id),
  user_id            uuid REFERENCES auth.users(id),
  order_id           uuid REFERENCES orders(id),
  used_at            timestamptz DEFAULT now()
);
ALTER TABLE discount_code_uses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_discount_uses" ON discount_code_uses FOR ALL USING (true);

-- ── RELOAD POSTGREST SCHEMA CACHE ─────────────────────────────────────────────
NOTIFY pgrst, 'reload schema';
