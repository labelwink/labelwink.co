'use server';

import { createAdminClient } from '@/lib/supabase/server';
import Razorpay from 'razorpay';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface CartItem {
  id: string;           // variant ID
  variantId?: string;   // alias
  name: string;
  quantity: number;
  price: number;
  mrp?: number;         // original MRP (for mrp_at_purchase)
  sale_price?: number;  // fallback if mrp absent
  size?: string;
  color?: string;
  publicId?: string;    // cloudinary_public_id
}

export interface CheckoutAddress {
  email?: string;
  fullName?: string;
  full_name?: string;
  address?: string;
  line1?: string;
  city?: string;
  state?: string;
  pincode?: string;
  phone?: string;
}

export interface CheckoutData {
  userId?: string;
  items: CartItem[];
  subtotal: number;
  couponCode?: string;
  discountAmount?: number;
  pointsToRedeem?: number;   // wink_points to spend (each = ₹1 off)
  address: CheckoutAddress;
  paymentMethod: 'razorpay';
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// prepareCheckout
//
// STEP 1 of the payment flow — called when user clicks "Proceed to Payment".
//
// ✅ Validates stock availability
// ✅ Calculates totals (shipping, discounts, loyalty points)
// ✅ Creates a Razorpay order (just an intent, no charge yet)
// ❌ Does NOT write anything to the orders table
// ❌ Does NOT write order_items
// ❌ Does NOT decrement stock
//
// The DB insert only happens in /api/razorpay/verify AFTER HMAC is confirmed.
// ─────────────────────────────────────────────────────────────────────────────
export async function prepareCheckout(checkoutData: CheckoutData): Promise<{
  success?: true;
  razorpayOrderId?: string;
  razorpayKeyId?: string;
  amount?: number;
  currency?: string;
  /** Server-calculated totals — passed back to client for the cartSnapshot */
  totals?: {
    subtotal: number;
    shippingFee: number;
    discountAmount: number;
    pointsUsed: number;
    total: number;
  };
  error?: string;
}> {
  const supabase = createAdminClient();

  // ── 1. Verify stock ──────────────────────────────────────────────────────────
  for (const item of checkoutData.items) {
    const variantId = item.variantId || item.id;
    const { data: variant } = await supabase
      .from('product_variants')
      .select('stock_qty, size, color, price, product_id, products(name)')
      .eq('id', variantId)
      .single();

    if (!variant || variant.stock_qty < item.quantity) {
      return { error: `"${item.name}" is out of stock or unavailable` };
    }
  }

  // ── 2. Shipping threshold ────────────────────────────────────────────────────
  const { data: thresholdSetting } = await supabase
    .from('site_settings')
    .select('value')
    .eq('key', 'free_shipping_threshold')
    .maybeSingle();

  const threshold = (thresholdSetting?.value as Record<string, number> | null)?.amount ?? 999;
  let shippingFee = checkoutData.subtotal >= threshold ? 0 : 99;
  let discountAmount = 0;

  // ── 3. Validate coupon ───────────────────────────────────────────────────────
  if (checkoutData.couponCode) {
    const code = checkoutData.couponCode.toUpperCase();
    const now = new Date().toISOString();

    const { data: coupon } = await supabase
      .from('discount_codes')
      .select('id, type, value, max_uses, used_count, starts_at, expires_at, is_active, min_order_amount')
      .eq('is_active', true)
      .ilike('code', code)
      .maybeSingle();

    if (coupon) {
      const withinMaxUses = !coupon.max_uses || (coupon.used_count ?? 0) < coupon.max_uses;
      const notExpired    = !coupon.expires_at || coupon.expires_at > now;
      const hasStarted    = !coupon.starts_at  || coupon.starts_at  <= now;
      const meetsMinOrder = !coupon.min_order_amount || checkoutData.subtotal >= Number(coupon.min_order_amount);

      if (withinMaxUses && notExpired && hasStarted && meetsMinOrder) {
        if (coupon.type === 'percentage') {
          discountAmount = Math.min(
            (checkoutData.subtotal * Number(coupon.value)) / 100,
            checkoutData.subtotal
          );
        } else if (coupon.type === 'fixed_amount' || coupon.type === 'fixed') {
          discountAmount = Math.min(Number(coupon.value), checkoutData.subtotal);
        } else if (coupon.type === 'free_shipping') {
          shippingFee = 0;
        }
      }
    }
  }

  // Use client-provided discount if server calc is 0
  if (discountAmount === 0 && checkoutData.discountAmount && checkoutData.discountAmount > 0) {
    discountAmount = checkoutData.discountAmount;
  }

  // ── 4. Loyalty points ────────────────────────────────────────────────────────
  let pointsUsed = 0;
  if (checkoutData.pointsToRedeem && checkoutData.pointsToRedeem > 0 && checkoutData.userId) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('wink_points')
      .eq('id', checkoutData.userId)
      .single();

    const availablePoints = profile?.wink_points || 0;
    const requestedPoints = Math.floor(checkoutData.pointsToRedeem);
    const maxPointsAllowed = Math.floor(checkoutData.subtotal * 0.5);

    pointsUsed = Math.min(requestedPoints, availablePoints, maxPointsAllowed);
    if (pointsUsed > 0) {
      discountAmount += pointsUsed;
    }
  }

  const total = Math.max(0, checkoutData.subtotal - discountAmount + shippingFee);

  // ── 5. Create Razorpay order (payment intent only, no DB write) ───────────────
  const razorpay = new Razorpay({
    key_id:     process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let razorpayOrder: { id: string; amount: number; currency: string } | null = null;
  try {
    // razorpay SDK types are loose — cast via any
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    razorpayOrder = (await razorpay.orders.create({
      amount:   Math.round(total * 100), // paise
      currency: 'INR',
      receipt:  `lw-${Date.now()}`,
      notes: {
        customer: checkoutData.customerName || '',
        email:    checkoutData.customerEmail || '',
      },
    })) as any;
  } catch (err: unknown) {
    console.error('[prepareCheckout] Razorpay order creation failed:', err);
    return { error: 'Could not initiate payment. Please try again.' };
  }

  if (!razorpayOrder?.id) {
    return { error: 'Could not initiate payment. Please try again.' };
  }

  // ── Return only the Razorpay order ID + server-calculated totals ─────────────
  // No order is written to the database here.
  return {
    success:        true,
    razorpayOrderId: razorpayOrder.id,
    razorpayKeyId:   process.env.RAZORPAY_KEY_ID,
    amount:          razorpayOrder.amount as number,
    currency:        'INR',
    totals: {
      subtotal:       checkoutData.subtotal,
      shippingFee,
      discountAmount,
      pointsUsed,
      total,
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Legacy alias — kept so any import of `createOrder` still compiles.
// Internally calls prepareCheckout; DB insert now lives in /api/razorpay/verify.
// ─────────────────────────────────────────────────────────────────────────────
export const createOrder = prepareCheckout;
