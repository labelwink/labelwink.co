import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { cancelShiprocketOrder } from '@/lib/shiprocket'

// Admin can cancel any order in a cancellable state
export async function POST(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createAdminClient()

  const { data: order, error } = await supabase
    .from('orders')
    .select('id, status, shiprocket_order_id, order_number, created_at')
    .eq('id', id)
    .single()

  if (error || !order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  }

  const nonCancellableStatuses = ['shipped', 'delivered', 'cancelled', 'return_requested']
  if (nonCancellableStatuses.includes(order.status)) {
    return NextResponse.json(
      { error: `Cannot cancel an order with status "${order.status}"` },
      { status: 400 }
    )
  }

  // Cancel Shiprocket order if one was created
  if (order.shiprocket_order_id) {
    await cancelShiprocketOrder(order.shiprocket_order_id).catch(e =>
      console.error('[cancel] Shiprocket cancel error:', e.message)
    )
  }

  const { error: updateError } = await supabase
    .from('orders')
    .update({ status: 'cancelled' })
    .eq('id', id)

  if (updateError) {
    return NextResponse.json({ error: 'Failed to cancel order' }, { status: 500 })
  }

  // Log
  await supabase.from('system_logs').insert({
    level: 'info',
    category: 'order',
    message: `Order ${order.order_number || id.slice(0, 8).toUpperCase()} cancelled by admin`,
    context: { order_id: id },
  }).catch(() => {})

  return NextResponse.json({ success: true })
}
