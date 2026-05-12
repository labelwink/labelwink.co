-- Migration: 20260513024000_fix_orders_columns.sql
-- Fixes missing customer_phone column in orders table

ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_phone TEXT;

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';
