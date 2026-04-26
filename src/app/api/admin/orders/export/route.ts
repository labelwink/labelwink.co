import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'

interface ExportOrderItem {
  product_name: string | null
  quantity: number
  price_at_purchase: number
  variant_size: string | null
}

interface ExportOrder {
  id: string
  status: string
  total: number
  subtotal: number
  discount_amount: number
  shipping_amount: number
  customer_name: string | null
  customer_email: string | null
  customer_phone: string | null
  payment_status: string | null
  payment_method: string | null
  razorpay_payment_id: string | null
  coupon_code: string | null
  tracking_number: string | null
  shipping_carrier: string | null
  created_at: string
  order_items: ExportOrderItem[] | null
}

/**
 * GET /api/admin/orders/export
 * Returns a CSV of all orders matching optional ?status=&search= filters.
 * No pagination — exports all matching rows (max 10 000).
 */
export async function GET(req: NextRequest) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createAdminSupabaseClient() as any
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status') || ''
  const search = searchParams.get('search') || ''

  let query = supabase
    .from('orders')
    .select(
      `id, status, total, subtotal, discount_amount, shipping_amount,
       customer_name, customer_email, customer_phone,
       payment_status, payment_method, razorpay_payment_id,
       coupon_code, tracking_number, shipping_carrier,
       created_at,
       order_items ( product_name, quantity, price_at_purchase, variant_size )`
    )
    .order('created_at', { ascending: false })
    .limit(10_000)

  if (status) query = query.eq('status', status)
  if (search) {
    query = query.or(
      `customer_name.ilike.%${search}%,customer_email.ilike.%${search}%,tracking_number.ilike.%${search}%`
    )
  }

  const { data, error } = await query as { data: ExportOrder[] | null; error: { message: string } | null }
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // ── Build CSV ─────────────────────────────────────────────────────────────
  const esc = (v: unknown): string => {
    const s = v === null || v === undefined ? '' : String(v)
    return s.includes(',') || s.includes('"') || s.includes('\n')
      ? `"${s.replace(/"/g, '""')}"`
      : s
  }

  const HEADERS = [
    'Order ID', 'Date', 'Status', 'Payment Status',
    'Customer Name', 'Customer Email', 'Customer Phone',
    'Items', 'Subtotal', 'Discount', 'Shipping', 'Total',
    'Coupon Code', 'Payment Method', 'Razorpay ID',
    'Carrier', 'Tracking #',
  ]

  const rows = (data ?? []).map((o: ExportOrder) => {
    const items = o.order_items ?? []
    const itemSummary = items.map(i =>
      `${i.product_name || '—'} (${i.variant_size || '—'}) x${i.quantity}`
    ).join(' | ')

    return [
      o.id,
      new Date(o.created_at).toLocaleDateString('en-IN'),
      o.status,
      o.payment_status,
      o.customer_name,
      o.customer_email,
      o.customer_phone,
      itemSummary,
      o.subtotal,
      o.discount_amount,
      o.shipping_amount,
      o.total,
      o.coupon_code,
      o.payment_method,
      o.razorpay_payment_id,
      o.shipping_carrier,
      o.tracking_number,
    ].map(esc).join(',')
  })

  const csv = [HEADERS.join(','), ...rows].join('\n')
  const filename = `labelwink-orders-${new Date().toISOString().slice(0, 10)}.csv`

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
