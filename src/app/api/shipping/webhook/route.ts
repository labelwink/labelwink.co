import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { sendTelegramMessage } from '@/lib/telegram'

export const runtime = 'nodejs'

/**
 * POST /api/shipping/webhook
 *
 * Shiprocket pushes shipment status updates to this URL.
 * Configure in Shiprocket Dashboard → Settings → Webhooks.
 * URL: https://demo.labelwink.co/api/shipping/webhook
 */
export async function POST(req: NextRequest) {
  // ── Security Check ───────────────────────────────────────────────────────────
  const webhookSecret = process.env.SHIPROCKET_WEBHOOK_SECRET
  if (webhookSecret) {
    const passedKey = req.headers.get('x-api-key') || req.headers.get('authorization')
    if (!passedKey || passedKey.replace('Bearer ', '') !== webhookSecret) {
      console.warn('[ShiprocketWebhook] Unauthorized attempt')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const supabase = createAdminClient()

  const srOrderId   = (body.order_id   || body.shiprocket_order_id || body.id) as string | undefined
  const awbCode     = (body.awb        || body.awb_code) as string | undefined
  const srStatus    = (body.current_status || body.status) as string | undefined
  const courier     = (body.courier_name  || body.courier) as string | undefined
  const trackingUrl = awbCode ? `https://shiprocket.co/tracking/${awbCode}` : undefined

  if (!srOrderId && !awbCode) {
    return NextResponse.json({ ok: true }) // unknown format, ack anyway
  }

  // ── Map Shiprocket status → our internal order status ──────────────────────
  const STATUS_MAP: Record<string, string> = {
    'Shipped':           'shipped',
    'Out For Delivery':  'shipped',
    'Delivered':         'delivered',
    'Undelivered':       'processing',
    'RTO Initiated':     'processing',
    'RTO Delivered':     'processing',
    'Pickup Exception':  'processing',
    'Cancelled':         'cancelled',
  }
  const mappedStatus = srStatus ? STATUS_MAP[srStatus] : undefined

  // ── Find order with full customer details ─────────────────────────────────
  let order: any = null

  if (srOrderId) {
    const { data } = await supabase
      .from('orders')
      .select('id, order_number, customer_name, customer_email, user_id')
      .eq('shiprocket_order_id', String(srOrderId))
      .maybeSingle()
    order = data
  }

  if (!order && awbCode) {
    const { data } = await supabase
      .from('orders')
      .select('id, order_number, customer_name, customer_email, user_id')
      .eq('shiprocket_awb', String(awbCode))
      .maybeSingle()
    order = data
  }

  if (!order) {
    console.warn('[ShiprocketWebhook] No matching order for', { srOrderId, awbCode })
    return NextResponse.json({ ok: true })
  }

  const orderId     = order.id
  const orderNumber = order.order_number
  const customerEmail = order.customer_email
  const customerName  = order.customer_name

  // ── Build patch ──────────────────────────────────────────────────────────────
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (awbCode)      patch.shiprocket_awb   = awbCode
  if (trackingUrl)  patch.tracking_url     = trackingUrl
  if (awbCode)      patch.tracking_number  = awbCode
  if (mappedStatus) patch.status           = mappedStatus

  await supabase.from('orders').update(patch as any).eq('id', orderId)

  // ── Send customer email + admin Telegram on key events ────────────────────
  if (mappedStatus === 'shipped' || mappedStatus === 'delivered') {
    const label = mappedStatus === 'delivered' ? 'Delivered' : 'Shipped'
    const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://labelwink.co'

    // Customer storefront notification in DB
    if (order.user_id) {
      try {
        const statusTitles: Record<string, string> = {
          shipped: 'Order Shipped 🚚',
          delivered: 'Order Delivered 🎉'
        };
        const statusMessages: Record<string, string> = {
          shipped: `Your order #${orderNumber} has been shipped!${awbCode ? ` Tracking AWB: ${awbCode}.` : ''}`,
          delivered: `Your order #${orderNumber} has been delivered. Enjoy your gorgeous pieces!`
        };
        await supabase.from('notifications').insert({
          user_id: order.user_id,
          type: mappedStatus === 'delivered' ? 'order_delivered' : 'order_shipped',
          title: statusTitles[mappedStatus] || 'Order Updated',
          message: statusMessages[mappedStatus] || `Your order #${orderNumber} is now ${mappedStatus}.`,
          data: { order_id: orderId, order_number: orderNumber, awb: awbCode }
        });
      } catch (custNotifErr) {
        console.error('[ShiprocketWebhook] Customer storefront notification failed:', custNotifErr);
      }
    }

    // Customer email notification
    if (customerEmail) {
      try {
        const emailType = mappedStatus === 'delivered' ? 'order_delivered' : 'order_shipped'
        await fetch(`${SITE_URL}/api/send-email`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-internal-secret': process.env.INTERNAL_SECRET || '',
          },
          body: JSON.stringify({
            to:    customerEmail,
            type:  emailType,
            title: '',
            body:  '',
            data: {
              order_id:     orderId,
              order_number: orderNumber,
              customerName,
              awb:    awbCode,
              courier,
            },
          }),
        })
      } catch (emailErr) {
        console.error('[ShiprocketWebhook] Customer email failed:', emailErr)
      }
    }
  }

  return NextResponse.json({ ok: true })
}

