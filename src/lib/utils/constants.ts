// ─────────────────────────────────────────────────────────────────────────────
// LabelWink — App-wide Constants
// ─────────────────────────────────────────────────────────────────────────────

export const ORDER_STATUSES = [
  'pending',
  'confirmed',
  'packed',
  'shipped',
  'out_for_delivery',
  'delivered',
  'cancelled',
  'return_requested',
] as const

export type OrderStatus = typeof ORDER_STATUSES[number]

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending:           'Pending',
  confirmed:         'Confirmed',
  packed:            'Packed',
  shipped:           'Shipped',
  out_for_delivery:  'Out for Delivery',
  delivered:         'Delivered',
  cancelled:         'Cancelled',
  return_requested:  'Return Requested',
}

export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  pending:           'bg-amber-100 text-amber-800 border border-amber-200',
  confirmed:         'bg-blue-100 text-blue-800 border border-blue-200',
  packed:            'bg-indigo-100 text-indigo-800 border border-indigo-200',
  shipped:           'bg-violet-100 text-violet-800 border border-violet-200',
  out_for_delivery:  'bg-purple-100 text-purple-800 border border-purple-200',
  delivered:         'bg-green-100 text-green-800 border border-green-200',
  cancelled:         'bg-red-100 text-red-800 border border-red-200',
  return_requested:  'bg-orange-100 text-orange-800 border border-orange-200',
}

export const RETURN_STATUSES = [
  'pending',
  'approved',
  'picked_up',
  'refunded',
  'rejected',
] as const

export type ReturnStatus = typeof RETURN_STATUSES[number]

export const RETURN_STATUS_LABELS: Record<ReturnStatus, string> = {
  pending:   'Pending',
  approved:  'Approved',
  picked_up: 'Picked Up',
  refunded:  'Refunded',
  rejected:  'Rejected',
}

/** Payment methods — Razorpay ONLY. No COD. */
export const PAYMENT_METHODS = ['razorpay'] as const
export type PaymentMethod = typeof PAYMENT_METHODS[number]

/** Indian garment HSN codes */
export const HSN_CODES = {
  garments_general:    '6211',
  sarees:              '6206',
  suits_sets:          '6211',
  tops_shirts:         '6206',
  trousers_pants:      '6203',
  accessories:         '6217',
  footwear:            '6401',
} as const

/** Indian states for GST calculation */
export const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Delhi', 'Jammu & Kashmir', 'Ladakh', 'Puducherry', 'Chandigarh',
  'Andaman & Nicobar Islands', 'Dadra & Nagar Haveli', 'Lakshadweep',
] as const

export const ADMIN_ROLES = [
  'admin',
  'store_manager',
  'warehouse',
  'support',
  'finance',
  'customer',
] as const

export type AdminRole = typeof ADMIN_ROLES[number]

/** Return reasons for customer-facing form */
export const RETURN_REASONS = [
  'Too small',
  'Too large',
  'Damaged / defective',
  'Wrong item sent',
  'Quality issue',
  'Changed my mind',
  'Other',
] as const

/** Shipping carriers */
export const SHIPPING_CARRIERS = [
  'Shiprocket',
  'Delhivery',
  'BlueDart',
  'DTDC',
  'Ekart',
  'FedEx',
  'Other',
] as const

/** Loyalty tiers */
export const LOYALTY_TIERS = [
  { name: 'Bronze',   min: 0,    max: 999,   color: '#cd7f32' },
  { name: 'Silver',   min: 1000, max: 4999,  color: '#9e9e9e' },
  { name: 'Gold',     min: 5000, max: 9999,  color: '#c9a84c' },
  { name: 'Platinum', min: 10000, max: Infinity, color: '#a0b2c8' },
] as const

/** Brand theme constants */
export const BRAND = {
  gold:      '#c9a84c',
  darkBg:    '#1a1a1a',
  cream:     '#faf7f2',
  darkGreen: '#1b3a34',
} as const
