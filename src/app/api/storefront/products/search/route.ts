import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const PRODUCT_SELECT =
  'id, name, slug, price, mrp, compare_at_price, images, fabric_material, sleeve_type, occasion_tags'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q')?.trim() ?? ''
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '10', 10), 48)
  const offset = Math.max(parseInt(searchParams.get('offset') ?? '0', 10), 0)

  if (q.length < 2) {
    return NextResponse.json(
      { error: 'Query must be at least 2 characters', products: [], total: 0, query: q },
      { status: 400 }
    )
  }

  const supabase = await createClient()

  // Run full-text search and ILIKE in parallel
  const [ftResult, ilikeResult] = await Promise.all([
    supabase
      .from('products')
      .select(PRODUCT_SELECT)
      .eq('is_active', true)
      .textSearch('search_vector', q, { type: 'websearch', config: 'english' })
      .limit(limit + offset),

    supabase
      .from('products')
      .select(PRODUCT_SELECT)
      .eq('is_active', true)
      .ilike('name', `%${q}%`)
      .limit(limit + offset),
  ])

  if (ftResult.error && ilikeResult.error) {
    console.error('[search] ft error:', ftResult.error)
    console.error('[search] ilike error:', ilikeResult.error)
    return NextResponse.json(
      { error: 'Search failed', products: [], total: 0, query: q },
      { status: 500 }
    )
  }

  // Merge: full-text results first, then ILIKE additions (deduplicate by id)
  const ftProducts = ftResult.data ?? []
  const ilikeProducts = ilikeResult.data ?? []
  const seenIds = new Set(ftProducts.map((p) => p.id))
  const merged = [
    ...ftProducts,
    ...ilikeProducts.filter((p) => !seenIds.has(p.id)),
  ]

  // Apply offset + limit after merge
  const paginated = merged.slice(offset, offset + limit)
  const total = merged.length

  // Fire-and-forget: log search async
  createClient().then((sb) => {
    sb.from('search_logs')
      .insert({ query: q, results_count: total })
      .then(({ error }) => {
        if (error) console.warn('[search_log] insert failed:', error.message)
      })
  })

  return NextResponse.json(
    { products: paginated, total, query: q },
    {
      headers: { 'Cache-Control': 'public, s-maxage=30' },
    }
  )
}
