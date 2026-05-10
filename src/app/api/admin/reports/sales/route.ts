import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/requireAdmin'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'

type Period = 'month' | 'quarter' | 'year'
 
type RevenueCategory = { name: string; units: number; revenue: number; [key: string]: any }
type TopProduct = { name: string; units_sold: number; revenue: number; [key: string]: any }
type CouponPerformance = { coupon_code: string; uses: number; total_discount: number; [key: string]: any }

function getStartDate(period: Period): string {
  const now = new Date()
  const days: Record<Period, number> = { month: 30, quarter: 90, year: 365 }
  now.setDate(now.getDate() - days[period])
  return now.toISOString()
}

export async function GET(req: NextRequest) {
  const guard = await requireAdmin()
  if (guard instanceof NextResponse) return guard

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = createAdminSupabaseClient() as any
  const sp = new URL(req.url).searchParams
  const period = (sp.get('period') ?? 'month') as Period
  const format = sp.get('format') ?? 'json'
  const start = getStartDate(period)

  try {
    const [
      orderItemsResult,
      ordersResult,
      returnsResult,
    ] = await Promise.all([
      // 1. Order items for revenue by collection
      sb.from('order_items').select(`
        total_price, product_name,
        orders!inner(payment_status, created_at)
      `)
      .eq('orders.payment_status', 'paid')
      .gte('orders.created_at', start),

      // 2. Orders for DOW, AOV, Cancellations, Coupons
      sb.from('orders').select(`
        id, total_amount, status, payment_status, created_at, coupon_code, discount_amount
      `)
      .gte('created_at', start),

      // 3. Returns
      sb.from('returns').select('refund_amount').gte('created_at', start)
    ])

    // --- 1. Revenue by product (top products from order_items) ---
    const productMap: Record<string, { name: string, units: number, revenue: number }> = {}
    for (const oi of (orderItemsResult.data || [])) {
      const name = oi.product_name || 'Unknown'
      if (!productMap[name]) productMap[name] = { name, units: 0, revenue: 0 }
      productMap[name].units++
      productMap[name].revenue += Number(oi.total_price || 0)
    }
    const top_products = Object.values(productMap)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 20)
      .map(p => ({ name: p.name, units_sold: p.units, revenue: p.revenue }))

    const revenue_by_collection = top_products // reuse for now

    // --- 3. Orders aggregations ---
    const dowMap: Record<number, number> = { 0:0, 1:0, 2:0, 3:0, 4:0, 5:0, 6:0 }
    const weekMap: Record<string, { count: number, total: number }> = {}
    const couponMap: Record<string, { uses: number, total_discount: number }> = {}
    let cancelled_count = 0, cancelled_value = 0

    for (const o of (ordersResult.data || [])) {
      if (o.status === 'cancelled') {
        cancelled_count++
        cancelled_value += Number(o.total_amount || 0)
      }
      
      if (o.payment_status === 'paid') {
        const d = new Date(o.created_at)
        dowMap[d.getDay()]++

        // Start of week (Sunday)
        const diff = d.getDate() - d.getDay()
        const weekStart = new Date(d.setDate(diff)).toISOString().split('T')[0]
        if (!weekMap[weekStart]) weekMap[weekStart] = { count: 0, total: 0 }
        weekMap[weekStart].count++
        weekMap[weekStart].total += Number(o.total_amount || 0)

        if (o.coupon_code) {
          if (!couponMap[o.coupon_code]) couponMap[o.coupon_code] = { uses: 0, total_discount: 0 }
          couponMap[o.coupon_code].uses++
          couponMap[o.coupon_code].total_discount += Number(o.discount_amount || 0)
        }
      }
    }

    const orders_by_dow = Object.entries(dowMap).map(([dow, count]) => ({ dow: Number(dow), count }))
    const aov_trend = Object.entries(weekMap).map(([week, v]) => ({
      week, aov: v.total / v.count
    })).sort((a, b) => a.week.localeCompare(b.week))

    const coupon_performance: CouponPerformance[] = Object.entries(couponMap).map(([code, v]) => ({
      coupon_code: code, ...v
    })).sort((a, b) => b.uses - a.uses)

    // --- 4. Returns ---
    const return_count = (returnsResult.data || []).length
    const return_value = (returnsResult.data || []).reduce((s: number, r: any) => s + Number(r.refund_amount || 0), 0)

    const data = {
      period,
      revenue_by_collection,
      top_products,
      orders_by_dow,
      aov_trend,
      returns_cancellations: { cancelled_count, cancelled_value, return_count, return_value },
      coupon_performance
    }

    if (format === 'csv') {
      let csv = `Sales Report - ${period.toUpperCase()}\n\n`
      
      csv += `REVENUE BY CATEGORY\nCategory,Units,Revenue (Rs)\n`
      revenue_by_collection.forEach((c: any) => csv += `"${c.name}",${c.units},${c.revenue.toFixed(2)}\n`)
      
      csv += `\nTOP PRODUCTS\nProduct,Units Sold,Revenue (Rs)\n`
      top_products.forEach((p: TopProduct) => csv += `"${p.name}",${p.units_sold},${p.revenue.toFixed(2)}\n`)
      
      csv += `\nCOUPONS\nCode,Uses,Total Discount (Rs)\n`
      coupon_performance.forEach((c: CouponPerformance) => csv += `"${c.coupon_code}",${c.uses},${c.total_discount.toFixed(2)}\n`)

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="sales-report-${period}.csv"`
        }
      })
    }

    return NextResponse.json(data)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    console.error('[reports/sales]', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
