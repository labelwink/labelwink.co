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
      supabase.from('orders').select('*, profiles(*)').eq('id', id).single(),

      supabase
        .from('order_items')
        .select(`
          id, quantity,
          price_at_purchase,
          variant_size, variant_color,
          product_name,
          product_id,
          product_image,
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

  const { admin_note } = body
  if (admin_note === undefined) {
    return NextResponse.json({ error: 'Only admin_note update is supported here' }, { status: 400 })
  }

  const { error } = await supabase
    .from('orders')
    .update({ admin_note, updated_at: new Date().toISOString() } as any)
    .eq('id', id)

  if (error) {
    console.error('[PATCH /api/admin/orders/[id]]', { id, error })
    return NextResponse.json({ error: error.message ?? 'DB update failed' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
