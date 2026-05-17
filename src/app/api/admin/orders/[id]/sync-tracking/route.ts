import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import {
  getShiprocketOrderDetails,
  trackShiprocketAWB,
  mapShiprocketStatus,
} from '@/lib/shiprocket'

export async function POST(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = createAdminClient()

  const { data: order, error } = await supabase
    .from('orders')
    .select('id, shiprocket_order_id, shiprocket_shipment_id, tracking_number, status')
    .eq('id', id)
    .single()

  if (error || !order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  }

  if (!order.shiprocket_order_id) {
    return NextResponse.json(
      { error: 'No Shiprocket order linked to this order yet.' },
      { status: 400 }
    )
  }

  try {
    // Fetch order details from Shiprocket
    const srOrder = await getShiprocketOrderDetails(order.shiprocket_order_id)
    console.log('[sync-tracking] SR order details:', JSON.stringify(srOrder))

    const shipments: any[] = srOrder?.data?.shipments ?? []
    const shipment = shipments[0] ?? {}

    const awb_code      = shipment.awb        || order.tracking_number || null
    const courier_name  = shipment.courier    || null
    const sr_status     = shipment.status     || srOrder?.data?.status || null
    const pickup_date   = shipment.pickup_date || null
    const etd           = shipment.etd        || null   // estimated delivery

    // Fetch detailed tracking activities if AWB is available
    let trackingActivities: any[] = []
    if (awb_code) {
      const awbData = await trackShiprocketAWB(awb_code)
      console.log('[sync-tracking] AWB track response:', JSON.stringify(awbData))
      trackingActivities = awbData?.tracking_data?.shipment_track_activities
        ?? awbData?.tracking_data?.track_activities
        ?? []
    }

    // Map status
    const mappedStatus = sr_status ? mapShiprocketStatus(sr_status) : null

    // Build update payload
    const updateData: Record<string, any> = {
      shiprocket_status: sr_status,
      shiprocket_tracking_data: {
        sr_status,
        courier_name,
        pickup_date,
        estimated_delivery: etd,
        activities: trackingActivities.slice(0, 20), // cap to avoid bloat
        last_synced: new Date().toISOString(),
      },
      shiprocket_last_synced_at: new Date().toISOString(),
    }

    if (awb_code)     updateData.tracking_number   = awb_code
    if (courier_name) updateData.shipping_carrier  = courier_name
    if (awb_code)     updateData.shiprocket_awb_code = awb_code
    if (courier_name) updateData.shiprocket_courier_name = courier_name
    if (etd)          updateData.estimated_delivery = etd.split('T')[0]
    if (awb_code)     updateData.tracking_url = `https://shiprocket.co/tracking/${awb_code}`

    // Only update status if it's a forward move (don't downgrade delivered → shipped)
    const statusOrder = ['pending', 'confirmed', 'packed', 'shipped', 'delivered', 'cancelled']
    const currentIdx  = statusOrder.indexOf(order.status)
    const mappedIdx   = mappedStatus ? statusOrder.indexOf(mappedStatus) : -1
    if (mappedStatus && mappedIdx > currentIdx) {
      updateData.status = mappedStatus
    }

    await supabase.from('orders').update(updateData).eq('id', id)

    return NextResponse.json({
      success: true,
      sr_status,
      awb_code,
      courier_name,
      pickup_date,
      estimated_delivery: etd,
      mapped_status: mappedStatus,
      activities_count: trackingActivities.length,
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    console.error('[sync-tracking] error:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
