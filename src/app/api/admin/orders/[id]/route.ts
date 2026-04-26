import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'
import { createAdminClient } from '@/lib/supabase/server'
import { createShiprocketOrder } from '@/lib/shiprocket'

export const runtime = 'nodejs'

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(_: NextRequest, { params }: RouteContext) {
  const { id } = await params
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createAdminSupabaseClient() as any

  // Fetch order + related items + invoice + status history in parallel
  const [orderRes, itemsRes, invoiceRes, historyRes] = await Promise.all([
    supabase.from('orders').select('*').eq('id', id).single(),

    supabase
      .from('order_items')
      .select(`
        id, quantity,
        price_at_purchase, price,
        variant_size, size,
        variant_color, color,
        product_name,
        product_id,
        products:product_id(name, id, slug)
      `)
      .eq('order_id', id),

    supabase
      .from('invoices')
      .select('invoice_number, issued_at, cgst, sgst, igst, total')
      .eq('order_id', id)
      .maybeSingle(),

    supabase
      .from('order_status_history')
      .select('status, note, changed_by, created_at')
      .eq('order_id', id)
      .order('created_at', { ascending: false })
      .limit(20),
  ])

  if (orderRes.error || !orderRes.data) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  }

  return NextResponse.json({
    ...orderRes.data,
    order_items: itemsRes.data ?? [],
    invoice: invoiceRes.data ?? null,
    status_history: historyRes.data ?? [],
  })
}

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  const { id } = await params
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createAdminSupabaseClient() as any

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  // Only allow safe fields to be patched
  const allowed = [
    'status', 'admin_note', 'shipping_carrier', 'tracking_number',
    'tracking_url', 'shiprocket_order_id', 'shiprocket_awb', 'label_url',
  ]
  const patch: Record<string, unknown> = {}
  for (const key of allowed) {
    if (key in body) patch[key] = body[key]
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('orders')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // ── Auto-push to Shiprocket when status moves to 'processing' ─────────────────
  const newStatus = patch.status as string | undefined
  if (
    (newStatus === 'processing' || newStatus === 'confirmed') &&
    !data.shiprocket_order_id
  ) {
    try {
      const adminSupabase = createAdminClient()
      const { data: fullOrder } = await adminSupabase
        .from('orders')
        .select('*')
        .eq('id', id)
        .single()

      if (fullOrder) {
        const srData = await createShiprocketOrder(fullOrder)
        if (srData?.order_id) {
          await adminSupabase
            .from('orders')
            .update({
              shiprocket_order_id: String(srData.order_id),
              label_url:           srData.label_url || null,
            })
            .eq('id', id)
          // Add shipping label to response if available
          data.shiprocket_order_id = String(srData.order_id)
          data.label_url           = srData.label_url || null
        }
      }
    } catch (srErr) {
      // Non-fatal — Shiprocket push can be retried manually
      console.warn('[Shiprocket] Auto-push failed:', srErr)
    }
  }

  // ── Status-change side-effects ────────────────────────────────────────────────
  if (newStatus === 'shipped' || newStatus === 'delivered') {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://labelwink.co'

    try {
      // Fetch full order for email + points
      const { data: fullOrder } = await supabase
        .from('orders')
        .select('id, customer_email, customer_name, total, user_id, shiprocket_awb, tracking_number')
        .eq('id', id)
        .single()

      if (fullOrder?.customer_email) {
        if (newStatus === 'shipped') {
          const awb = fullOrder.shiprocket_awb || fullOrder.tracking_number || patch.tracking_number || ''
          await fetch(`${siteUrl}/api/send-email`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              to:    fullOrder.customer_email,
              type:  'order_shipped',
              title: 'Your order has been shipped!',
              body:  `Your Label Wink order is on its way.`,
              data:  { order_id: fullOrder.id, awb: String(awb) },
            }),
          }).catch(() => {})
        }

        if (newStatus === 'delivered') {
          // Send delivered email
          await fetch(`${siteUrl}/api/send-email`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              to:    fullOrder.customer_email,
              type:  'order_delivered',
              title: 'Order delivered!',
              body:  `Your Label Wink order has been delivered.`,
              data:  { order_id: fullOrder.id },
            }),
          }).catch(() => {})

          // Credit wink points: 1 pt per ₹100 spent (min 10 pts, max 500 pts)
          if (fullOrder.user_id) {
            const orderTotal    = Number(fullOrder.total) || 0
            const pointsToCredit = Math.min(500, Math.max(10, Math.floor(orderTotal / 100)))
            try {
              const { data: prof } = await supabase
                .from('profiles')
                .select('wink_points')
                .eq('id', fullOrder.user_id)
                .single()
              const newBalance = (prof?.wink_points || 0) + pointsToCredit
              await supabase
                .from('profiles')
                .update({ wink_points: newBalance })
                .eq('id', fullOrder.user_id)
              await supabase
                .from('wink_points_history')
                .insert({
                  user_id:       fullOrder.user_id,
                  type:          'earned',
                  points:        pointsToCredit,
                  balance_after: newBalance,
                  description:   `Earned for order #${fullOrder.id.slice(0, 8).toUpperCase()}`,
                  order_id:      fullOrder.id,
                })
            } catch { /* non-fatal */ }
          }
        }
      }
    } catch { /* non-fatal */ }
  }

  return NextResponse.json(data)
}
