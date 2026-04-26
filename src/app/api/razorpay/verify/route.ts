import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import crypto from 'crypto';
import { rateLimit, getIp } from '@/lib/utils/rate-limit';
import { ConfirmOrderSchema, safeValidate } from '@/lib/utils/validators';

export const runtime = 'nodejs';

/**
 * POST /api/razorpay/verify
 *
 * Called from the checkout success page immediately after Razorpay's
 * payment handler fires. Verifies the HMAC signature and marks the order as paid.
 *
 * Body: { razorpay_order_id, razorpay_payment_id, razorpay_signature, order_id }
 */
export async function POST(req: NextRequest) {
  // Rate limit: 5 req/min per IP
  const ip = getIp(req)
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

  // Validate with Zod
  const { data: body, error: validationError } = safeValidate(ConfirmOrderSchema, rawBody);
  if (!body) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, order_id } = body;

  // ── 1. Verify HMAC signature ─────────────────────────────────────────────────
  // Razorpay signs: razorpay_order_id + "|" + razorpay_payment_id
  const expectedSignature = crypto
    .createHmac('sha256', keySecret)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex');

  if (expectedSignature !== razorpay_signature) {
    console.warn('[Razorpay] Signature mismatch for order:', order_id);
    return NextResponse.json({ error: 'Payment verification failed' }, { status: 400 });
  }

  // ── 2. Idempotency check ─────────────────────────────────────────────────────
  // If this payment_id was already recorded, return the existing order
  const supabase = createAdminClient();
  const { data: existingOrder } = await supabase
    .from('orders')
    .select('id, status')
    .eq('razorpay_payment_id', razorpay_payment_id)
    .maybeSingle();

  if (existingOrder) {
    return NextResponse.json({
      success:  true,
      order_id: existingOrder.id,
      status:   existingOrder.status,
      idempotent: true,
    });
  }

  // ── 3. Update order in DB ────────────────────────────────────────────────────

  const { data: order, error } = await supabase
    .from('orders')
    .update({
      payment_status:       'paid',
      razorpay_payment_id,
      razorpay_signature,
      status:               'confirmed',
      updated_at:           new Date().toISOString(),
    } as any)
    .eq('id', order_id)
    .eq('razorpay_order_id', razorpay_order_id) // double-check the razorpay order matches
    .select('id, status, total, customer_name, customer_email')
    .single();

  if (error || !order) {
    console.error('[Razorpay] Order update error:', error?.message);
    return NextResponse.json({ error: 'Failed to confirm order' }, { status: 500 });
  }

  // ── 3. Admin notification ────────────────────────────────────────────────────
  try {
    await supabase.from('admin_notifications').insert({
      type:  'payment_confirmed',
      title: `Payment Confirmed — #${order.id.slice(0, 8).toUpperCase()}`,
      body:  `₹${Number(order.total).toLocaleString('en-IN')} received from ${order.customer_name || order.customer_email || 'customer'}`,
      data:  { order_id: order.id, razorpay_payment_id },
    } as any);
  } catch { /* non-fatal */ }

  // ── 4. Send order confirmation email ─────────────────────────────────────────
  // This fires immediately after verify (Razorpay webhook also sends it, but
  // may be delayed / not configured in dev). Brevo deduplicates by messageId.
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
          body:  `Hi ${order.customer_name || 'there'}, your order has been confirmed.`,
          data:  { order_id: order.id },
        }),
      });
    } catch { /* non-fatal */ }
  }

  return NextResponse.json({
    success: true,
    order_id: order.id,
    status: order.status,
  });
}
