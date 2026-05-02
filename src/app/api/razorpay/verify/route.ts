import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import crypto from 'crypto';
import { rateLimit, getIp } from '@/lib/utils/rate-limit';
import { VerifyAndPlaceOrderSchema, safeValidate } from '@/lib/utils/validators';
import { revalidatePath } from 'next/cache';

export const runtime = 'nodejs';

/**
 * POST /api/razorpay/verify
 *
 * THE ONLY place where an order is written to the database.
 *
 * Flow:
 *  1. Rate-limit check
 *  2. Validate request body (Zod)
 *  3. Verify Razorpay HMAC signature  ← GATE: nothing below runs if invalid
 *  4. Idempotency check (already inserted for this payment_id?)
 *  5. Re-validate stock (race-condition safety)
 *  6. INSERT order row
 *  7. INSERT order_items
 *  8. Decrement stock
 *  9. Deduct loyalty points
 * 10. Increment coupon usage
 * 11. Admin notification
 * 12. Order confirmation email
 *
 * Body: {
 *   razorpay_order_id, razorpay_payment_id, razorpay_signature,
 *   cartSnapshot, shippingAddress, userId?,
 *   subtotal, shippingFee, discountAmount, pointsUsed, total,
 *   couponCode?
 * }
 */
export async function POST(req: NextRequest) {
  // ── Rate limit: 5 req/min per IP ────────────────────────────────────────────
  const ip = getIp(req);
  if (!rateLimit(`verify:${ip}`, 5, 60_000)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret) {
    return NextResponse.json({ error: 'Payment configuration error' }, { status: 503 });
  }

  let rawBody: unknown;
  try {
    rawBody = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  // ── Validate with Zod ────────────────────────────────────────────────────────
  const { data: body, error: validationError } = safeValidate(VerifyAndPlaceOrderSchema, rawBody);
  if (!body) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    cartSnapshot,
    shippingAddress,
    userId,
    couponCode,
    subtotal,
    shippingFee,
    discountAmount,
    pointsUsed,
    total,
  } = body;

  // ── 1. Verify HMAC signature — THE GATE ─────────────────────────────────────
  // Nothing below this block executes if the signature is invalid.
  const expectedSignature = crypto
    .createHmac('sha256', keySecret)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex');

  if (expectedSignature !== razorpay_signature) {
    console.warn('[Razorpay/verify] Signature mismatch — order NOT created');
    return NextResponse.json(
      { error: 'Payment verification failed. Order not placed.' },
      { status: 400 }
    );
  }

  const supabase = createAdminClient();

  // ── 2. Idempotency check ─────────────────────────────────────────────────────
  // If this payment_id was already recorded (e.g. double-POST), return existing.
  const { data: existingOrder } = await supabase
    .from('orders')
    .select('id, status')
    .eq('razorpay_payment_id', razorpay_payment_id)
    .maybeSingle();

  if (existingOrder) {
    return NextResponse.json({
      success:    true,
      order_id:   existingOrder.id,
      status:     existingOrder.status,
      idempotent: true,
    });
  }

  // ── 3. Re-validate stock (race-condition safety) ─────────────────────────────
  for (const item of cartSnapshot) {
    const variantId = item.variantId || item.id;
    const { data: variant } = await supabase
      .from('product_variants')
      .select('stock_qty')
      .eq('id', variantId)
      .single();

    if (!variant || variant.stock_qty < item.quantity) {
      // Payment was collected but stock ran out in the meantime.
      // Log for manual review — do NOT silently drop the order.
      console.error(
        `[Razorpay/verify] STOCK CONFLICT: payment ${razorpay_payment_id} collected ` +
        `but variant ${variantId} has insufficient stock (have ${variant?.stock_qty}, need ${item.quantity})`
      );
      // Still create the order so admin can see & handle refund/restock.
      // Fall through to insert with whatever stock is available.
    }
  }

  // ── 4. INSERT order — first and only DB write for this order ─────────────────
  const addr          = shippingAddress;
  const customerName  = addr.fullName  || addr.full_name  || '';
  const customerEmail = addr.email     || '';
  const customerPhone = addr.phone     || '';

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      user_id:              userId             || null,
      payment_method:       'razorpay',
      payment_status:       'paid',            // ✅ confirmed paid before insert
      status:               'confirmed',       // ✅ confirmed order
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      shipping_address:     addr,
      subtotal,
      discount_amount:      discountAmount,
      coupon_code:          couponCode         || null,
      shipping_fee:         shippingFee,
      shipping_amount:      shippingFee,
      loyalty_points_used:  pointsUsed,
      total,
      customer_name:        customerName,
      customer_email:       customerEmail,
      customer_phone:       customerPhone,
      updated_at:           new Date().toISOString(),
    } as any)
    .select('id, status, total, customer_name, customer_email')
    .single();

  if (orderError || !order) {
    console.error('[Razorpay/verify] Order insert error:', orderError?.message);
    return NextResponse.json({ error: 'Failed to record order' }, { status: 500 });
  }

  // ── 5. INSERT order_items ────────────────────────────────────────────────────
  const orderItems = cartSnapshot.map(item => ({
    order_id:             order.id,
    variant_id:           item.variantId || item.id,
    product_name:         item.name,
    variant_size:         item.size  || '',
    variant_color:        item.color || '',
    image_cloudinary_id:  item.publicId || null,
    quantity:             item.quantity,
    price_at_purchase:    item.price,
    mrp_at_purchase:      item.mrp ?? item.price,
    size:                 item.size  || '',
    color:                item.color || '',
  }));

  const { error: itemsError } = await supabase
    .from('order_items')
    .insert(orderItems);

  if (itemsError) {
    console.error('[Razorpay/verify] Order items insert error:', itemsError);
    // Non-fatal — order exists, items can be reconstructed from snapshot
  }

  // ── 6. Decrement stock ───────────────────────────────────────────────────────
  for (const item of cartSnapshot) {
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

  // ── 7. Deduct loyalty points ─────────────────────────────────────────────────
  if (pointsUsed > 0 && userId) {
    try {
      const { data: prof } = await supabase
        .from('profiles')
        .select('wink_points')
        .eq('id', userId)
        .single();
      if (prof) {
        await supabase
          .from('profiles')
          .update({ wink_points: Math.max(0, (prof.wink_points || 0) - pointsUsed) })
          .eq('id', userId);
      }
    } catch { /* non-fatal */ }
  }

  // ── 8. Increment coupon usage ────────────────────────────────────────────────
  if (couponCode && discountAmount > 0) {
    try {
      const { data: couponRow } = await supabase
        .from('discount_codes')
        .select('id, used_count, usage_count')
        .ilike('code', couponCode)
        .maybeSingle();
      if (couponRow) {
        const currentCount = couponRow.used_count ?? couponRow.usage_count ?? 0;
        await supabase
          .from('discount_codes')
          .update({ used_count: currentCount + 1, usage_count: currentCount + 1 })
          .eq('id', couponRow.id);
      }
    } catch { /* non-fatal */ }
  }

  // ── 9. Admin notification ────────────────────────────────────────────────────
  const shortId       = order.id.slice(0, 8).toUpperCase();
  const customerLabel = order.customer_name || order.customer_email || 'A customer';
  try {
    await supabase.from('admin_notifications').insert({
      type:  'new_order',
      title: `New Order #${shortId} — Payment Confirmed`,
      body:  `₹${Number(order.total).toLocaleString('en-IN')} received from ${customerLabel}`,
      data:  { order_id: order.id, razorpay_payment_id },
    } as any);
  } catch { /* non-fatal */ }

  // ── 10. Order confirmation email ─────────────────────────────────────────────
  if (order.customer_email) {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://labelwink.co';
    try {
      await fetch(`${siteUrl}/api/send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-internal-secret': process.env.INTERNAL_SECRET ?? '',
        },
        body: JSON.stringify({
          to:    order.customer_email,
          type:  'order_confirmed',
          title: 'Your Label Wink order is confirmed!',
          body:  `Hi ${order.customer_name || 'there'}, your order has been confirmed and payment received.`,
          data:  { order_id: order.id },
        }),
      });
    } catch { /* non-fatal */ }
  }

  revalidatePath('/admin/orders');

  return NextResponse.json({
    success:  true,
    order_id: order.id,
    status:   order.status,
  });
}
