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
      .select('id, payment_status, invoice_number:invoices(invoice_number)')
      .eq('razorpay_order_id', order_id_rzp)
      .single()

    if (order && order.payment_status !== 'paid') {
      const { error: updateError } = await supabase
        .from('orders')
        .update({ 
          payment_status: 'paid',
          razorpay_payment_id: payment_id,
          updated_at: new Date().toISOString()
        })
        .eq('id', order.id)

      if (!updateError) {
        const invoiceNum = (order.invoice_number as any)?.[0]?.invoice_number || 'N/A'
        await sendTelegramMessage(
          `✅ <b>Payment Captured</b>\n` +
          `💰 Amount: ₹${amount}\n` +
          `📄 Invoice: ${invoiceNum}\n` +
          `🆔 Payment ID: <code>${payment_id}</code>`
        )
      }
    }
  } else if (event === 'payment.failed') {
    const payment = payload.payment.entity
    const payment_id = payment.id
    const amount = payment.amount / 100
    const error_desc = payment.error_description || 'Unknown error'

    await sendTelegramMessage(
      `❌ <b>Payment Failed</b>\n` +
      `🆔 ID: <code>${payment_id}</code>\n` +
      `💰 Amount: ₹${amount}\n` +
      `⚠️ Error: ${error_desc}`
    )
  }

  // Always return 200
  return NextResponse.json({ status: 'ok' })
}
