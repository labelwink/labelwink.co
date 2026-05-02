import { z } from 'zod'

// ── Razorpay IDs ──────────────────────────────────────────────────────────────
export const RazorpayPaymentIdSchema = z
  .string()
  .regex(/^pay_[a-zA-Z0-9]+$/, 'Invalid Razorpay payment ID')

export const RazorpayOrderIdSchema = z
  .string()
  .regex(/^order_[a-zA-Z0-9]+$/, 'Invalid Razorpay order ID')

// ── Cart item snapshot (sent from client to verify API) ─────────────────────
export const CartItemSnapshotSchema = z.object({
  id:        z.string().min(1),
  variantId: z.string().min(1).optional(),
  name:      z.string().min(1),
  quantity:  z.number().int().positive(),
  price:     z.number().nonnegative(),
  mrp:       z.number().nonnegative().optional(),
  size:      z.string().optional(),
  color:     z.string().optional(),
  publicId:  z.string().optional(),
})

// ── Shipping address snapshot ─────────────────────────────────────────────────
export const ShippingAddressSnapshotSchema = z.object({
  fullName:  z.string().min(1).max(150).optional(),
  full_name: z.string().min(1).max(150).optional(),
  email:     z.string().email().optional().or(z.literal('')),
  address:   z.string().optional(),
  line1:     z.string().optional(),
  city:      z.string().min(1).max(100),
  state:     z.string().min(1).max(100),
  pincode:   z.string().regex(/^\d{6}$/, 'Pincode must be 6 digits'),
  phone:     z.string().min(6).max(20),
})

// ── Payment verification + order placement (single server gate) ───────────────
// Posted by the client AFTER Razorpay handler fires.
// The backend verifies the HMAC first, then inserts the order.
export const VerifyAndPlaceOrderSchema = z.object({
  razorpay_payment_id: RazorpayPaymentIdSchema,
  razorpay_order_id:   RazorpayOrderIdSchema,
  razorpay_signature:  z.string().length(64, 'Invalid signature length'),
  cartSnapshot:        z.array(CartItemSnapshotSchema).min(1),
  shippingAddress:     ShippingAddressSnapshotSchema,
  userId:              z.string().uuid().optional(),
  couponCode:          z.string().optional(),
  subtotal:            z.number().nonnegative(),
  discountAmount:      z.number().nonnegative(),
  pointsUsed:          z.number().int().nonnegative(),
  shippingFee:         z.number().nonnegative(),
  total:               z.number().nonnegative(),
})

// ── Legacy alias — kept for any remaining imports ─────────────────────────────
/** @deprecated Use VerifyAndPlaceOrderSchema instead */
export const ConfirmOrderSchema = VerifyAndPlaceOrderSchema

// ── Address ───────────────────────────────────────────────────────────────────
export const AddressSchema = z.object({
  full_name: z.string().min(2).max(100),
  phone:     z.string().regex(/^[6-9]\d{9}$/, 'Invalid Indian mobile number'),
  line1:     z.string().min(5).max(200),
  line2:     z.string().max(200).optional(),
  city:      z.string().min(2).max(100),
  state:     z.string().min(2).max(100),
  pincode:   z.string().regex(/^\d{6}$/, 'Pincode must be 6 digits'),
  label:     z.enum(['Home', 'Work', 'Other']).optional(),
})

// ── Return request ────────────────────────────────────────────────────────────
export const ReturnRequestSchema = z.object({
  order_id:    z.string().uuid(),
  reason:      z.string().min(5).max(500),
  description: z.string().max(2000).optional(),
})

// ── Coupon code ───────────────────────────────────────────────────────────────
export const CouponCodeSchema = z
  .string()
  .min(3)
  .max(50)
  .transform(s => s.toUpperCase().replace(/[^A-Z0-9]/g, ''))

// ── Admin order status update ─────────────────────────────────────────────────
export const OrderStatusSchema = z.object({
  status: z.enum([
    'pending', 'confirmed', 'processing', 'packed',
    'shipped', 'delivered', 'cancelled', 'return_requested',
  ]),
  admin_note:       z.string().max(1000).optional(),
  tracking_number:  z.string().max(100).optional(),
  tracking_url:     z.string().url().optional().or(z.literal('')),
  shipping_carrier: z.string().max(50).optional(),
})

// ── Strip HTML tags (basic sanitization) ─────────────────────────────────────
export function stripHtml(input: string): string {
  return input.replace(/<[^>]*>/g, '').trim()
}

/** Parse + validate safely, returns { data, error } */
export function safeValidate<T>(
  schema: z.ZodSchema<T>,
  input: unknown,
): { data: T; error: null } | { data: null; error: string } {
  const result = schema.safeParse(input)
  if (result.success) return { data: result.data, error: null }
  const issues = (result.error as z.ZodError).issues
  return {
    data:  null,
    error: issues.map((e: z.ZodIssue) => `${e.path.join('.')}: ${e.message}`).join(', '),
  }
}
