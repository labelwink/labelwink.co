import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import {
  getShiprocketOrderDetails,
  trackShiprocketAWB,
  mapShiprocketStatus,
} from '@/lib/shiprocket'

export const maxDuration = 60  // Allow up to 60s for bulk sync

// Cron secret guard (set CRON_SECRET in .env.local)
function isCronAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return true // if not set, allow (Vercel cron calls internally)
  const auth = req.headers.get('authorization') || req.nextUrl.searchParams.get('secret')
  return auth === `Bearer ${secret}` || auth === secret
}

export async function POST(req: NextRequest) {
  if (!isCronAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return runSync()
}

// Vercel cron calls GET
export async function GET(req: NextRequest) {
  if (!isCronAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return runSync()
}

async function runSync() {
  const supabase = createAdminClient()

  // Fetch all orders that have a Shiprocket order ID and are in active shipping states
  const { data: orders, error } = await supabase
    .from('orders')
    .select('id, status, shiprocket_order_id, shiprocket_shipment_id, tracking_number, shiprocket_last_synced_at')
    .not('shiprocket_order_id', 'is', null)
    .in('status', ['packed', 'shipped', 'dispatched', 'confirmed'])
    .order('shiprocket_last_synced_at', { ascending: true, nullsFirst: true })
    .limit(30) // process up to 30 at a time to stay under timeouts

  if (error) {
    console.error('[sync-shiprocket/bulk] DB fetch error:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!orders || orders.length === 0) {
    return NextResponse.json({ success: true, synced: 0, message: 'No active shipments to sync.' })
  }

  const results: { id: string; status: string; error?: string }[] = []
  const statusOrder = ['pending', 'confirmed', 'packed', 'shipped', 'delivered', 'cancelled']

  for (const order of orders) {
    try {
      const srOrder = await getShiprocketOrderDetails(order.shiprocket_order_id!)
      const shipments: any[] = srOrder?.data?.shipments ?? []
      const shipment = shipments[0] ?? {}

      const awb_code     = shipment.awb     || order.tracking_number || null
      const courier_name = shipment.courier || null
      const sr_status    = shipment.status  || srOrder?.data?.status || null
      const etd          = shipment.etd     || null

      let trackingActivities: any[] = []
      if (awb_code) {
        try {
          const awbData = await trackShiprocketAWB(awb_code)
          trackingActivities = awbData?.tracking_data?.shipment_track_activities
            ?? awbData?.tracking_data?.track_activities
            ?? []
        } catch (e) {
          console.warn(`[sync/bulk] AWB track failed for ${order.id}`)
        }
      }

      const mappedStatus = sr_status ? mapShiprocketStatus(sr_status) : null

      const updateData: Record<string, any> = {
        shiprocket_status: sr_status,
        shiprocket_tracking_data: {
          sr_status,
          courier_name,
          estimated_delivery: etd,
          activities: trackingActivities.slice(0, 20),
          last_synced: new Date().toISOString(),
        },
        shiprocket_last_synced_at: new Date().toISOString(),
      }

      if (awb_code)     updateData.tracking_number         = awb_code
      if (awb_code)     updateData.shiprocket_awb_code     = awb_code
      if (courier_name) updateData.shipping_carrier        = courier_name
      if (courier_name) updateData.shiprocket_courier_name = courier_name
      if (etd)          updateData.estimated_delivery      = etd.split('T')[0]
      if (awb_code)     updateData.tracking_url            = `https://shiprocket.co/tracking/${awb_code}`

      // Only advance status, never downgrade
      const currentIdx = statusOrder.indexOf(order.status)
      const mappedIdx  = mappedStatus ? statusOrder.indexOf(mappedStatus) : -1
      if (mappedStatus && mappedIdx > currentIdx) {
        updateData.status = mappedStatus
      }

      await supabase.from('orders').update(updateData).eq('id', order.id)

      results.push({ id: order.id, status: mappedStatus || sr_status || 'unchanged' })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown'
      console.error(`[sync/bulk] order ${order.id} failed:`, msg)
      results.push({ id: order.id, status: 'error', error: msg })
    }
  }

  console.log(`[sync-shiprocket/bulk] Synced ${results.length} orders`)
  return NextResponse.json({ success: true, synced: results.length, results })
}
