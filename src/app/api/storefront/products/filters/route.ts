import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Canonical size order for sorting
const SIZE_ORDER = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', '2XL', '3XL']

function sortSizes(sizes: string[]): string[] {
  return sizes.sort((a, b) => {
    const ai = SIZE_ORDER.indexOf(a.toUpperCase())
    const bi = SIZE_ORDER.indexOf(b.toUpperCase())
    if (ai === -1 && bi === -1) return a.localeCompare(b)
    if (ai === -1) return 1
    if (bi === -1) return -1
    return ai - bi
  })
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const collection = searchParams.get('collection')?.trim() ?? ''

  const supabase = await createClient()

  // ── Run all filter queries in parallel ─────────────────────────────────────
  const [
    sizesResult,
    colorsResult,
    priceRangeResult,
    fabricsResult,
    sleeveResult,
    occasionsResult,
  ] = await Promise.all([
    // 1. Distinct sizes (in-stock)
    supabase.rpc('get_filter_sizes', {
      p_collection_tag: collection || null,
    }).then((r) => r).catch(() => ({ data: null, error: null })),

    // 2. Distinct colors (in-stock)
    supabase
      .from('product_variants')
      .select('color')
      .not('color', 'is', null)
      .gt('stock_qty', 0)
      .eq('is_active', true),

    // 3. Price range
    supabase
      .from('products')
      .select('price')
      .eq('is_active', true),

    // 4. Distinct fabrics
    supabase
      .from('products')
      .select('fabric_material')
      .eq('is_active', true)
      .not('fabric_material', 'is', null),

    // 5. Distinct sleeve types
    supabase
      .from('products')
      .select('sleeve_type')
      .eq('is_active', true)
      .not('sleeve_type', 'is', null),

    // 6. Occasions from occasion_tags on products
    supabase
      .from('products')
      .select('occasion_tags')
      .eq('is_active', true)
      .not('occasion_tags', 'is', null),
  ])

  // ── Sizes (fallback to direct query if RPC doesn't exist) ──────────────────
  let sizes: string[] = []
  if (!sizesResult.error && sizesResult.data) {
    sizes = (sizesResult.data as { size: string }[]).map((r) => r.size)
  } else {
    // Fallback: direct join
    let variantQuery = supabase
      .from('product_variants')
      .select('size, products!inner(is_active, tags)')
      .eq('is_active', true)
      .gt('stock_qty', 0)
      .eq('products.is_active', true)

    if (collection) {
      variantQuery = variantQuery.contains('products.tags', [collection])
    }

    const { data: variantData } = await variantQuery
    const rawSizes = [...new Set((variantData ?? []).map((v) => v.size).filter(Boolean))]
    sizes = sortSizes(rawSizes as string[])
  }

  // ── Colors ──────────────────────────────────────────────────────────────────
  const colors = [
    ...new Set(
      (colorsResult.data ?? []).map((r) => r.color).filter(Boolean)
    ),
  ].sort() as string[]

  // ── Price range ─────────────────────────────────────────────────────────────
  const prices = (priceRangeResult.data ?? []).map((p) => Number(p.price)).filter((n) => n > 0)
  const price_range = {
    min: prices.length > 0 ? Math.floor(Math.min(...prices)) : 0,
    max: prices.length > 0 ? Math.ceil(Math.max(...prices)) : 10000,
  }

  // ── Fabrics ─────────────────────────────────────────────────────────────────
  const fabrics = [
    ...new Set(
      (fabricsResult.data ?? []).map((p) => p.fabric_material).filter(Boolean)
    ),
  ].sort() as string[]

  // ── Sleeve types ────────────────────────────────────────────────────────────
  const SLEEVE_ORDER = ['sleeveless', 'half_sleeve', '3/4_sleeve', 'full_sleeve']
  const rawSleeves = [
    ...new Set(
      (sleeveResult.data ?? []).map((p) => p.sleeve_type).filter(Boolean)
    ),
  ] as string[]
  const sleeve_types = rawSleeves.sort((a, b) => {
    const ai = SLEEVE_ORDER.indexOf(a)
    const bi = SLEEVE_ORDER.indexOf(b)
    if (ai === -1 && bi === -1) return a.localeCompare(b)
    if (ai === -1) return 1
    if (bi === -1) return -1
    return ai - bi
  })

  // ── Occasions (from occasion_tags on products) ──────────────────────────────
  const allOccasionTags = (occasionsResult.data ?? []).flatMap(
    (p) => (p.occasion_tags as string[]) ?? []
  )
  const occasions = [...new Set(allOccasionTags)].filter(Boolean).sort()

  return NextResponse.json(
    {
      sizes,       // always at least []
      colors,      // always at least []
      price_range, // always has min/max
      fabrics,     // always at least []
      sleeve_types, // always at least []
      occasions,   // always at least []
    },
    {
      headers: { 'Cache-Control': 'public, s-maxage=120' },
    }
  )
}
