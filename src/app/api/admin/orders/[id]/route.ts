import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(_: NextRequest, { params }: RouteContext) {
  const { id } = await params
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createAdminSupabaseClient() as any

  // Fetch order + related items + invoice + status history in parallel
  const [orderRes, itemsRes, invoiceRes, historyRes] = await Promise.all([
    supabase
      .from('orders')
      .select('*')
      .eq('id', id)
      .single(),

    supabase
      .from('order_items')
      .select('id, quantity, price, size, color, product_id, products:product_id(name, id)')
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
    .update(patch)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
