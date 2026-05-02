// ─────────────────────────────────────────────────────────────────────────────
// LabelWink — Shared TypeScript Types
// These types are used across admin, storefront, and API routes.
// ─────────────────────────────────────────────────────────────────────────────

import type { OrderStatus, ReturnStatus } from '@/lib/utils/constants'

// ── Product Types ─────────────────────────────────────────────────────────────

export interface Product {
  id: string
  name: string
  slug: string
  description: string | null
  price: number
  compare_at_price: number | null
  category_id: string | null
  visible: boolean
  status: 'draft' | 'published' | 'archived'
  fabric: string | null
  occasion: string | null
  fit: string | null
  season: string | null
  tags: string[] | null
  hsn_code: string | null
  weight: number | null
  size_chart_data: SizeChartData | null
  meta_title: string | null
  meta_description: string | null
  og_image_url: string | null
  // ── Phase 4: Search & PDP ──────────────────────────────────
  sleeve_type: 'sleeveless' | 'half_sleeve' | 'full_sleeve' | '3/4_sleeve' | null
  fit_type: 'regular' | 'slim' | 'oversized' | 'relaxed' | null
  fabric_material: string | null
  care_instructions: string | null
  occasion_tags: string[] | null
  size_guide: SizeGuide | null
  additional_info: Record<string, string> | null
  search_vector?: string | null
  // ──────────────────────────────────────────────────────────
  created_at: string
  updated_at: string | null
  // Relations (joined)
  images?: ProductImage[]
  variants?: ProductVariant[]
  category?: Category | null
}

export interface ProductImage {
  id: string
  product_id: string
  url: string
  alt: string | null
  sort_order: number
  is_cover: boolean
}

export interface ProductVariant {
  id: string
  product_id: string
  size: string
  color: string | null
  sku: string | null
  stock_qty: number
  price: number | null
  image_url: string | null
  low_stock_threshold: number
  warehouse_location: string | null
  reorder_qty: number
  created_at: string
}

export interface SizeChartRow {
  size: string
  chest: number | string
  waist: number | string
  hips: number | string
  length: number | string
}

export interface SizeChartData {
  rows: SizeChartRow[]
  unit?: 'cm' | 'inches'
}

/** Phase 4 — structured size guide stored in products.size_guide */
export interface SizeGuide {
  headers: string[]             // e.g. ['Size','Chest','Waist','Hips','Length']
  rows: string[][]              // e.g. [['XS','32','26','34','52'], ...]
  unit: 'cm' | 'inches'
  guide_image_url?: string
}

export interface Category {
  id: string
  name: string
  slug: string
  parent_id: string | null
  image_url: string | null
  sort_order: number
  created_at: string
  children?: Category[]
}

export interface Collection {
  id: string
  name: string
  slug: string
  description: string | null
  image_url: string | null
  is_featured: boolean
  sort_order: number
  meta_title: string | null
  meta_description: string | null
  created_at: string
}

// ── Order Types ───────────────────────────────────────────────────────────────

export interface Order {
  id: string
  user_id: string | null
  status: OrderStatus
  total: number
  subtotal: number
  shipping_amount: number
  discount_amount: number
  points_redeemed: number
  shipping_method: 'standard' | 'express' | 'free'
  shipping_state: string | null
  is_inter_state: boolean
  customer_name: string | null
  customer_email: string | null
  customer_phone: string | null
  shipping_address: ShippingAddress | null
  admin_note: string | null
  razorpay_payment_id: string | null
  razorpay_order_id: string | null
  razorpay_signature: string | null
  shipping_carrier: string | null
  tracking_number: string | null
  tracking_url: string | null
  shiprocket_order_id: string | null
  shiprocket_awb: string | null
  label_url: string | null
  created_at: string
  updated_at: string | null
  // Relations (joined)
  order_items?: OrderItem[]
  invoices?: Invoice[]
  order_status_history?: OrderStatusHistory[]
  profiles?: CustomerProfile | null
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string
  variant_id: string | null
  product_name: string
  size: string | null
  color: string | null
  sku: string | null
  quantity: number
  price: number
  image_url: string | null
}

export interface OrderStatusHistory {
  id: string
  order_id: string
  status: string
  note: string | null
  changed_by: string
  created_at: string
}

export interface ShippingAddress {
  full_name?: string
  phone?: string
  line1?: string
  line2?: string
  city?: string
  state?: string
  pincode?: string
  country?: string
  // Legacy fields
  fullName?: string
  address?: string
}

// ── Invoice Types ─────────────────────────────────────────────────────────────

export interface Invoice {
  id: string
  order_id: string
  invoice_number: string
  issued_at: string
  subtotal: number | null
  cgst: number
  sgst: number
  igst: number
  shipping: number
  discount: number
  total: number | null
  data: InvoiceData | null
}

export interface InvoiceData {
  customer_name?: string
  customer_email?: string
  customer_phone?: string
  shipping_address?: ShippingAddress
}

// ── Customer Types ────────────────────────────────────────────────────────────

export interface CustomerProfile {
  id: string
  full_name: string | null
  phone: string | null
  email: string | null
  avatar_url: string | null
  date_of_birth: string | null
  gender: 'male' | 'female' | 'other' | 'prefer_not_to_say' | null
  chest: number | null
  waist: number | null
  hips: number | null
  height: number | null
  weight: number | null
  role: string
  referral_code: string | null
  referred_by: string | null
  created_at: string
  updated_at: string
}

