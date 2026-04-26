import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import crypto from 'crypto';

export const runtime = 'nodejs';

/**
 * POST /api/razorpay/webhook
 *
 * Razorpay server-to-server webhook — handles payment events.
 * Configure this URL in Razorpay Dashboard → Webhooks.
 *
 * Events handled:
 *   - payment.captured  → marks order as paid + confirmed
 *   - payment.failed    → marks payment_status as failed
 *
 * Env var required: RAZORPAY_WEBHOOK_SECRET
 */
export async function POST(req: NextRequest) {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!webhookSecret) {
    // If not configured, skip signature check (dev mode)
    console.warn('[Webhook] RAZORPAY_WEBHOOK_SECRET not set — skipping signature check');
  }

  const rawBody = await req.text();

  // ── Verify webhook signature ─────────────────────────────────────────────────
  if (webhookSecret) {
    const razorpaySignature = req.headers.get('x-razorpay-signature');
    if (!razorpaySignature) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }
    const expectedSig = crypto
      .createHmac('sha256', webhookSecret)
      .update(rawBody)
      .digest('hex');
    if (expectedSig !== razorpaySignature) {
      console.warn('[Webhook] Signature mismatch');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }
  }

  let event: { event: string; payload: Record<string, unknown> };
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const supabase = createAdminClient();
  const eventType = event.event;

  // ── payment.captured ─────────────────────────────────────────────────────────
  if (eventType === 'payment.captured') {
    const payment = (event.payload as any)?.payment?.entity;
    if (!payment) return NextResponse.json({ ok: true });

    const razorpayOrderId  = payment.order_id  as string;
    const razorpayPaymentId = payment.id        as string;

    if (!razorpayOrderId) return NextResponse.json({ ok: true });

    // Find our order by Razorpay order ID
    const { data: order } = await supabase
      .from('orders')
      .select('id, payment_status')
      .eq('razorpay_order_id', razorpayOrderId)
      .maybeSingle();

    if (!order) {
      console.warn('[Webhook] No order found for razorpay_order_id:', razorpayOrderId);
      return NextResponse.json({ ok: true }); // still 200 so Razorpay doesn't retry
    }

    // Only update if not already paid (idempotency)
    if (order.payment_status !== 'paid') {
      await supabase
        .from('orders')
        .update({
          payment_status:      'paid',
          razorpay_payment_id: razorpayPaymentId,
          status:              'confirmed',
          updated_at:          new Date().toISOString(),
        } as any)
        .eq('id', order.id);

      try {
        await supabase.from('admin_notifications').insert({
          type:  'payment_confirmed',
          title: `Payment Captured — #${order.id.slice(0, 8).toUpperCase()}`,
          body:  `Razorpay webhook confirmed payment ${razorpayPaymentId}`,
          data:  { order_id: order.id, razorpay_payment_id: razorpayPaymentId },
        } as any);
      } catch { /* non-fatal */ }

      // ── Send order confirmation email ───────────────────────────────────
      try {
        const { data: fullOrder } = await supabase
          .from('orders')
          .select('customer_email, customer_name, id')
          .eq('id', order.id)
          .single();

        if (fullOrder?.customer_email) {
          const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://labelwink.co';
          await fetch(`${siteUrl}/api/send-email`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-internal-secret': process.env.INTERNAL_SECRET ?? '',
            },
            body: JSON.stringify({
              to:    fullOrder.customer_email,
              type:  'order_confirmed',
              title: 'Your order is confirmed!',
              body:  `Hi ${fullOrder.customer_name || 'there'}, your Label Wink order has been confirmed.`,
              data:  { order_id: fullOrder.id },
            }),
          });
        }
      } catch { /* non-fatal */ }
    }
  }

  // ── payment.failed ───────────────────────────────────────────────────────────
  if (eventType === 'payment.failed') {
    const payment = (event.payload as any)?.payment?.entity;
    const razorpayOrderId = payment?.order_id as string | undefined;

    if (razorpayOrderId) {
      await supabase
        .from('orders')
        .update({
          payment_status: 'failed',
          updated_at:     new Date().toISOString(),
        } as any)
        .eq('razorpay_order_id', razorpayOrderId)
        .neq('payment_status', 'paid'); // don't downgrade paid orders
    }
  }

  // Always return 200 to acknowledge receipt
  return NextResponse.json({ ok: true });
}
