import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/requireAdmin'
import { sendOrderDeliveredSMS } from '@/lib/sms-notifications'
import { generateOrderDocuments } from '@/lib/pdf/generator'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin()
  if (guard instanceof NextResponse) return guard

  const { id } = await params
  const supabase = createAdminSupabaseClient()

  try {
    const body = await req.json()
    const { status, note } = body

    const { data: order, error: fetchError } = await supabase
      .from('orders')
      .select('*, invoices(*)')
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

    let updateData: any = { status, updated_at: new Date().toISOString() }

    // Generate documents if status is becoming packed and they don't exist
    if (status === 'packed' && !order.invoice_pdf_url) {
      const { data: settings } = await supabase.from('site_legal_settings').select('*').single()
      if (settings) {
        try {
          const docs = await generateOrderDocuments(supabase, order, settings)
          updateData = { ...updateData, ...docs }
        } catch (docError) {
          console.error('Failed to generate order documents:', docError)
          // we don't fail the status update if document generation fails
        }
      }
    }

    const { error: updateError } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', id)

    if (updateError) return NextResponse.json({ error: 'Update failed' }, { status: 500 })

    await supabase.from('order_status_history').insert({
      order_id: id,
      status,
      note: note || null,
      changed_by: 'admin'
    })

    const invoice_number = order.invoices?.[0]?.invoice_number || order.invoice_number || 'PENDING'

    if (order.user_id) {
      try {
        const statusTitles: Record<string, string> = {
          confirmed: 'Order Confirmed ✅',
          packed: 'Order Packed 📦',
          shipped: 'Order Shipped 🚚',
          delivered: 'Order Delivered 🎉',
          cancelled: 'Order Cancelled ❌',
          refunded: 'Order Refunded 💰'
        };
        const statusMessages: Record<string, string> = {
          confirmed: `Your order #${order.order_number} has been confirmed!`,
          packed: `Your order #${order.order_number} has been packed and is ready to be shipped.`,
          shipped: `Your order #${order.order_number} has been shipped!`,
          delivered: `Your order #${order.order_number} has been delivered. Thank you for shopping with us!`,
          cancelled: `Your order #${order.order_number} has been cancelled.`,
          refunded: `A refund has been processed for your order #${order.order_number}.`
        };
        await supabase.from('notifications').insert({
          user_id: order.user_id,
          type: `order_${status}`,
          title: statusTitles[status] || 'Order Updated',
          message: statusMessages[status] || `Your order #${order.order_number} status is now ${status}.`,
          data: { order_id: id, order_number: order.order_number }
        });
      } catch (custNotifErr) {
        console.error('Customer status notification failed:', custNotifErr);
      }
    }

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
