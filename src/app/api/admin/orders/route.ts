import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/requireAdmin'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const guard = await requireAdmin()
  if (guard instanceof NextResponse) return guard
  const supabase = createAdminSupabaseClient()
  const { searchParams } = new URL(req.url)

  const status  = searchParams.get('status') || ''
  const search  = searchParams.get('search') || ''
  const page    = Math.max(0, Number(searchParams.get('page') || '0'))
  const from    = searchParams.get('from') || ''
  const to      = searchParams.get('to') || ''
  const PAGE_SIZE = 25

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (supabase as any)
    .from('orders')
    .select(
      `id, shipping_name, shipping_phone, total_amount, status,
       payment_status, fulfillment_status, created_at,
       invoice_number, coupon_code,
       profiles(email, full_name)`,
      { count: 'exact' }
    )
    .order('created_at', { ascending: false })

  if (status) query = query.eq('status', status)
  if (search) {
    query = query.or(
      `shipping_name.ilike.%${search}%,shipping_phone.ilike.%${search}%,invoice_number.ilike.%${search}%,id.ilike.%${search}%`
    )
  }
  if (from) query = query.gte('created_at', from)
  if (to) query = query.lte('created_at', to)

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
