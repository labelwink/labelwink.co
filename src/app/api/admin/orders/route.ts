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
      `id, 
       order_number,
       status, 
       total:total_amount, 
       customer_name, 
       customer_email, 
       customer_phone,
       shipping_name,
       shipping_phone,
       payment_status, 
       fulfillment_status, 
       created_at,
       invoice_number, 
       coupon_code,
       order_items:items,
       tracking_number:shiprocket_awb_code,
       shipping_carrier:shiprocket_courier_name,
       profiles(email, full_name),
       invoices:gst_invoices(invoice_number)`,
      { count: 'exact' }
    )
    .order('created_at', { ascending: false })

  if (status) query = query.eq('status', status)
  if (search) {
    // Note: We use .or() with ilike. 
    // We avoid id.ilike if search is not a valid UUID segment to prevent 500 errors in some environments,
    // or we just rely on PostgREST's cast if supported. 
    // Here we include the new customer fields in search.
    query = query.or(
      `customer_name.ilike.%${search}%,customer_email.ilike.%${search}%,customer_phone.ilike.%${search}%,shipping_name.ilike.%${search}%,invoice_number.ilike.%${search}%,id.ilike.%${search}%,order_number.ilike.%${search}%`
    )
  }
  if (from) query = query.gte('created_at', from)
  if (to) query = query.lte('created_at', to)

  query = query.range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

  const { data, count, error } = await query
  
  if (error) {
    console.error("[admin-orders] API Error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    orders: data ?? [],
    total: count ?? 0,
    page,
    pageSize: PAGE_SIZE,
    totalPages: Math.ceil((count ?? 0) / PAGE_SIZE),
  })
}
