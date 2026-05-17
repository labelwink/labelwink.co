import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { cancelShiprocketOrder } from '@/lib/shiprocket'

const CANCEL_WINDOW_HOURS = 5

// Customer can cancel within 5 hours of placing order, and only if not yet shipped
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const db = createAdminClient()

  // Auth check
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: order, error } = await db
    .from('orders')
    .select('id, status, shiprocket_order_id, order_number, created_at, user_id')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (error || !order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  }

  // Ownership check
  if (order.user_id !== user.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  // Time window check
  const ageHours = (Date.now() - new Date(order.created_at).getTime()) / (1000 * 3600)
  if (ageHours > CANCEL_WINDOW_HOURS) {
    return NextResponse.json(
      { error: `Orders can only be cancelled within ${CANCEL_WINDOW_HOURS} hours of placing. Please contact support.` },
      { status: 400 }
    )
  }

  // Status check — cannot cancel if shipped or beyond
  const nonCancellable = ['shipped', 'dispatched', 'delivered', 'cancelled', 'return_requested']
  if (nonCancellable.includes(order.status)) {
    return NextResponse.json(
      { error: `This order cannot be cancelled as it is already "${order.status}". Please contact support.` },
      { status: 400 }
    )
  }

  // Cancel in Shiprocket if applicable
  if (order.shiprocket_order_id) {
    await cancelShiprocketOrder(order.shiprocket_order_id).catch(e =>
      console.error('[storefront/cancel] Shiprocket cancel error:', e.message)
    )
  }

  const { error: updateError } = await db
    .from('orders')
    .update({ status: 'cancelled' })
    .eq('id', id)
    .eq('user_id', user.id)

  if (updateError) {
    return NextResponse.json({ error: 'Failed to cancel order' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
