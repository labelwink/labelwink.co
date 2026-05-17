import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import crypto from 'crypto'
import { sendTelegramMessage } from '@/lib/telegram'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const RAZORPAY_WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET

  if (!RAZORPAY_WEBHOOK_SECRET) {
    console.error('RAZORPAY_WEBHOOK_SECRET is not defined')
    return NextResponse.json({ error: 'Webhook secret missing' }, { status: 500 })
  }

  const body_raw_string = await req.text()
  const razorpay_signature = req.headers.get('x-razorpay-signature')

  if (!razorpay_signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  // 1. Verify webhook signature
  const expected = crypto
    .createHmac('sha256', RAZORPAY_WEBHOOK_SECRET)
    .update(body_raw_string)
    .digest('hex')

  if (expected !== razorpay_signature) {
    console.warn('[Razorpay Webhook] Signature mismatch')
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  // 2. Parse event
  let eventData: any
  try {
    eventData = JSON.parse(body_raw_string)
  } catch (err) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  const { event, payload } = eventData
  const supabase = createAdminClient()

  // 3. Handle events
  if (event === 'payment.captured') {
    const payment = payload.payment.entity
    const payment_id = payment.id
    const order_id_rzp = payment.order_id
    const amount = payment.amount / 100

    // Find order
    const { data: order } = await supabase
      .from('orders')
      .select('id, user_id, customer_name, customer_email, order_number, total_amount, payment_status, status, invoice_number:invoices(invoice_number)')
      .eq('razorpay_order_id', order_id_rzp)
      .single()

    if (order && order.payment_status !== 'paid') {
      const { error: updateError } = await supabase
        .from('orders')
        .update({ 
          payment_status: 'paid',
          razorpay_payment_id: payment_id,
          status: 'confirmed',
          updated_at: new Date().toISOString()
        } as any)
        .eq('id', order.id)

      if (!updateError) {
        const invoiceNum = (order.invoice_number as any)?.[0]?.invoice_number || 'N/A'
        const customerNameStr = order.customer_name || order.customer_email || 'Customer'
        const orderNumStr = order.order_number || order.id.slice(0, 8).toUpperCase()

        // 1. Telegram alert for new order
        try {
          await sendTelegramMessage(
            `🛒 <b>New Order Placed</b>\n` +
            `💰 Total: ₹${order.total_amount || amount}\n` +
            `📄 Invoice: ${invoiceNum}\n` +
            `👤 Customer: ${customerNameStr}\n` +
            `🆔 Order ID: <code>${order.id}</code>\n` +
            `🔑 TXN: <code>${payment_id}</code>`
          )
        } catch (alertError) {
          console.error('[Webhook] Telegram alert failed:', alertError)
        }

        // 2. Admin notification on website
        try {
          await supabase.from('admin_notifications').insert({
            type: 'new_order',
            title: `New Order Placed — #${orderNumStr}`,
            message: `Order for ₹${order.total_amount || amount} placed by ${customerNameStr}`,
            metadata: { order_id: order.id, order_number: order.order_number }
          } as any);
        } catch (notifErr) {
          console.error('[Webhook] Admin notification failed:', notifErr);
        }

        // 3. Customer storefront notification
        if (order.user_id) {
          try {
            await supabase.from('notifications').insert({
              user_id: order.user_id,
              type: 'order_confirmed',
              title: 'Order Confirmed! ✅',
              message: `Your order #${orderNumStr} has been successfully confirmed.`,
              data: { order_id: order.id, order_number: order.order_number }
            });
          } catch (custNotifErr) {
            console.error('[Webhook] Customer storefront notification failed:', custNotifErr);
          }
        }
      }
    }
  } else if (event === 'payment.failed') {
    const payment = payload.payment.entity
    const order_id_rzp = payment.order_id

    if (order_id_rzp) {
      const { data: order } = await supabase
        .from('orders')
        .select('id, order_number, user_id, customer_name, customer_email, total_amount')
        .eq('razorpay_order_id', order_id_rzp)
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
            metadata: { order_id: order.id, razorpay_order_id: order_id_rzp }
          } as any);
        } catch (e) { console.error('Admin failure notification failed:', e); }

        // Telegram alert to admin
        try {
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
              data: { order_id: order.id, razorpay_order_id: order_id_rzp }
            } as any);
          } catch (e) { console.error('Customer failure notification failed:', e); }
        }
      }
    }
  }

  // Always return 200
  return NextResponse.json({ status: 'ok' })
}
