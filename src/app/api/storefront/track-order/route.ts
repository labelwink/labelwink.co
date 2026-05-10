import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const sb = createAdminSupabaseClient()

  try {
    const { identifier, phone_last4 } = await req.json()

    if (!identifier || !phone_last4 || phone_last4.length !== 4) {
      return NextResponse.json(
        { error: 'Please provide Order ID / Invoice Number and last 4 digits of phone.' },
        { status: 400 }
      )
    }

    // Search by order id, order_number, or invoice number
    // phone_last4 acts as lightweight verification
    const trimmed = identifier.trim()
    const phoneSuffix = phone_last4.trim()

    // Try matching on orders first (id text prefix, order_number, or customer_name)
    const { data: orders, error: orderErr } = await sb.rpc('search_order_for_tracking', {
      p_identifier: trimmed,
      p_phone_last4: phoneSuffix
    })

    // If the RPC doesn't exist, fall back to manual query
    let order: any = orders?.[0] ?? null

    if (orderErr || !order) {
      // Fallback: manual query
      // Check orders table — match on id prefix, order_number, or invoice_number
      const { data: manualOrders, error: manualErr } = await sb
        .from('orders')
        .select('*')
        .or(`id.ilike.%${trimmed}%,order_number.ilike.%${trimmed}%`)
        .ilike('customer_phone', `%${phoneSuffix}`)
        .limit(1)

      if (manualErr) throw new Error(manualErr.message)

      if (!manualOrders || manualOrders.length === 0) {
        // Also try matching via invoice number
        const { data: invoiceMatch } = await sb
          .from('invoices')
          .select('order_id')
          .ilike('invoice_number', `%${trimmed}%`)
          .limit(1)

        if (invoiceMatch && invoiceMatch.length > 0) {
          const { data: invOrder } = await sb
            .from('orders')
            .select('*')
            .eq('id', invoiceMatch[0].order_id)
            .ilike('customer_phone', `%${phoneSuffix}`)
            .single()

          order = invOrder
        }
      } else {
        order = manualOrders[0]
      }
    }

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found. Check your details.' },
        { status: 404 }
      )
    }

    // Fetch invoice number
    const { data: invoice } = await sb
      .from('invoices')
      .select('invoice_number')
      .eq('order_id', order.id)
      .single()

    // Fetch status history
    const { data: statusHistory } = await sb
      .from('order_status_history')
      .select('status, created_at')
      .eq('order_id', order.id)
      .order('created_at', { ascending: true })

    // Parse items — stored as jsonb in orders.items
    const items = Array.isArray(order.items)
      ? order.items.map((item: any) => ({
          product_name: item.product_name || item.name,
          size: item.size || '',
          quantity: item.quantity || 1,
        }))
      : []

    // Return safe public fields only — first name only for privacy
    const firstName = order.customer_name
      ? order.customer_name.split(' ')[0]
      : 'Customer'

    return NextResponse.json({
      order_id: order.id,
      invoice_number: invoice?.invoice_number || null,
      status: order.status,
      created_at: order.created_at,
      customer_name: firstName,
      items,
      total: order.total,
      shipping_method: order.shipping_method || 'Standard',
      tracking_number: order.tracking_number || order.shiprocket_awb || null,
      tracking_url: order.tracking_url || null,
      shipping_carrier: order.shipping_carrier || order.courier || null,
      estimated_delivery: null, // can be enhanced later
      status_history: statusHistory || [],
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    console.error('[track-order]', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
