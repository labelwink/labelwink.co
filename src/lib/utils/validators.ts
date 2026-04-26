import { z } from 'zod'

// ── Razorpay IDs ──────────────────────────────────────────────────────────────
export const RazorpayPaymentIdSchema = z
  .string()
  .regex(/^pay_[a-zA-Z0-9]+$/, 'Invalid Razorpay payment ID')

export const RazorpayOrderIdSchema = z
  .string()
  .regex(/^order_[a-zA-Z0-9]+$/, 'Invalid Razorpay order ID')

// ── Payment confirmation ──────────────────────────────────────────────────────
export const ConfirmOrderSchema = z.object({
  razorpay_payment_id: RazorpayPaymentIdSchema,
  razorpay_order_id:   RazorpayOrderIdSchema,
  razorpay_signature:  z.string().length(64, 'Invalid signature length'),
  order_id:            z.string().uuid('Invalid order ID'),
})

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
