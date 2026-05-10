import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/requireAdmin'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const guard = await requireAdmin()
  if (guard instanceof NextResponse) return guard

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = createAdminSupabaseClient() as any
  const { searchParams } = new URL(req.url)
  const days = Math.min(Math.max(Number(searchParams.get('days') || '30'), 7), 365)

  const since = new Date()
  since.setDate(since.getDate() - days)

  try {
    const { data, error } = await sb
      .from('orders')
      .select('created_at, total_amount')
      .eq('payment_status', 'paid')
      .gte('created_at', since.toISOString())
      .order('created_at', { ascending: true })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Aggregate by day
    const dailyMap: Record<string, { label: string; orders: number; revenue: number }> = {}

    for (const o of (data ?? [])) {
      const d = new Date(o.created_at)
      const key = d.toISOString().slice(0, 10) // YYYY-MM-DD
      const label = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) // '01 May'
      if (!dailyMap[key]) dailyMap[key] = { label, orders: 0, revenue: 0 }
      dailyMap[key].orders++
      dailyMap[key].revenue += Number(o.total_amount ?? 0)
    }

    const sorted = Object.keys(dailyMap).sort()
    const labels  = sorted.map(k => dailyMap[k].label)
    const orders  = sorted.map(k => dailyMap[k].orders)
    const revenue = sorted.map(k => Math.round(dailyMap[k].revenue * 100) / 100)

    return NextResponse.json({ labels, orders, revenue })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    console.error('[analytics/sales-chart]', msg)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
