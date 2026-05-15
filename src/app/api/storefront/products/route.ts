import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const SIZE_ORDER = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', '2XL', '3XL']

const VALID_SORTS = ['newest', 'price_asc', 'price_desc', 'popular', 'top_rated'] as const
type SortOption = (typeof VALID_SORTS)[number]

const PRODUCT_SELECT = `
  id, name, slug, price, compare_at_price,
  fabric, occasion, tags, created_at, status, is_featured,
  collection_id,
  product_images (url, alt, is_cover, sort_order),
  product_variants (id, size, color, stock_qty, price, compare_at_price, is_active)
`

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)

  // ── Parse params ────────────────────────────────────────────────────────────
  const q = searchParams.get('q')?.trim() ?? ''
  const collection = searchParams.get('collection')?.trim() ?? ''
  const occasion = searchParams.get('occasion')?.trim() ?? ''
  const sizeParam = searchParams.get('size')?.trim() ?? ''
  const colorParam = searchParams.get('color')?.trim() ?? ''
  const minPrice = parseFloat(searchParams.get('min_price') ?? '0') || 0
  const maxPrice = parseFloat(searchParams.get('max_price') ?? '0') || 0
  const fabric = searchParams.get('fabric')?.trim() ?? ''
  const sleeve = searchParams.get('sleeve')?.trim() ?? ''
  const featured = searchParams.get('featured') === 'true'
  const sort: SortOption = (
    VALID_SORTS.includes(searchParams.get('sort') as SortOption)
      ? searchParams.get('sort')
      : 'newest'
  ) as SortOption
  const page = Math.max(parseInt(searchParams.get('page') ?? '1', 10), 1)
  const perPage = Math.min(
    Math.max(parseInt(searchParams.get('per_page') ?? '20', 10), 1),
    48
  )

  const sizes = sizeParam ? sizeParam.split(',').map((s) => s.trim()).filter(Boolean) : []
  const colors = colorParam ? colorParam.split(',').map((c) => c.trim()).filter(Boolean) : []

  const supabase = await createClient()

  // ── Build base query ────────────────────────────────────────────────────────
  const buildQuery = () => {
    let query = supabase
      .from('products')
      .select(PRODUCT_SELECT)
      .neq('status', 'draft')  // exclude draft products

    // Featured filter
    if (featured) {
      query = query.eq('is_featured', true)
    }

    // Full-text search (only when search_vector populated)
    if (q.length >= 2) {
      query = query.textSearch('search_vector', q, { type: 'websearch', config: 'english' })
    }

    // Collection filter: match on tags array
    if (collection) {
      query = query.contains('tags', [collection])
    }

    // Occasion filter — uses occasion column (text) or tags array
    if (occasion) {
      query = query.or(`occasion.ilike.%${occasion}%,tags.cs.{${occasion}}`)
    }

    // Price range
    if (minPrice > 0) query = query.gte('price', minPrice)
    if (maxPrice > 0) query = query.lte('price', maxPrice)

    // Fabric — uses the real 'fabric' column
    if (fabric) query = query.ilike('fabric', `%${fabric}%`)

    // Sleeve type — stored in tags array
    if (sleeve) query = query.contains('tags', [sleeve])

    return query
  }

  // ── Count query ──────────────────────────────────────────────────────────────
  const countQuery = supabase
    .from('products')
    .select('id', { count: 'exact', head: true })

  const [{ data: allProducts, error }, { count, error: countError }] = await Promise.all([
    (() => {
      let q2 = buildQuery()

      // Sort
      switch (sort) {
        case 'price_asc':
          q2 = q2.order('price', { ascending: true })
          break
        case 'price_desc':
          q2 = q2.order('price', { ascending: false })
          break
        case 'top_rated':
        case 'popular':
        case 'newest':
        default:
          q2 = q2.order('created_at', { ascending: false })
      }

      // Pagination
      const from = (page - 1) * perPage
      const to = from + perPage - 1
      return q2.range(from, to)
    })(),
    (() => {
      let cq = countQuery.neq('status', 'draft')
      if (featured) cq = cq.eq('is_featured', true)
      if (q.length >= 2) cq = cq.textSearch('search_vector', q, { type: 'websearch', config: 'english' })
      if (collection) cq = cq.contains('tags', [collection])
      if (occasion) cq = cq.or(`occasion.ilike.%${occasion}%,tags.cs.{${occasion}}`)
      if (minPrice > 0) cq = cq.gte('price', minPrice)
      if (maxPrice > 0) cq = cq.lte('price', maxPrice)
      if (fabric) cq = cq.ilike('fabric', `%${fabric}%`)
      if (sleeve) cq = cq.contains('tags', [sleeve])
      return cq
    })(),
  ])

  if (error) {
    console.error('[products/list] query error:', error)
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
  }

  // ── Post-filter by size/color (in-memory — variants are included) ────────────
  let products = allProducts ?? []

  if (sizes.length > 0) {
    products = products.filter((p) =>
      (p.product_variants as any[])?.some(
        (v) => v.stock_qty > 0 && sizes.includes(v.size)
      )
    )
  }

  if (colors.length > 0) {
    products = products.filter((p) =>
      (p.product_variants as any[])?.some(
        (v) => v.stock_qty > 0 && colors.includes(v.color)
      )
    )
  }

  const total = count ?? 0
  const totalPages = Math.ceil(total / perPage)

  // Sort product_images: cover image first, then by sort_order
  const sortedProducts = products.map((p) => ({
    ...p,
    product_images: [...((p.product_images as any[]) ?? [])].sort((a, b) => {
      if (a.is_cover && !b.is_cover) return -1
      if (!a.is_cover && b.is_cover) return 1
      return (a.sort_order ?? 0) - (b.sort_order ?? 0)
    }),
  }))

  return NextResponse.json(
    {
      products: sortedProducts,
      total,
      page,
      per_page: perPage,
      total_pages: totalPages,
      filters_applied: {
        ...(q && { q }),
        ...(collection && { collection }),
        ...(occasion && { occasion }),
        ...(sizes.length && { size: sizes }),
        ...(colors.length && { color: colors }),
        ...(minPrice && { min_price: minPrice }),
        ...(maxPrice && { max_price: maxPrice }),
        ...(fabric && { fabric }),
        ...(sleeve && { sleeve }),
        sort,
      },
    },
    {
      headers: { 'Cache-Control': 'public, s-maxage=30' },
    }
  )
}
