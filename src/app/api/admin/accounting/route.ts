import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/requireAdmin'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const guard = await requireAdmin()
  if (guard instanceof NextResponse) return guard

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = createAdminSupabaseClient() as any
  const sp = new URL(req.url).searchParams
  const startDate  = sp.get('startDate') || ''
  const endDate    = sp.get('endDate')   || ''
  const typeFilter = sp.get('type')      || 'all'
  const page       = Math.max(1, Number(sp.get('page') || '1'))
  const PAGE_SIZE  = 25

  try {
    // Build order revenue query
    let orderQ = sb.from('orders')
      .select('id, order_number, total_amount, created_at', { count: 'exact' })
      .eq('status', 'delivered')
    if (startDate) orderQ = orderQ.gte('created_at', startDate)
    if (endDate)   orderQ = orderQ.lte('created_at', endDate + 'T23:59:59')

    // Build refunds query
    let refundQ = sb.from('returns')
      .select('id, refund_amount, created_at, orders(order_number)', { count: 'exact' })
      .eq('status', 'refunded')
    if (startDate) refundQ = refundQ.gte('created_at', startDate)
    if (endDate)   refundQ = refundQ.lte('created_at', endDate + 'T23:59:59')

    const [{ data: orders }, { data: refunds }] = await Promise.all([orderQ, refundQ])

    const totalRevenue = (orders ?? []).reduce((s: number, o: any) => s + Number(o.total_amount || 0), 0)
    const totalRefunds = (refunds ?? []).reduce((s: number, r: any) => s + Number(r.refund_amount || 0), 0)
    // Approximate GST at 12% (CGST 6% + SGST 6%)
    const gstCollected = Math.round(totalRevenue * 0.12 / 1.12)
    const netRevenue   = totalRevenue - totalRefunds

    // Build ledger entries
    const allEntries: any[] = [
      ...(orders ?? []).map((o: any) => ({
        id:          o.id,
        date:        o.created_at,
        type:        'revenue',
        reference:   o.order_number || `ORD-${o.id.slice(0, 8).toUpperCase()}`,
        description: `Order delivered`,
        amount:      Number(o.total_amount || 0),
      })),
      ...(refunds ?? []).map((r: any) => ({
        id:          r.id,
        date:        r.created_at,
        type:        'refund',
        reference:   r.orders?.order_number || r.id.slice(0, 8).toUpperCase(),
        description: `Refund processed`,
        amount:      Number(r.refund_amount || 0),
      })),
    ]
      .filter(e => typeFilter === 'all' || e.type === typeFilter)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    const total   = allEntries.length
    const entries = allEntries.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

    return NextResponse.json({
      stats: { total_revenue: totalRevenue, total_refunds: totalRefunds, gst_collected: gstCollected, net_revenue: netRevenue },
      entries,
      total,
      page,
      total_pages: Math.ceil(total / PAGE_SIZE),
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    console.error('[accounting/get]', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