export interface Address {
  id: string
  user_id: string
  label: 'Home' | 'Office' | 'Other'
  full_name: string | null
  phone: string | null
  line1: string | null
  line2: string | null
  city: string | null
  state: string | null
  pincode: string | null
  country: string
  is_default: boolean
  created_at: string
}

// ── Discount Types ────────────────────────────────────────────────────────────

export interface DiscountCode {
  id: string
  code: string
  type: 'percentage' | 'flat' | 'bogo' | 'free_shipping'
  value: number
  min_order_amount: number
  max_uses: number | null
  used_count: number
  single_use_per_customer: boolean
  starts_at: string | null
  expires_at: string | null
  is_active: boolean
  created_at: string
}

export interface DiscountValidationResult {
  valid: boolean
  discount_amount?: number
  type?: DiscountCode['type']
  message?: string
  error?: string
}

// ── Loyalty Types ─────────────────────────────────────────────────────────────

export interface LoyaltyPoints {
  id: string
  user_id: string
  balance: number
  lifetime_earned: number
  updated_at: string
}

export interface LoyaltyTransaction {
  id: string
  user_id: string
  points: number
  type: 'earn' | 'redeem' | 'bonus' | 'expire' | 'referral' | 'birthday'
  reason: string | null
  order_id: string | null
  created_at: string
}

// ── Return Types ──────────────────────────────────────────────────────────────

export interface ReturnRequest {
  id: string
  order_id: string
  user_id: string
  reason: string | null
  description: string | null
  photo_urls: string[] | null
  status: ReturnStatus
  refund_amount: number | null
  refund_method: string
  razorpay_refund_id: string | null
  admin_note: string | null
  created_at: string
  updated_at: string
  // Relations
  orders?: Partial<Order>
}

// ── Review Types ──────────────────────────────────────────────────────────────

export interface Review {
  id: string
  product_id: string
  user_id: string
  order_id: string | null
  rating: number
  title: string | null
  body: string | null
  status: 'pending' | 'approved' | 'rejected'
  // Phase 4 additions
  photos: string[] | null       // Cloudinary URLs
  is_verified_purchase: boolean
  admin_reply: string | null
  admin_replied_at: string | null
  helpful_count: number
  created_at: string
  // Relations
  products?: Partial<Product>
  profiles?: Partial<CustomerProfile>
}

// ── Analytics Types (Phase 4) ─────────────────────────────────────────────────

export interface ProductView {
  id: string
  product_id: string
  session_id: string | null
  user_id: string | null
  viewed_at: string
}

export interface SearchLog {
  id: string
  query: string
  results_count: number
  user_id: string | null
  searched_at: string
}

export interface DiscountCodeUse {
  id: string
  discount_code_id: string | null
  user_id: string | null
  order_id: string | null
  used_at: string
}

// ── Admin Types ───────────────────────────────────────────────────────────────

export interface ShopSettings {
  id: number
  store_name: string
  store_email: string | null
  store_phone: string | null
  store_address: string | null
  store_state: string
  gst_number: string | null
  logo_url: string | null
  currency: string
  free_shipping_threshold: number
  standard_shipping_rate: number
  express_shipping_rate: number
  loyalty_points_per_rupee: number
  points_to_rupee_ratio: number
  return_window_days: number
  low_stock_notify_email: string | null
  updated_at: string
}

export interface AdminNotification {
  id: string
  type: string
  title: string | null
  body: string | null
  data: Record<string, unknown> | null
  is_read: boolean
  created_at: string
}

export interface AuditLog {
  id: string
  admin_id: string | null
  admin_email: string | null
  action: string | null
  entity: string | null
  entity_id: string | null
  changes: Record<string, unknown> | null
  ip_address: string | null
  user_agent: string | null
  created_at: string
}

// ── CMS Types ─────────────────────────────────────────────────────────────────

export interface Banner {
  id: string
  title: string | null
  image_url: string | null
  mobile_image_url: string | null
  target_url: string | null
  position: 'hero' | 'category' | 'sidebar' | 'announcement'
  starts_at: string | null
  ends_at: string | null
  is_active: boolean
  sort_order: number
  variant_a_url: string | null
  variant_b_url: string | null
  click_count_a: number
  click_count_b: number
  created_at: string
}

export interface Page {
  id: string
  slug: string
  title: string | null
  meta_title: string | null
  meta_description: string | null
  content: Record<string, unknown> | null
  is_published: boolean
  published_at: string | null
  created_at: string
  updated_at: string
}

export interface BlogPost {
  id: string
  slug: string
  title: string | null
  body: string | null
  excerpt: string | null
  cover_image_url: string | null
  author_name: string | null
  tags: string[] | null
  meta_title: string | null
  meta_description: string | null
  og_image_url: string | null
  related_product_ids: string[] | null
  is_published: boolean
  published_at: string | null
  created_at: string
  updated_at: string
}

// ── Cart Types (client-side only) ─────────────────────────────────────────────

export interface CartItem {
  product_id: string
  variant_id: string
  product_name: string
  size: string
  color: string | null
  sku: string | null
  quantity: number
  price: number
  image_url: string | null
  stock_qty: number
}

// ── API Response Types ────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  pages: number
}

export interface ApiError {
  error: string
  code?: string
  details?: unknown
}
