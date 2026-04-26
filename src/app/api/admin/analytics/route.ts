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

  const [
    { data: revenueOrders },
    { data: allOrders },
    { data: orderItems },
    { count: customerCount },
    { data: prevOrders },
  ] = await Promise.all([
    // Revenue orders (all time for totals)
    supabase.from('orders').select('total, created_at, status').eq('payment_status', 'paid'),
    // All orders in range for chart
    supabase.from('orders').select('id, status, created_at, total').gte('created_at', rangeStart),
    // Top products last N days
    supabase.from('order_items')
      .select('product_name, quantity, price_at_purchase')
      .gte('created_at', rangeStart)
      .order('quantity', { ascending: false })
      .limit(5),
    // Customer count
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    // Previous period for comparison
    supabase.from('orders')
      .select('total')
      .eq('payment_status', 'paid')
      .gte('created_at', new Date(now.getTime() - days * 2 * 86_400_000).toISOString())
      .lt('created_at', rangeStart),
  ])

  // KPIs
  const totalRevenue = (revenueOrders ?? []).reduce((s: number, o: { total: string | number }) => s + Number(o.total), 0)
  const totalOrders  = (allOrders ?? []).length
  const avgOrderValue = totalOrders > 0
    ? (allOrders ?? []).reduce((s: number, o: { total: string | number }) => s + Number(o.total), 0) / totalOrders
    : 0

  // Revenue in current period
  const periodRevenue = (allOrders ?? [])
    .filter((o: { payment_status?: string }) => o.payment_status !== undefined ? true : true) // all orders
    .reduce((s: number, o: { total: string | number }) => s + Number(o.total), 0)

  const prevRevenue = (prevOrders ?? []).reduce((s: number, o: { total: string | number }) => s + Number(o.total), 0)
  const revenueGrowth = prevRevenue > 0 ? ((periodRevenue - prevRevenue) / prevRevenue) * 100 : null

  // Order status breakdown
  const statusBreakdown: Record<string, number> = {}
  for (const o of (allOrders ?? [])) {
    statusBreakdown[o.status] = (statusBreakdown[o.status] ?? 0) + 1
  }

  // Daily chart data
  const chartData = Array.from({ length: days <= 7 ? days : days <= 30 ? 30 : 30 }, (_, i) => {
    const d = new Date(now.getTime() - (days - 1 - i) * 86_400_000).toISOString().split('T')[0]
    const dayOrders = (allOrders ?? []).filter((o: { created_at: string }) => o.created_at?.startsWith(d))
    return {
      date: d,
      label: new Date(d).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
      revenue: dayOrders.reduce((s: number, o: { total: string | number }) => s + Number(o.total), 0),
      orders: dayOrders.length,
    }
  })

  return NextResponse.json({
    kpis: {
      totalRevenue,
      totalOrders,
      avgOrderValue,
      customerCount: customerCount ?? 0,
      revenueGrowth,
    },
    chartData,
    statusBreakdown,
    topProducts: orderItems ?? [],
    days,
  })
}
