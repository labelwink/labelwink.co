import { createAdminClient } from '@/lib/supabase/server'
import AnalyticsClient from './AnalyticsClient'

export default async function AnalyticsPage() {
  const supabase = createAdminClient()
  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()

  const [
    { data: revenueOrders },
    { data: allOrders },
    { data: topProducts },
    { count: customerCount },
  ] = await Promise.all([
    supabase.from('orders').select('total, created_at').eq('payment_status', 'paid'),
    supabase.from('orders').select('status, created_at, total'),
    supabase.from('order_items')
      .select('product_name, quantity, price_at_purchase')
      .gte('created_at', thirtyDaysAgo)
      .order('quantity', { ascending: false })
      .limit(5),
    supabase.from('users').select('id', { count: 'exact', head: true }).eq('role', 'customer'),
  ])

  const totalRevenue = revenueOrders?.reduce((s, o) => s + Number(o.total), 0) ?? 0
  const totalOrders = allOrders?.length ?? 0
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

  // Last 7 days chart data
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now.getTime() - (6 - i) * 86400000)
    return d.toISOString().split('T')[0]
  })

  const chartData = last7Days.map(date => ({
    date: new Date(date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
    revenue: revenueOrders?.filter(o => o.created_at?.startsWith(date))
      .reduce((s, o) => s + Number(o.total), 0) ?? 0,
    orders: allOrders?.filter(o => o.created_at?.startsWith(date)).length ?? 0,
  }))

  return (
    <AnalyticsClient
      totalRevenue={totalRevenue}
      totalOrders={totalOrders}
      avgOrderValue={avgOrderValue}
      customerCount={customerCount ?? 0}
      chartData={chartData}
      topProducts={topProducts ?? []}
    />
  )
}
