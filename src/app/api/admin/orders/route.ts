import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/requireAdmin'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const guard = await requireAdmin()
  if (guard) return guard
  const supabase = createAdminSupabaseClient()
  const { searchParams } = new URL(req.url)

  const status  = searchParams.get('status') || ''
  const search  = searchParams.get('search') || ''
  const page    = Math.max(0, Number(searchParams.get('page') || '0'))
  const PAGE_SIZE = 25

  let query = (supabase as ReturnType<typeof createAdminSupabaseClient>)
    .from('orders')
    .select(
      'id, status, total, subtotal, shipping_amount, discount_amount, customer_name, customer_email, customer_phone, payment_status, razorpay_payment_id, shiprocket_order_id, tracking_number, shipping_carrier, created_at',
      { count: 'exact' }
    )
    .order('created_at', { ascending: false })

  if (status) query = query.eq('status', status)
  if (search) {
    query = query.or(
      `customer_name.ilike.%${search}%,customer_email.ilike.%${search}%,customer_phone.ilike.%${search}%,tracking_number.ilike.%${search}%`
    )
  }

  query = query.range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

  const { data, count, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({
    orders: data ?? [],
    total: count ?? 0,
    page,
    pageSize: PAGE_SIZE,
    totalPages: Math.ceil((count ?? 0) / PAGE_SIZE),
  })
}
