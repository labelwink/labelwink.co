import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import crypto from 'crypto';

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
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret) {
    return NextResponse.json({ error: 'Payment configuration error' }, { status: 503 });
  }

  let body: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
    order_id: string; // our DB order ID
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, order_id } = body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !order_id) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

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

  // ── 2. Update order in DB ────────────────────────────────────────────────────
  const supabase = createAdminClient();

  const { data: order, error } = await supabase
    .from('orders')
    .update({
      payment_status:       'paid',
      razorpay_payment_id,
      razorpay_signature,
      status:               'confirmed',
      updated_at:           new Date().toISOString(),
    })
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
    });
  } catch { /* non-fatal */ }

  return NextResponse.json({
    success: true,
    order_id: order.id,
    status: order.status,
  });
}
