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
  const { data: settings } = await supabase.from('shop_settings').select('store_name').single();
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
      .select('id, payment_status, order_number')
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
          title: `Payment Captured — #${order.order_number || order.id.slice(0, 8).toUpperCase()}`,
          message: `Razorpay webhook confirmed payment ${razorpayPaymentId}`,
          metadata:  { order_id: order.id, razorpay_payment_id: razorpayPaymentId },
        } as any);
      } catch { /* non-fatal */ }

      // ── Send order confirmation email ───────────────────────────────────
      try {
        const { data: fullOrder } = await supabase
          .from('orders')
          .select('customer_email, customer_name, id, order_number')
          .eq('id', order.id)
          .single();

        if (fullOrder?.customer_email) {
          const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
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
              body:  `Hi ${fullOrder.customer_name || 'there'}, your order from ${settings?.store_name || 'Our Store'} has been confirmed.`,
              data:  { order_id: fullOrder.id, order_number: fullOrder.order_number },
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
      const { data: order } = await supabase
        .from('orders')
        .select('id, order_number, user_id, customer_name, customer_email, total_amount')
        .eq('razorpay_order_id', razorpayOrderId)
        .maybeSingle();

      if (order) {
        await supabase
          .from('orders')
          .update({
            payment_status: 'failed',
            updated_at:     new Date().toISOString(),
          } as any)
          .eq('id', order.id)
          .neq('payment_status', 'paid'); // don't downgrade paid orders

        // Admin notification on website (admin_notifications)
        try {
          await supabase.from('admin_notifications').insert({
            type: 'payment_failed',
            title: `Payment Failed — #${order.order_number || order.id.slice(0, 8).toUpperCase()}`,
            message: `Payment failed for order of ₹${order.total_amount} by ${order.customer_name || order.customer_email || 'Customer'}`,
            metadata: { order_id: order.id, razorpay_order_id: razorpayOrderId }
          } as any);
        } catch (e) { console.error('Admin failure notification failed:', e); }

        // Telegram alert to admin
        try {
          const { sendTelegramMessage } = await import('@/lib/telegram');
          await sendTelegramMessage(
            `❌ <b>Payment Failed</b>\n` +
            `💰 Amount: ₹${order.total_amount}\n` +
            `👤 Customer: ${order.customer_name || order.customer_email}\n` +
            `🆔 Order ID: <code>${order.id}</code>`
          );
        } catch (e) { console.error('Telegram message failed:', e); }

        // Customer storefront notification (notifications)
        if (order.user_id) {
          try {
            await supabase.from('notifications').insert({
              user_id: order.user_id,
              type: 'payment_failed',
              title: 'Payment Failed ❌',
              message: `Payment for your order #${order.order_number || order.id.slice(0, 8).toUpperCase()} of ₹${order.total_amount} has failed. Please try again.`,
              data: { order_id: order.id, razorpay_order_id: razorpayOrderId }
            } as any);
          } catch (e) { console.error('Customer failure notification failed:', e); }
        }
      }
    }
  }

  // Always return 200 to acknowledge receipt
  return NextResponse.json({ ok: true });
}
