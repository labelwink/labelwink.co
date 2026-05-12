import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Canonical size order for sorting
const SIZE_ORDER = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL', '5XL']

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

  // Run all filter queries in parallel
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
    }).then((r) => r, () => ({ data: null, error: null })),

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

    // 4. Distinct fabrics — real column is 'fabric'
    supabase
      .from('products')
      .select('fabric')
      .eq('is_active', true)
      .not('fabric', 'is', null),

    // 5. Sleeve types — no dedicated column; pulled from tags
    supabase
      .from('products')
      .select('tags')
      .eq('is_active', true)
      .not('tags', 'is', null),

    // 6. Occasions — use 'occasion' column or tags array
    supabase
      .from('products')
      .select('occasion, tags')
      .eq('is_active', true),
  ])

  // 7. Sleeve tags for western wear (after Promise.all)
  let westernSleeveResult = null
  if (collection === 'western-wear') {
    westernSleeveResult = await supabase
      .from('products')
      .select('tags')
      .eq('is_active', true)
      .contains('tags', ['western-wear'])
      .not('tags', 'is', null)
  }

  // Sizes (fallback to direct query if RPC doesn't exist)
  let sizes: string[] = []
  if (!sizesResult.error && sizesResult.data) {
    sizes = (sizesResult.data as { size: string }[]).map((r) => r.size)
  } else {
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

  // Colors
  const colors = [
    ...new Set(
      (colorsResult.data ?? []).map((r) => r.color).filter(Boolean)
    ),
  ].sort() as string[]

  // Price range
  const prices = (priceRangeResult.data ?? []).map((p) => Number(p.price)).filter((n) => n > 0)
  const price_range = {
    min: prices.length > 0 ? Math.floor(Math.min(...prices)) : 0,
    max: prices.length > 0 ? Math.ceil(Math.max(...prices)) : 10000,
  }

  // Fabrics — from real 'fabric' column
  const fabrics = [
    ...new Set(
      (fabricsResult.data ?? []).map((p) => (p as any).fabric).filter(Boolean)
    ),
  ].sort() as string[]

  // Sleeve types — derived from tags array
  const SLEEVE_ORDER = ['sleeveless', 'half_sleeve', '3/4_sleeve', 'full_sleeve']
  const sleeveTagKeywords = ['sleeveless', 'half-sleeve', 'half_sleeve', 'full-sleeve', 'full_sleeve', '3/4-sleeve', '3/4_sleeve', 'short-sleeve', 'elbow-sleeve', 'three-quarter-sleeve']
  const rawSleeves = [
    ...new Set(
      (sleeveResult.data ?? []).flatMap((p) => (p as any).tags ?? []).filter((t: string) => sleeveTagKeywords.some(k => t.includes('sleeve') || t.includes('sleeveless')))
    ),
  ] as string[]
  let sleeve_types: string[] = rawSleeves.sort((a, b) => {
    const ai = SLEEVE_ORDER.indexOf(a)
    const bi = SLEEVE_ORDER.indexOf(b)
    if (ai === -1 && bi === -1) return a.localeCompare(b)
    if (ai === -1) return 1
    if (bi === -1) return -1
    return ai - bi
  })

  // Override for western wear collection
  if (collection === 'western-wear' && westernSleeveResult?.data) {
    const westernSleeveTags = (westernSleeveResult.data as { tags: string[] }[])
      .flatMap(p => p.tags || [])
      .filter(tag => ['short-sleeve', 'elbow-sleeve', 'three-quarter-sleeve', 'full-sleeve'].includes(tag))
    sleeve_types = [...new Set(westernSleeveTags)].sort((a, b) => {
      const order = ['short-sleeve', 'elbow-sleeve', 'three-quarter-sleeve', 'full-sleeve']
      return order.indexOf(a) - order.indexOf(b)
    })
  }

  // Occasions — from 'occasion' column (text) merged with occasion-type tags
  const allOccasionVals = (occasionsResult.data ?? []).flatMap((p) => {
    const vals: string[] = []
    if ((p as any).occasion) vals.push((p as any).occasion)
    return vals
  })
  const occasions = [...new Set(allOccasionVals)].filter(Boolean).sort()

  return NextResponse.json(
    { sizes, colors, price_range, fabrics, sleeve_types, occasions },
    { headers: { 'Cache-Control': 'public, s-maxage=120' } }
  )
}
