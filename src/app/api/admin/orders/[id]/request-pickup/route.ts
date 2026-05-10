import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/requireAdmin'
import { createAdminClient } from '@/lib/supabase/server'
import { 
  generateShiprocketAWB, 
  requestShiprocketPickup 
} from '@/lib/shiprocket'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAdmin()
  if (authResult instanceof NextResponse) return authResult

  const { id } = await params

  try {
    const supabase = createAdminClient()
    
    // Get the order
    const { data: order, error } = await supabase
      .from('orders')
      .select('id, shiprocket_shipment_id, fulfillment_status')
      .eq('id', id)
      .single()

    if (error || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    if (!order.shiprocket_shipment_id) {
      return NextResponse.json(
        { error: 'No Shiprocket shipment found for this order. Create it manually in Shiprocket dashboard.' },
        { status: 400 }
      )
    }

    // Step 1: Generate AWB
    const awbData = await generateShiprocketAWB(order.shiprocket_shipment_id)
    
    // Step 2: Request pickup
    await requestShiprocketPickup(order.shiprocket_shipment_id)

    // Step 3: Update Supabase
    await supabase
      .from('orders')
      .update({
        shiprocket_awb_code: awbData.awb_code,
        shiprocket_courier_name: awbData.courier_name,
        fulfillment_status: 'pending_pickup',
      })
      .eq('id', id)

    return NextResponse.json({
      success: true,
      awb_code: awbData.awb_code,
      courier_name: awbData.courier_name,
      message: 'Pickup requested successfully',
    })

  } catch (error: any) {
    console.error('[request-pickup] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to request pickup' },
      { status: 500 }
    )
  }
}
