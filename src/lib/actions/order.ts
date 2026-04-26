'use server';

import { createAdminClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import Razorpay from 'razorpay';

export interface CartItem {
  id: string;           // variant ID
  variantId?: string;   // alias
  name: string;
  quantity: number;
  price: number;
  size?: string;
  color?: string;
  publicId?: string;    // cloudinary_public_id
}

export interface CheckoutData {
  userId?: string;
  items: CartItem[];
  subtotal: number;
  couponCode?: string;
  discountAmount?: number;
  pointsToRedeem?: number;   // wink_points to spend (each = ₹1 off)
  address: {
    email?: string;
    fullName?: string;
    full_name?: string;
    address?: string;
    line1?: string;
    city?: string;
    state?: string;
    pincode?: string;
    phone?: string;
  };
  paymentMethod: 'razorpay';
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
}

export async function createOrder(checkoutData: CheckoutData) {
  const supabase = createAdminClient();
  const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
  });

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

  // ── 3. Validate coupon against discount_codes ────────────────────────────────
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

  // ── 4. Loyalty points redemption ─────────────────────────────────────────────
  let pointsUsed = 0;
  if (checkoutData.pointsToRedeem && checkoutData.pointsToRedeem > 0 && checkoutData.userId) {
    // Validate the user actually has enough points
    const { data: profile } = await supabase
      .from('profiles')
      .select('wink_points')
      .eq('id', checkoutData.userId)
      .single();

    const availablePoints = profile?.wink_points || 0;
    const requestedPoints = Math.floor(checkoutData.pointsToRedeem);
    const maxPointsAllowed = Math.floor(checkoutData.subtotal * 0.5); // max 50% of subtotal

    pointsUsed = Math.min(requestedPoints, availablePoints, maxPointsAllowed);
    if (pointsUsed > 0) {
      discountAmount += pointsUsed; // 1 point = ₹1
    }
  }

  const total = Math.max(0, checkoutData.subtotal - discountAmount + shippingFee);

  // ── 4. Create Razorpay order ─────────────────────────────────────────────────
  const razorpayOrder = await razorpay.orders.create({
    amount:   Math.round(total * 100),
    currency: 'INR',
    receipt:  `lw-${Date.now()}`,
    notes: {
      customer: checkoutData.customerName || '',
      email:    checkoutData.customerEmail || '',
    },
  });

  // ── 5. Insert order row ──────────────────────────────────────────────────────
  const addr = checkoutData.address;
  const customerName  = checkoutData.customerName  || addr.fullName  || addr.full_name  || '';
  const customerEmail = checkoutData.customerEmail || addr.email     || '';
  const customerPhone = checkoutData.customerPhone || addr.phone     || '';

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      user_id:           checkoutData.userId      || null,
      payment_method:    'razorpay',
      payment_status:    'pending',
      razorpay_order_id: razorpayOrder.id,
      shipping_address:  addr,
      subtotal:          checkoutData.subtotal,
      discount_amount:   discountAmount,
      coupon_code:       checkoutData.couponCode  || null,
      shipping_fee:      shippingFee,
      shipping_amount:   shippingFee,
      loyalty_points_used: pointsUsed,
      total,
      status:            'pending',
      customer_name:     customerName,
      customer_email:    customerEmail,
      customer_phone:    customerPhone,
    })
    .select('id')
    .single();

  if (orderError || !order) {
    console.error('Order insert error:', orderError);
    return { error: orderError?.message || 'Failed to create order' };
  }

  // ── 6. Insert order_items ────────────────────────────────────────────────────
  const orderItems = checkoutData.items.map(item => ({
    order_id:          order.id,
    variant_id:        item.variantId || item.id,
    product_name:      item.name,
    variant_size:      item.size  || '',
    variant_color:     item.color || '',
    image_cloudinary_id: item.publicId || null,
    quantity:          item.quantity,
    price_at_purchase: item.price,
    // Also write to new canonical columns
    size:              item.size  || '',
    color:             item.color || '',
  }));

  const { error: itemsError } = await supabase
    .from('order_items')
    .insert(orderItems);

  if (itemsError) {
    console.error('Order items insert error:', itemsError);
    // Don't fail the whole order — log and continue
  }

  // ── 7. Decrement stock for each variant ──────────────────────────────────────
  for (const item of checkoutData.items) {
    const variantId = item.variantId || item.id;
    try {
      const { data: variant } = await supabase
        .from('product_variants')
        .select('stock_qty')
        .eq('id', variantId)
        .single();
      if (variant) {
        await supabase
          .from('product_variants')
          .update({ stock_qty: Math.max(0, variant.stock_qty - item.quantity) })
          .eq('id', variantId);
      }
    } catch { /* non-fatal */ }
  }

  // ── 8. Deduct loyalty points ──────────────────────────────────────────────────
  if (pointsUsed > 0 && checkoutData.userId) {
    try {
      await supabase
        .from('profiles')
        .update({ wink_points: supabase.rpc('decrement_wink_points', { user_id: checkoutData.userId, amount: pointsUsed }) })
        .eq('id', checkoutData.userId);
      // Fallback: direct decrement
      const { data: prof } = await supabase.from('profiles').select('wink_points').eq('id', checkoutData.userId).single();
      if (prof) {
        await supabase.from('profiles').update({ wink_points: Math.max(0, (prof.wink_points || 0) - pointsUsed) }).eq('id', checkoutData.userId);
      }
    } catch { /* non-fatal */ }
  }

  // ── 9. Admin notification ────────────────────────────────────────────────────
  const shortId       = order.id.slice(0, 8).toUpperCase();
  const customerLabel = customerName || customerEmail || 'A customer';
  try {
    await supabase.from('admin_notifications').insert({
      type:  'new_order',
      title: `New Order #${shortId}`,
      body:  `${customerLabel} placed an order for ₹${total.toLocaleString('en-IN')}`,
      data:  { order_id: order.id, total },
    });
  } catch { /* non-fatal */ }

  revalidatePath('/admin/orders');

  return {
    success:        true,
    razorpayOrderId: razorpayOrder.id,
    razorpayKeyId:   process.env.RAZORPAY_KEY_ID,
    orderId:         order.id,
    amount:          razorpayOrder.amount,
    currency:        'INR',
  };
}
