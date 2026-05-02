import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/requireAdmin'
import { sendOrderDeliveredSMS } from '@/lib/sms-notifications'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin()
  if (guard) return guard

  const { id } = await params
  const supabase = createAdminClient()

  try {
    const body = await req.json()
    const { status, note } = body

    const { data: order, error: fetchError } = await supabase
      .from('orders')
      .select('id, status, customer_phone, customer_email, customer_name, total, invoices(invoice_number)')
      .eq('id', id)
      .single()

    if (fetchError || !order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })

    const currentStatus = order.status

    const ALLOWED_TRANSITIONS: Record<string, string[]> = {
      pending: ['confirmed', 'cancelled'],
      confirmed: ['packed', 'cancelled'],
      packed: ['order_ready', 'confirmed'],
      order_ready: ['dispatched', 'packed'],
      dispatched: ['shipped', 'delivered'],
      shipped: ['delivered'],
      delivered: ['return_requested'],
      return_requested: ['refunded', 'delivered'],
      cancelled: [],
      refunded: []
    }

    const allowed = ALLOWED_TRANSITIONS[currentStatus] || []
    if (!allowed.includes(status)) {
      return NextResponse.json({ error: `Cannot move from ${currentStatus} to ${status}` }, { status: 400 })
    }

    const { error: updateError } = await supabase
      .from('orders')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (updateError) return NextResponse.json({ error: 'Update failed' }, { status: 500 })

    await supabase.from('order_status_history').insert({
      order_id: id,
      status,
      note: note || null,
      changed_by: 'admin'
    })

    const invoice_number = order.invoices?.[0]?.invoice_number || 'PENDING'

    await supabase.from('admin_notifications').insert({
      type: 'order_status_update',
      title: 'Order Status Updated',
      body: `Order ${invoice_number} → ${status}`,
      entity_type: 'order',
      entity_id: id
    })

    if (status === 'delivered') {
      const { data: settings } = await supabase.from('shop_settings').select('store_name').single();
      if (order.customer_phone) {
        sendOrderDeliveredSMS(order.customer_phone, {
          customer_name: order.customer_name,
          invoice_number: invoice_number,
          store_name: settings?.store_name || 'LabelWink'
        }).catch(e => console.error(e))
      }
    }

    return NextResponse.json({ success: true, previous_status: currentStatus, new_status: status })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
