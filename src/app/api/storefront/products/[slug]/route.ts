import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const PRODUCT_SELECT = `
  id, name, slug, price, compare_at_price,
  description,
  fabric, occasion,
  tags, season,
  hsn_code, weight,
  meta_title, meta_description,
  status, is_active, created_at, updated_at,
  collection_id,
  size_chart_data,
  product_images (url, alt, is_cover, sort_order),
  product_variants (
    id, size, color, stock_qty, price, sku, image_url,
    is_active, low_stock_threshold
  )
`

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const sessionId = req.headers.get('x-session-id') ?? null

  const supabase = await createClient()

  // ── 1. Fetch product ────────────────────────────────────────────────────────
  const { data: product, error } = await supabase
    .from('products')
    .select(PRODUCT_SELECT)
    .eq('slug', slug)
    .eq('is_active', true)
    .single()

  if (error || !product) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 })
  }

  // ── 2. Fetch approved reviews (with profile) ────────────────────────────────
  const { data: reviewsRaw } = await supabase
    .from('reviews')
    .select(
      `id, rating, review_text, photos, is_verified_purchase,
       admin_reply, admin_replied_at, helpful_count, created_at,
       profiles (id, full_name, avatar_url)`
    )
    .eq('product_id', product.id)
    .eq('status', 'approved')
    .order('helpful_count', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(10)

  // Map database review_text to title/body for storefront component compatibility
  const reviews = (reviewsRaw ?? []).map((r: any) => {
    let t = 'Review'
    let b = r.review_text || ''
    if (r.review_text && r.review_text.includes(' - ')) {
      const parts = r.review_text.split(' - ')
      t = parts[0]
      b = parts.slice(1).join(' - ')
    } else if (r.review_text) {
      t = r.review_text.slice(0, 50)
    }
    return {
      ...r,
      comment: r.review_text,
      title: t,
      body: b,
    }
  })

  // ── 3. Reviews summary ──────────────────────────────────────────────────────
  const { data: allRatings } = await supabase
    .from('reviews')
    .select('rating')
    .eq('product_id', product.id)
    .eq('status', 'approved')

  const ratings = (allRatings ?? []).map((r) => r.rating)
  const total_count = ratings.length
  const avg_rating =
    total_count > 0
      ? Math.round((ratings.reduce((sum, r) => sum + r, 0) / total_count) * 10) / 10
      : 0
  const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } as Record<number, number>
  ratings.forEach((r) => {
    if (r >= 1 && r <= 5) distribution[r]++
  })

  const reviews_summary = { avg_rating, total_count, distribution }

  // ── 4. Related products (same category, different slug, LIMIT 4) ───────────
  let related_products: unknown[] = []
  if (product.collection_id) {
    const { data: related } = await supabase
      .from('products')
      .select('id, name, slug, price, compare_at_price, product_images(url, alt, is_cover, sort_order)')
      .eq('is_active', true)
      .eq('collection_id', product.collection_id)
      .neq('id', product.id)
      .order('created_at', { ascending: false })
      .limit(4)
    related_products = related ?? []
  }

  // ── 5. Fire-and-forget: log product view ───────────────────────────────────
  createClient().then((sb) => {
    sb.from('product_views')
      .insert({ product_id: product.id, session_id: sessionId })
      .then(({ error: viewErr }) => {
        if (viewErr) console.warn('[product_view] insert failed:', viewErr.message)
      })
  })

  return NextResponse.json(
    {
      product: {
        ...product,
        reviews,
        reviews_summary,
        related_products,
      },
    },
    {
      headers: { 'Cache-Control': 'public, s-maxage=30' },
    }
  )
}
