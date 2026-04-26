import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

/**
 * POST /api/shiprocket/webhook
 *
 * Shiprocket pushes shipment status updates to this URL.
 * Configure in Shiprocket Dashboard → Settings → Webhooks.
 *
 * The Shiprocket webhook sends a JSON body with keys like:
 *   awb, order_id (their internal ID), current_status, shipment_track_activities, etc.
 */
export async function POST(req: NextRequest) {
  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const supabase = createAdminClient()

  // Shiprocket sends their internal order_id and the AWB code
  const srOrderId   = (body.order_id   || body.shiprocket_order_id || body.id) as string | undefined
  const awbCode     = (body.awb        || body.awb_code) as string | undefined
  const srStatus    = (body.current_status || body.status) as string | undefined
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

  // ── Find order by shiprocket_order_id or by AWB ─────────────────────────────
  let orderId: string | null = null

  if (srOrderId) {
    const { data } = await supabase
      .from('orders')
      .select('id')
      .eq('shiprocket_order_id', String(srOrderId))
      .maybeSingle()
    orderId = data?.id ?? null
  }

  if (!orderId && awbCode) {
    const { data } = await supabase
      .from('orders')
      .select('id')
      .eq('shiprocket_awb', String(awbCode))
      .maybeSingle()
    orderId = data?.id ?? null
  }

  if (!orderId) {
    console.warn('[ShiprocketWebhook] No matching order for', { srOrderId, awbCode })
    return NextResponse.json({ ok: true })
  }

  // ── Build patch ──────────────────────────────────────────────────────────────
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (awbCode)      patch.shiprocket_awb   = awbCode
  if (trackingUrl)  patch.tracking_url     = trackingUrl
  if (awbCode)      patch.tracking_number  = awbCode
  if (mappedStatus) patch.status           = mappedStatus

  await supabase.from('orders').update(patch as any).eq('id', orderId)

  // ── Admin notification if shipped/delivered ──────────────────────────────────
  if (mappedStatus === 'shipped' || mappedStatus === 'delivered') {
    try {
      const label = mappedStatus === 'delivered' ? 'Delivered' : 'Shipped'
      await supabase.from('admin_notifications').insert({
        type:  mappedStatus === 'delivered' ? 'order_delivered' : 'order_shipped',
        title: `Order ${label} — #${orderId.slice(0, 8).toUpperCase()}`,
        body:  awbCode ? `AWB: ${awbCode}` : `Status: ${srStatus}`,
        data:  { order_id: orderId, awb: awbCode, shiprocket_status: srStatus },
      } as any)
    } catch { /* non-fatal */ }
  }

  return NextResponse.json({ ok: true })
}
