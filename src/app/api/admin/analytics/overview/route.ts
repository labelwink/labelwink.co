import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/requireAdmin'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'

const LOW_STOCK_THRESHOLD = 5

type Period = 'today' | 'week' | 'month' | 'year' | 'all'

function getDateRange(period: Period): { start: string | null; prevStart: string | null; prevEnd: string | null } {
  const now = new Date()
  const pad = (d: Date) => d.toISOString()

  if (period === 'all') return { start: null, prevStart: null, prevEnd: null }

  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  const offsetDays: Record<Exclude<Period, 'all'>, number> = {
    today: 0,
    week:  7,
    month: 30,
    year:  365,
  }
  const days = offsetDays[period as Exclude<Period, 'all'>]

  const start = new Date(startOfToday)
  if (days > 0) start.setDate(start.getDate() - days)

  const prevEnd   = new Date(start)
  const prevStart = new Date(start)
  prevStart.setDate(prevStart.getDate() - (days || 1))

  return { start: pad(start), prevStart: pad(prevStart), prevEnd: pad(prevEnd) }
}

export async function GET(req: NextRequest) {
  const guard = await requireAdmin()
  if (guard) return guard

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = createAdminSupabaseClient() as any
  const period = (new URL(req.url).searchParams.get('period') ?? 'month') as Period
  const { start, prevStart, prevEnd } = getDateRange(period)

  try {
    const [
      revenueResult,
      statusResult,
      newCustomersResult,
      totalCustomersResult,
      pendingResult,
      prevRevenueResult,
      dailyChartResult,
      lowStockResult,
      outOfStockResult,
    ] = await Promise.all([

      // 1. Revenue stats — current period
      (() => {
        let q = sb.from('orders')
          .select('total, discount_amount, shipping_amount')
          .eq('payment_status', 'paid')
        if (start) q = q.gte('created_at', start)
        return q
      })(),

      // 2. Orders by status (all time for inventory awareness)
      sb.from('orders').select('status'),

      // 3. New customers in period
      (() => {
        let q = sb.from('profiles').select('id', { count: 'exact', head: true })
        if (start) q = q.gte('created_at', start)
        return q
      })(),

      // 4. Total customers
      sb.from('profiles').select('id', { count: 'exact', head: true }),

      // 5. Pending orders
      sb.from('orders').select('id', { count: 'exact', head: true }).eq('status', 'pending'),

      // 6. Revenue for previous period (for growth %)
      (() => {
        if (!prevStart || !prevEnd) return Promise.resolve({ data: [] })
        return sb.from('orders')
          .select('total')
          .eq('payment_status', 'paid')
          .gte('created_at', prevStart)
          .lt('created_at', prevEnd)
      })(),

      // 7. Daily chart data
      (() => {
        let q = sb.from('daily_revenue').select('date, revenue, order_count').order('date', { ascending: true })
        if (start) q = q.gte('date', start.slice(0, 10)) // date-only
        return q
      })(),

      // 8. Low stock (> 0 but <= threshold)
      sb.from('product_variants')
        .select('id', { count: 'exact', head: true })
        .lte('stock_qty', LOW_STOCK_THRESHOLD)
        .gt('stock_qty', 0),

      // 9. Out of stock
      sb.from('product_variants')
        .select('id', { count: 'exact', head: true })
        .eq('stock_qty', 0),
    ])

    // ── Aggregate revenue stats ────────────────────────────────────────────────
    const paidOrders: { total: number; discount_amount: number; shipping_amount: number }[] =
      revenueResult.data ?? []
    const order_count      = paidOrders.length
    const revenue          = paidOrders.reduce((s, o) => s + Number(o.total ?? 0), 0)
    const total_discounts  = paidOrders.reduce((s, o) => s + Number(o.discount_amount ?? 0), 0)
    const total_shipping   = paidOrders.reduce((s, o) => s + Number(o.shipping_amount ?? 0), 0)
    const avg_order_value  = order_count ? revenue / order_count : 0

    // ── Orders by status ───────────────────────────────────────────────────────
    const statusMap: Record<string, number> = {}
    for (const o of (statusResult.data ?? [])) {
      statusMap[o.status] = (statusMap[o.status] ?? 0) + 1
    }

    // ── Growth % ───────────────────────────────────────────────────────────────
    const prevRevenue = ((prevRevenueResult as any).data ?? [])
      .reduce((s: number, o: { total: number }) => s + Number(o.total ?? 0), 0)
    const revenue_growth_pct = prevRevenue > 0
      ? Math.round(((revenue - prevRevenue) / prevRevenue) * 100 * 10) / 10
      : null

    return NextResponse.json({
      period,
      revenue:           Math.round(revenue * 100) / 100,
      order_count,
      avg_order_value:   Math.round(avg_order_value * 100) / 100,
      total_discounts:   Math.round(total_discounts * 100) / 100,
      total_shipping:    Math.round(total_shipping * 100) / 100,
      orders_by_status:  statusMap,
      new_customers:     newCustomersResult.count ?? 0,
      total_customers:   totalCustomersResult.count ?? 0,
      pending_orders:    pendingResult.count ?? 0,
      revenue_growth_pct,
      daily_chart:       dailyChartResult.data ?? [],
      low_stock_count:   lowStockResult.count ?? 0,
      out_of_stock_count: outOfStockResult.count ?? 0,
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    console.error('[analytics/overview]', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
