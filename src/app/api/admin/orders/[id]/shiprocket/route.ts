import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { createShiprocketOrder, getShiprocketTracking } from '@/lib/shiprocket'

// POST — push order to Shiprocket
export async function POST(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createAdminClient()

  const { data: order, error } = await supabase.from('orders').select('*').eq('id', id).single()
  if (error || !order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })

  try {
    const srData = await createShiprocketOrder(order)
    if (!srData.order_id) {
      return NextResponse.json({ error: srData.message || 'Shiprocket error', detail: srData }, { status: 400 })
    }

    await supabase.from('orders').update({
      shiprocket_order_id: String(srData.order_id),
      label_url: srData.label_url || null,
    }).eq('id', id)

    return NextResponse.json({ success: true, shiprocket_order_id: srData.order_id, label_url: srData.label_url })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// GET — fetch Shiprocket tracking
export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createAdminClient()

  const { data: order } = await supabase.from('orders').select('shiprocket_order_id').eq('id', id).single()
  if (!order?.shiprocket_order_id) return NextResponse.json({ error: 'No Shiprocket order' }, { status: 404 })

  const tracking = await getShiprocketTracking(order.shiprocket_order_id)
  return NextResponse.json(tracking)
}
