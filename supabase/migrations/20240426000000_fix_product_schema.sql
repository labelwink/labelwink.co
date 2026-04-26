-- ============================================================
-- LABEL WINK — Schema Fix Migration
-- Run this in: Supabase Dashboard → SQL Editor → Run
-- 
-- What this does:
--   1. Adds `url` column to product_images (the Cloudinary secure_url)
--   2. Makes cloudinary_public_id nullable (we now store URL directly)
--   3. Adds `alt` column to product_images for alt text from admin form
--   4. Ensures the products RLS policy covers both visible + is_active
-- ============================================================

-- ─── product_images: add url column ───────────────────────
-- This is the primary fix — the app code inserts `url` but the column didn't exist
ALTER TABLE product_images ADD COLUMN IF NOT EXISTS url TEXT;

-- Add alt text column (admin form uses `alt`, DB had `alt_text`)
ALTER TABLE product_images ADD COLUMN IF NOT EXISTS alt TEXT;

-- Make cloudinary_public_id nullable since we now use url as primary field
ALTER TABLE product_images ALTER COLUMN cloudinary_public_id DROP NOT NULL;

-- ─── products RLS: support both visible AND is_active ──────
-- The storefront queries visible=true, but old policy used is_active
DROP POLICY IF EXISTS "public_read_products" ON products;
CREATE POLICY "public_read_products" ON products
  FOR SELECT USING (visible = true OR is_active = true);
