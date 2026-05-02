/**
 * LabelWink — Schema Notes
 * ─────────────────────────────────────────────────────────────────────────────
 * A living record of every SQL migration applied to the Supabase project.
 * Add a block here after each migration is confirmed in the SQL Editor.
 *
 * Project: cjnuohqnaiggbvmbsqdx
 * ─────────────────────────────────────────────────────────────────────────────
 */

export const SCHEMA_NOTES = [
  // ── PHASE 1 — Initial Production Schema ────────────────────────────────────
  {
    file: '20240101000000_production_schema.sql',
    applied: '2024-01-01',
    summary: 'Core tables: profiles, products, product_images, product_variants, categories, orders, order_items, addresses, reviews, wishlists, discount_codes, loyalty_points, loyalty_transactions, shop_settings, admin_users, banners, pages, blog_posts, collections, product_collections, return_requests, invoices, order_status_history, admin_notifications, audit_logs',
  },

  // ── PHASE 2 — Master Fixes ─────────────────────────────────────────────────
  {
    file: '20240102000000_master_fixes.sql',
    applied: '2024-01-02',
    summary: 'Bug fixes and RLS policy corrections from production audit',
  },

  // ── PHASE 3a — RLS Policies ────────────────────────────────────────────────
  {
    file: '20240425000000_policies.sql',
    applied: '2024-04-25',
    summary: 'Granular RLS policies for all tables; admin access via service role',
  },

  // ── PHASE 3b — Pages & Content ─────────────────────────────────────────────
  {
    file: '20240425000001_pages_content.sql',
    applied: '2024-04-25',
    summary: 'CMS pages table with slug uniqueness; blog_posts enhancements',
  },

  // ── PHASE 3c — Product Schema Fix ──────────────────────────────────────────
  {
    file: '20240426000000_fix_product_schema.sql',
    applied: '2024-04-26',
    summary: 'Added hsn_code, weight, size_chart_data, meta fields to products',
  },

  // ── PHASE 4 — Search, Filters, PDP Improvements, Analytics ─────────────────
  // SQL file: supabase/migrations/20260502000000_phase4_search_pdp_analytics.sql
  // Run in: https://supabase.com/dashboard/project/cjnuohqnaiggbvmbsqdx/sql/new
  {
    file: '20260502000000_phase4_search_pdp_analytics.sql',
    applied: '2026-05-02', // update if applied on a different date
    summary: `
      products table additions:
        - sleeve_type text          ('sleeveless'|'half_sleeve'|'full_sleeve'|'3/4_sleeve')
        - fit_type text             ('regular'|'slim'|'oversized'|'relaxed')
        - fabric_material text
        - care_instructions text
        - occasion_tags text[]      DEFAULT '{}'
        - size_guide jsonb          DEFAULT '{}'
            shape: { headers, rows, unit:'cm'|'inches', guide_image_url }
        - additional_info jsonb     DEFAULT '{}'
            shape: { key: value }   e.g. { Pattern:'Floral', Work:'Embroidery' }
        - search_vector tsvector    (GIN index idx_products_search)

      Trigger: on_product_search_update (BEFORE INSERT OR UPDATE)
        - Populates search_vector with weighted tsvector from name(A), description(B),
          fabric_material(C), sleeve_type(C), occasion_tags(C)

      New table: product_views
        - id uuid PK, product_id→products, session_id text, user_id→auth.users, viewed_at
        - RLS: anyone_insert_views | admin_read_views
        - Index: idx_product_views_product (product_id, viewed_at DESC)

      reviews table additions:
        - photos jsonb              DEFAULT '[]'  — array of Cloudinary URLs
        - title text
        - is_verified_purchase boolean DEFAULT false
        - admin_reply text
        - admin_replied_at timestamptz
        - helpful_count integer     DEFAULT 0

      Trigger: on_review_verify (BEFORE INSERT)
        - Auto-sets is_verified_purchase by checking orders/order_items for 'delivered' status

      New table: search_logs
        - id, query text, results_count int, user_id→auth.users, searched_at
        - RLS: anyone_insert_search | admin_read_search

      New table: discount_code_uses
        - id, discount_code_id→discount_codes, user_id→auth.users, order_id→orders, used_at
        - RLS: admin_discount_uses (ALL)

      NOTIFY pgrst, 'reload schema' — called at end
    `,
  },

  // ── PHASE 5 — Analytics, GST Reports, Inventory Management ─────────────────
  // Run via: MCP supabase apply_migration (applied 2026-05-02)
  // Migration name: phase5_analytics_inventory_schema
  {
    file: '20260502_phase5_analytics_inventory_schema',
    applied: '2026-05-02',
    summary: `
      New table: discount_codes
        - id uuid PK, code text UNIQUE, type text ('percentage'|'flat'),
          value numeric, min_order_amount numeric DEFAULT 0,
          max_uses integer, used_count integer DEFAULT 0,
          single_use_per_customer boolean DEFAULT false,
          is_active boolean DEFAULT true,
          starts_at timestamptz, expires_at timestamptz,
          description text, created_at timestamptz DEFAULT now()
        - RLS: admin_discount_codes (ALL, USING true)

      New table: daily_revenue  [analytics snapshot]
        - date date PRIMARY KEY, order_count integer, revenue numeric,
          discount_total numeric, shipping_total numeric,
          tax_total numeric, new_customers integer, updated_at timestamptz
        - RLS: admin_daily_revenue (ALL, USING true)
        - Auto-populated by trigger on_order_revenue (AFTER INSERT OR UPDATE OF payment_status ON orders)
          → fires upsert_daily_revenue() SECURITY DEFINER
          → inserts/upserts row for CURRENT_DATE when payment_status transitions to 'paid'
          → increments order_count, revenue, discount_total, shipping_total, tax_total

      New table: product_sales_summary  [fast bestsellers]
        - product_id uuid PK → products(id) ON DELETE CASCADE,
          units_sold integer DEFAULT 0, revenue numeric DEFAULT 0,
          last_sold_at timestamptz
        - RLS: admin_sales_summary (ALL, USING true)
        - Auto-populated by trigger on_order_sales_summary (AFTER UPDATE OF status ON orders)
          → fires update_product_sales() SECURITY DEFINER
          → iterates order_items when order transitions pending→confirmed
          → upserts units_sold += quantity, revenue += total_price, last_sold_at = now()

      New table: sms_logs
        - id uuid PK, phone text, message_type text,
          status text DEFAULT 'pending',
          provider_response jsonb DEFAULT '{}',
          sent_at timestamptz DEFAULT now()
        - RLS: admin_sms_logs (ALL, USING true)

      shop_settings column additions:
        - sms_enabled boolean DEFAULT false
        - sms_order_placed boolean DEFAULT false
        - sms_order_dispatched boolean DEFAULT false
        - sms_order_delivered boolean DEFAULT false

      New table: inventory_adjustments
        - id uuid PK,
          product_id uuid → products(id) ON DELETE CASCADE,
          variant_id uuid → product_variants(id) ON DELETE CASCADE,
          previous_qty integer, new_qty integer, adjustment integer,
          reason text, adjusted_by text DEFAULT 'admin',
          created_at timestamptz DEFAULT now()
        - RLS: admin_inventory_adj (ALL, USING true)

      Triggers created:
        - on_order_revenue          → upsert_daily_revenue()       [INSERT|UPDATE on orders]
        - on_order_sales_summary    → update_product_sales()       [UPDATE on orders]

      NOTIFY pgrst, 'reload schema' — called at end
    `,

    /*
    -- Full SQL record: ──────────────────────────────────────────────────────

    CREATE TABLE IF NOT EXISTS discount_codes (
      id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
      code text UNIQUE NOT NULL,
      type text NOT NULL DEFAULT 'percentage',
      value numeric NOT NULL,
      min_order_amount numeric DEFAULT 0,
      max_uses integer,
      used_count integer DEFAULT 0,
      single_use_per_customer boolean DEFAULT false,
      is_active boolean DEFAULT true,
      starts_at timestamptz,
      expires_at timestamptz,
      description text,
      created_at timestamptz DEFAULT now()
    );
    ALTER TABLE discount_codes ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "admin_discount_codes" ON discount_codes FOR ALL USING (true);

    CREATE TABLE IF NOT EXISTS daily_revenue (
      date date PRIMARY KEY,
      order_count integer DEFAULT 0,
      revenue numeric DEFAULT 0,
      discount_total numeric DEFAULT 0,
      shipping_total numeric DEFAULT 0,
      tax_total numeric DEFAULT 0,
      new_customers integer DEFAULT 0,
      updated_at timestamptz DEFAULT now()
    );
    ALTER TABLE daily_revenue ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "admin_daily_revenue" ON daily_revenue FOR ALL USING (true);

    CREATE OR REPLACE FUNCTION upsert_daily_revenue()
    RETURNS TRIGGER AS $$
    BEGIN
      IF (TG_OP = 'INSERT' AND NEW.payment_status = 'paid') OR
         (TG_OP = 'UPDATE' AND NEW.payment_status = 'paid' AND OLD.payment_status != 'paid') THEN
        INSERT INTO daily_revenue (date, order_count, revenue, discount_total, shipping_total, tax_total)
        VALUES (CURRENT_DATE, 1, COALESCE(NEW.total,0), COALESCE(NEW.discount_amount,0),
                COALESCE(NEW.shipping_amount,0), COALESCE(NEW.tax_amount,0))
        ON CONFLICT (date) DO UPDATE SET
          order_count    = daily_revenue.order_count + 1,
          revenue        = daily_revenue.revenue + COALESCE(NEW.total, 0),
          discount_total = daily_revenue.discount_total + COALESCE(NEW.discount_amount, 0),
          shipping_total = daily_revenue.shipping_total + COALESCE(NEW.shipping_amount, 0),
          tax_total      = daily_revenue.tax_total + COALESCE(NEW.tax_amount, 0),
          updated_at     = now();
      END IF;
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;

    DROP TRIGGER IF EXISTS on_order_revenue ON orders;
    CREATE TRIGGER on_order_revenue
      AFTER INSERT OR UPDATE OF payment_status ON orders
      FOR EACH ROW EXECUTE FUNCTION upsert_daily_revenue();

    CREATE TABLE IF NOT EXISTS product_sales_summary (
      product_id uuid REFERENCES products(id) ON DELETE CASCADE PRIMARY KEY,
      units_sold integer DEFAULT 0,
      revenue numeric DEFAULT 0,
      last_sold_at timestamptz
    );
    ALTER TABLE product_sales_summary ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "admin_sales_summary" ON product_sales_summary FOR ALL USING (true);

    CREATE OR REPLACE FUNCTION update_product_sales()
    RETURNS TRIGGER AS $$
    DECLARE item RECORD;
    BEGIN
      IF NEW.status = 'confirmed' AND OLD.status = 'pending' THEN
        FOR item IN
          SELECT product_id, quantity, total_price FROM order_items WHERE order_id = NEW.id
        LOOP
          INSERT INTO product_sales_summary (product_id, units_sold, revenue, last_sold_at)
          VALUES (item.product_id, item.quantity, item.total_price, now())
          ON CONFLICT (product_id) DO UPDATE SET
            units_sold   = product_sales_summary.units_sold + item.quantity,
            revenue      = product_sales_summary.revenue + item.total_price,
            last_sold_at = now();
        END LOOP;
      END IF;
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;

    DROP TRIGGER IF EXISTS on_order_sales_summary ON orders;
    CREATE TRIGGER on_order_sales_summary
      AFTER UPDATE OF status ON orders
      FOR EACH ROW EXECUTE FUNCTION update_product_sales();

    CREATE TABLE IF NOT EXISTS sms_logs (
      id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
      phone text NOT NULL,
      message_type text NOT NULL,
      status text DEFAULT 'pending',
      provider_response jsonb DEFAULT '{}',
      sent_at timestamptz DEFAULT now()
    );
    ALTER TABLE sms_logs ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "admin_sms_logs" ON sms_logs FOR ALL USING (true);

    ALTER TABLE shop_settings ADD COLUMN IF NOT EXISTS sms_enabled boolean DEFAULT false;
    ALTER TABLE shop_settings ADD COLUMN IF NOT EXISTS sms_order_placed boolean DEFAULT false;
    ALTER TABLE shop_settings ADD COLUMN IF NOT EXISTS sms_order_dispatched boolean DEFAULT false;
    ALTER TABLE shop_settings ADD COLUMN IF NOT EXISTS sms_order_delivered boolean DEFAULT false;

    CREATE TABLE IF NOT EXISTS inventory_adjustments (
      id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
      product_id uuid REFERENCES products(id) ON DELETE CASCADE,
      variant_id uuid REFERENCES product_variants(id) ON DELETE CASCADE,
      previous_qty integer,
      new_qty integer,
      adjustment integer,
      reason text,
      adjusted_by text DEFAULT 'admin',
      created_at timestamptz DEFAULT now()
    );
    ALTER TABLE inventory_adjustments ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "admin_inventory_adj" ON inventory_adjustments FOR ALL USING (true);

    NOTIFY pgrst, 'reload schema';
    */
  },

  // ── PHASE 6 — Wishlist, Stock Alerts, Recently Viewed ──────────────────────
  // Run via: MCP supabase execute sql (applied 2026-05-02)
  {
    file: '20260502_phase6_wishlist_alerts_schema',
    applied: '2026-05-02',
    summary: `
      New table: wishlists
        - id uuid PK, user_id→auth.users, product_id→products, created_at
        - UNIQUE (user_id, product_id)
        - RLS: user_own_wishlist (auth.uid() = user_id), admin_all_wishlist (true)

      New table: stock_alerts
        - id uuid PK, user_id→auth.users, email text, product_id→products,
          variant_id→product_variants, size text, is_notified boolean,
          notified_at timestamptz, created_at
        - UNIQUE (email, variant_id)
        - RLS: user_own_alerts (auth.uid() = user_id), admin_all_alerts (true)

      New table: recently_viewed
        - id uuid PK, user_id→auth.users, product_id→products, viewed_at
        - UNIQUE (user_id, product_id)
        - RLS: user_own_viewed (auth.uid() = user_id)
        - Index: idx_recently_viewed_user (user_id, viewed_at DESC)

      shop_settings column additions:
        - pwa_name text
        - pwa_short_name text
        - pwa_theme_color text
        - pwa_background_color text
        - whatsapp_number text
        - size_guide_image_url text

      NOTIFY pgrst, 'reload schema' — called at end
    `,
  },
] as const
