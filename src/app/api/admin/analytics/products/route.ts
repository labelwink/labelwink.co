import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/requireAdmin'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'

type Period = 'week' | 'month' | 'year'

function getStartDate(period: Period): string {
  const now = new Date()
  const days: Record<Period, number> = { week: 7, month: 30, year: 365 }
  now.setDate(now.getDate() - days[period])
  return now.toISOString()
}

export async function GET(req: NextRequest) {
  const guard = await requireAdmin()
  if (guard instanceof NextResponse) return guard

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = createAdminSupabaseClient() as any
  const sp     = new URL(req.url).searchParams
  const period = (sp.get('period') ?? 'month') as Period
  const limit  = Math.min(Math.max(parseInt(sp.get('limit') ?? '10', 10), 1), 50)
  const start  = getStartDate(period)

  try {
    const [
      bestsellersResult,
      topRevenueResult,
      mostViewedResult,
      neverSoldResult,
      topSearchResult,
    ] = await Promise.all([

      // 1. Best selling by units
      sb.from('product_sales_summary')
        .select(`
          units_sold, revenue, last_sold_at,
          products ( id, name, slug, images )
        `)
        .order('units_sold', { ascending: false })
        .limit(limit),

      // 2. Top revenue products
      sb.from('product_sales_summary')
        .select(`
          units_sold, revenue, last_sold_at,
          products ( id, name, slug, images )
        `)
        .order('revenue', { ascending: false })
        .limit(limit),

      // 3. Most viewed products in period
      sb.rpc('get_top_viewed_products', { since: start, row_limit: limit }),

      // 4. Products never sold (no entry in product_sales_summary)
      sb.from('products')
        .select('id, name, slug, created_at')
        .eq('is_active', true)
        .not('id', 'in',
          // Sub-select product_ids that exist in summary
          sb.from('product_sales_summary').select('product_id')
        )
        .order('created_at', { ascending: false })
        .limit(10),

      // 5. Top search queries in period
      (() => {
        return sb.from('search_logs')
          .select('query, results_count')
          .gte('searched_at', start)
      })(),
    ])

    // ── Aggregate most-viewed in JS (fallback if rpc not available) ───────────
    let mostViewed: object[] = []
    if (mostViewedResult.error) {
      // Fallback: group product_views client-side
      const { data: views } = await sb
        .from('product_views')
        .select('product_id, products ( id, name, images )')
        .gte('viewed_at', start)
      const viewMap: Record<string, { product_id: string; views: number; product: unknown }> = {}
      for (const v of (views ?? [])) {
        if (!viewMap[v.product_id]) {
          viewMap[v.product_id] = { product_id: v.product_id, views: 0, product: v.products }
        }
        viewMap[v.product_id].views++
      }
      mostViewed = Object.values(viewMap)
        .sort((a, b) => b.views - a.views)
        .slice(0, limit)
    } else {
      mostViewed = mostViewedResult.data ?? []
    }

    // ── Aggregate search queries client-side (no GROUP BY in Supabase JS SDK) ──
    const queryMap: Record<string, { query: string; count: number; total_results: number }> = {}
    for (const row of (topSearchResult.data ?? [])) {
      if (!queryMap[row.query]) queryMap[row.query] = { query: row.query, count: 0, total_results: 0 }
      queryMap[row.query].count++
      queryMap[row.query].total_results += Number(row.results_count ?? 0)
    }
    const top_searches = Object.values(queryMap)
      .map(q => ({ ...q, avg_results: q.total_results / q.count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit)

    // ── Shape bestsellers / top_revenue ───────────────────────────────────────
    const shapeSummary = (rows: unknown[]) =>
      (rows ?? []).map((r: unknown) => {
        const row = r as {
          units_sold: number; revenue: number; last_sold_at: string;
          products: { id: string; name: string; slug: string; images: unknown }
        }
        return {
          ...(row.products ?? {}),
          units_sold:   row.units_sold,
          revenue:      row.revenue,
          last_sold_at: row.last_sold_at,
        }
      })

    return NextResponse.json({
      period,
      bestsellers:  shapeSummary(bestsellersResult.data ?? []),
      top_revenue:  shapeSummary(topRevenueResult.data ?? []),
      most_viewed:  mostViewed,
      never_sold:   neverSoldResult.data ?? [],
      top_searches,
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    console.error('[analytics/products]', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
