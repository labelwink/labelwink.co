import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createAdminSupabaseClient() as any
  const { searchParams } = new URL(req.url)

  const search   = searchParams.get('search')   || ''
  const category = searchParams.get('category') || ''
  const visible  = searchParams.get('visible')  || ''   // 'true' | 'false' | ''
  const page     = Math.max(0, Number(searchParams.get('page') || '0'))
  const PAGE_SIZE = 25

  let query = supabase
    .from('products')
    .select(
      'id, name, slug, category, price, mrp, visible, status, created_at, product_variants(id, size, stock_qty), product_images(url, is_cover, sort_order)',
      { count: 'exact' }
    )
    .order('created_at', { ascending: false })

  if (search)   query = query.ilike('name', `%${search}%`)
  if (category) query = query.eq('category', category)
  if (visible === 'true')  query = query.eq('visible', true)
  if (visible === 'false') query = query.eq('visible', false)

  query = query.range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

  const { data, count, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({
    products: data ?? [],
    total: count ?? 0,
    page,
    pageSize: PAGE_SIZE,
    totalPages: Math.ceil((count ?? 0) / PAGE_SIZE),
  })
}

export async function POST(req: NextRequest) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createAdminSupabaseClient() as any
  const body = await req.json()
  const { variants, images, ...productData } = body

  // Auto-generate slug if missing
  if (!productData.slug && productData.name) {
    productData.slug = (productData.name as string)
      .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
  }

  // Sync is_active with visible
  if (typeof productData.visible === 'boolean') {
    productData.is_active = productData.visible
  }

  const { data: product, error } = await supabase
    .from('products')
    .insert([productData])
    .select()
    .single()

  if (error) {
    return NextResponse.json(
      { error: error.message, hint: error.hint, details: error.details },
      { status: 500 }
    )
  }

  // Insert variants
  if (variants?.length > 0) {
    const variantRows = variants.map((v: Record<string, unknown>) => ({
      product_id: product.id,
      size: v.size,
      color: v.color || '',
      stock_qty: Number(v.stock_qty) ?? 0,
      sku: v.sku || null,
      price: Number(productData.price) || 0,
      low_stock_threshold: v.low_stock_threshold ?? 5,
    }))
    const { error: varErr } = await supabase.from('product_variants').insert(variantRows)
    if (varErr) return NextResponse.json({ error: varErr.message }, { status: 500 })
  }

  // Insert images
  if (images?.length > 0) {
    const imageRows = images
      .filter((img: Record<string, unknown>) => img?.url)
      .map((img: Record<string, unknown>, i: number) => ({
        product_id: product.id,
        url: img.url,
        cloudinary_public_id: img.public_id || img.cloudinary_public_id || null,
        alt: img.alt || null,
        sort_order: i,
        is_cover: i === 0 || img.is_cover === true,
        is_primary: i === 0 || img.is_cover === true,
      }))
    if (imageRows.length > 0) {
      const { error: imgErr } = await supabase.from('product_images').insert(imageRows)
      if (imgErr) return NextResponse.json({ error: imgErr.message }, { status: 500 })
    }
  }

  const { data: full } = await supabase
    .from('products')
    .select('*, product_variants(*), product_images(*)')
    .eq('id', product.id)
    .single()

  return NextResponse.json(full, { status: 201 })
}
