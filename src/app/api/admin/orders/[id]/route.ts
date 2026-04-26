import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'
import { createAdminClient } from '@/lib/supabase/server'
import { createShiprocketOrder } from '@/lib/shiprocket'
import { requireAdmin } from '@/lib/requireAdmin'

export const runtime = 'nodejs'

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(_: NextRequest, { params }: RouteContext) {
  const guard = await requireAdmin()
  if (guard) return guard
  const { id } = await params
  try {
    const supabase = createAdminSupabaseClient()

    const [orderRes, itemsRes, invoiceRes, historyRes] = await Promise.all([
      supabase.from('orders').select('*').eq('id', id).single(),

      supabase
        .from('order_items')
        .select(`
          id, quantity,
          price_at_purchase,
          variant_size, variant_color,
          product_name,
          product_id,
          image_url,
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
      console.error('[GET /api/admin/orders/[id]]', orderRes.error)
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    return NextResponse.json({
      ...orderRes.data,
      order_items: itemsRes.data ?? [],
      invoice: invoiceRes.data ?? null,
      status_history: historyRes.data ?? [],
    })
  } catch (err: any) {
    console.error('[GET /api/admin/orders/[id]] unexpected:', { id, error: err })
    return NextResponse.json({ error: err?.message ?? 'Unknown error' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  const guard = await requireAdmin()
  if (guard) return guard
  const { id } = await params
  const supabase = createAdminSupabaseClient()

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  // Only allow safe fields to be patched
  const allowedFields = [
    'status', 'admin_note', 'shipping_carrier', 'tracking_number',
    'tracking_url', 'shiprocket_order_id', 'shiprocket_awb', 'label_url',
  ]
  const patch: Record<string, unknown> = {}
  for (const key of allowedFields) {
    if (key in body) patch[key] = body[key]
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
  }

  // Validate status value if being changed
  const VALID_STATUSES = ['pending', 'confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered', 'cancelled']
  if ('status' in patch && !VALID_STATUSES.includes(patch.status as string)) {
    return NextResponse.json(
      { error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` },
      { status: 400 }
    )
  }

  const { data, error } = await supabase
    .from('orders')
    .update({ ...patch, updated_at: new Date().toISOString() } as any)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('[PATCH /api/admin/orders/[id]]', { id, patch, error })
    return NextResponse.json({ error: error.message ?? 'DB update failed' }, { status: 500 })
  }

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
            } as any)
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
            headers: {
              'Content-Type': 'application/json',
              'x-internal-secret': process.env.INTERNAL_SECRET ?? '',
            },
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
            headers: {
              'Content-Type': 'application/json',
              'x-internal-secret': process.env.INTERNAL_SECRET ?? '',
            },
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
                .update({ wink_points: newBalance } as any)
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
                } as any)
            } catch { /* non-fatal */ }
          }
        }
      }
    } catch { /* non-fatal */ }
  }

  return NextResponse.json(data)
}
