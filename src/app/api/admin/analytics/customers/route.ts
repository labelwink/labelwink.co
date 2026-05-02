import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/requireAdmin'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'

type Period = 'month' | 'year'

function getStartDate(period: Period): string {
  const now = new Date()
  const days: Record<Period, number> = { month: 30, year: 365 }
  now.setDate(now.getDate() - days[period])
  return now.toISOString()
}

export async function GET(req: NextRequest) {
  const guard = await requireAdmin()
  if (guard) return guard

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = createAdminSupabaseClient() as any
  const period = (new URL(req.url).searchParams.get('period') ?? 'month') as Period
  const start  = getStartDate(period)

  try {
    const [
      newProfilesResult,
      allOrdersResult,
      topCustomersResult,
    ] = await Promise.all([

      // 1. New customers in period (for chart)
      sb.from('profiles')
        .select('id, created_at')
        .gte('created_at', start)
        .order('created_at', { ascending: true }),

      // 2. Orders with totals + timestamps (for segment calculations)
      //    Only paid orders — include user_id + created_at
      sb.from('orders')
        .select('user_id, total, created_at')
        .eq('payment_status', 'paid'),

      // 3. Top customers by lifetime value
      sb.from('profiles')
        .select(`
          id, full_name, email, phone,
          orders!inner ( id, total, payment_status )
        `)
        .eq('orders.payment_status', 'paid')
        .order('created_at', { ascending: false })
        .limit(200), // fetch top slice; sort client-side
    ])

    // ── 1. New-customers-over-time chart ──────────────────────────────────────
    const dayBuckets: Record<string, number> = {}
    for (const p of (newProfilesResult.data ?? [])) {
      const day = (p.created_at as string).slice(0, 10)
      dayBuckets[day] = (dayBuckets[day] ?? 0) + 1
    }
    const new_customers_chart = Object.entries(dayBuckets)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date))

    // ── 2. Customer segments ──────────────────────────────────────────────────
    // Group paid orders by user_id
    type OrderRow = { user_id: string; total: number; created_at: string }
    const userOrders: Record<string, OrderRow[]> = {}
    for (const o of ((allOrdersResult.data ?? []) as OrderRow[])) {
      if (!userOrders[o.user_id]) userOrders[o.user_id] = []
      userOrders[o.user_id].push(o)
    }

    const ninetyDaysAgo = new Date()
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

    let highValue = 0, regular = 0, oneTime = 0, inactive = 0

    for (const [, orders] of Object.entries(userOrders)) {
      const lifetime      = orders.reduce((s, o) => s + Number(o.total ?? 0), 0)
      const orderCount    = orders.length
      const lastOrderDate = new Date(orders.reduce((latest, o) =>
        o.created_at > latest ? o.created_at : latest, orders[0].created_at))

      if (lifetime > 5000)        highValue++
      if (orderCount >= 1 && orderCount <= 3) regular++
      if (orderCount === 1)       oneTime++
      if (lastOrderDate < ninetyDaysAgo) inactive++
    }

    // ── 3. Repeat purchase rate ────────────────────────────────────────────────
    const totalWithOrders  = Object.keys(userOrders).length
    const repeatCustomers  = Object.values(userOrders).filter(o => o.length > 1).length
    const repeat_rate      = totalWithOrders > 0
      ? Math.round((repeatCustomers / totalWithOrders) * 1000) / 10  // percentage × 1dp
      : 0

    // ── 4. Top customers by lifetime value ────────────────────────────────────
    type ProfileRow = {
      id: string; full_name: string | null; email: string | null; phone: string | null
      orders: { id: string; total: number }[]
    }
    const top_customers = ((topCustomersResult.data ?? []) as ProfileRow[])
      .map(p => ({
        id:          p.id,
        full_name:   p.full_name,
        email:       p.email,
        phone:       p.phone,
        order_count: (p.orders ?? []).length,
        lifetime:    (p.orders ?? []).reduce((s, o) => s + Number(o.total ?? 0), 0),
      }))
      .sort((a, b) => b.lifetime - a.lifetime)
      .slice(0, 10)

    return NextResponse.json({
      period,
      new_customers_chart,
      segments: {
        high_value:  highValue,   // lifetime > ₹5000
        regular:     regular,     // 1–3 orders
        one_time:    oneTime,     // exactly 1 order
        inactive:    inactive,    // no order in 90 days
      },
      repeat_rate,     // percentage
      top_customers,
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    console.error('[analytics/customers]', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
