import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createAdminSupabaseClient() as any
  const { searchParams } = new URL(req.url)
  const days = Number(searchParams.get('days') ?? '30')

  const now        = new Date()
  const rangeStart = new Date(now.getTime() - days * 86_400_000).toISOString()
  const prevStart  = new Date(now.getTime() - days * 2 * 86_400_000).toISOString()

  const [
    { data: allTimePaid },
    { data: periodOrders },
    { data: orderItems },
    { count: customerCount },
    { data: prevOrders },
    { data: profiles },
  ] = await Promise.all([
    // All-time paid revenue (for total revenue KPI)
    supabase.from('orders').select('total').eq('payment_status', 'paid'),
    // Period orders (for chart + breakdown)
    supabase.from('orders').select('id, status, created_at, total, payment_status').gte('created_at', rangeStart),
    // Top products in period
    supabase.from('order_items')
      .select('product_name, quantity, price_at_purchase')
      .gte('created_at', rangeStart)
      .order('quantity', { ascending: false })
      .limit(5),
    // Total customer count
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    // Previous period paid orders (for growth comparison)
    supabase.from('orders')
      .select('total')
      .eq('payment_status', 'paid')
      .gte('created_at', prevStart)
      .lt('created_at', rangeStart),
    // Wink points liability: sum of all users' wink_points balance
    supabase.from('profiles').select('wink_points'),
  ])

  // KPIs
  const totalRevenue  = (allTimePaid ?? []).reduce((s: number, o: { total: string | number }) => s + Number(o.total), 0)
  const totalOrders   = (periodOrders ?? []).length
  const paidInPeriod  = (periodOrders ?? []).filter((o: { payment_status: string }) => o.payment_status === 'paid')
  const avgOrderValue = paidInPeriod.length > 0
    ? paidInPeriod.reduce((s: number, o: { total: string | number }) => s + Number(o.total), 0) / paidInPeriod.length
    : 0

  const periodRevenue = paidInPeriod.reduce((s: number, o: { total: string | number }) => s + Number(o.total), 0)
  const prevRevenue   = (prevOrders ?? []).reduce((s: number, o: { total: string | number }) => s + Number(o.total), 0)
  const revenueGrowth = prevRevenue > 0 ? ((periodRevenue - prevRevenue) / prevRevenue) * 100 : null

  // Wink Points liability (1 point = ₹1)
  const winkPointsLiability = (profiles ?? []).reduce(
    (s: number, p: { wink_points: number | null }) => s + (p.wink_points ?? 0),
    0
  )

  // Order status breakdown
  const statusBreakdown: Record<string, number> = {}
  for (const o of (periodOrders ?? [])) {
    statusBreakdown[o.status] = (statusBreakdown[o.status] ?? 0) + 1
  }

  // Daily chart data
  const chartData = Array.from({ length: days }, (_, i) => {
    const d = new Date(now.getTime() - (days - 1 - i) * 86_400_000).toISOString().split('T')[0]
    const dayOrders = (periodOrders ?? []).filter((o: { created_at: string }) => o.created_at?.startsWith(d))
    return {
      date:    d,
      label:   new Date(d).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
      revenue: dayOrders.filter((o: { payment_status: string }) => o.payment_status === 'paid')
                        .reduce((s: number, o: { total: string | number }) => s + Number(o.total), 0),
      orders:  dayOrders.length,
    }
  })

  return NextResponse.json({
    kpis: {
      totalRevenue,
      totalOrders,
      avgOrderValue,
      customerCount: customerCount ?? 0,
      revenueGrowth,
      winkPointsLiability,
    },
    chartData,
    statusBreakdown,
    topProducts: orderItems ?? [],
    days,
  })
}

