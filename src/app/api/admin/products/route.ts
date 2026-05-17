import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/requireAdmin'
import { generateUniqueSKU } from '@/lib/sku'
import { z } from 'zod/v4'

export const runtime = 'nodejs'

// ── Zod schemas for POST validation ─────────────────────────────────────────────
const VariantSchema = z.object({
  size: z.string().min(1, 'Size is required'),
  color: z.string().optional().default(''),
  stock_qty: z.coerce.number().int().min(0, 'Stock must be ≥ 0'),
  sku: z.string().optional().nullable(),
  price: z.coerce.number().min(0).optional().nullable(),
  compare_at_price: z.coerce.number().min(0).optional().nullable(),
  is_active: z.boolean().optional().default(true),
  low_stock_threshold: z.coerce.number().int().min(0).optional().default(5),
})

const ImageSchema = z.object({
  url: z.string().url('Image URL must be a valid URL'),
  public_id: z.string().optional().nullable(),
  cloudinary_public_id: z.string().optional().nullable(),
  alt: z.string().optional().nullable(),
  is_cover: z.boolean().optional(),
})

const CreateProductSchema = z.object({
  name: z.string().min(1, 'Product name is required').max(200),
  slug: z.string().max(200).optional(),
  description: z.string().optional().nullable(),
  collection_id: z.string().uuid().optional().nullable(),
  price: z.coerce.number().min(0, 'Price must be ≥ 0'),
  compare_at_price: z.coerce.number().min(0).optional().nullable(),
  visible: z.boolean().optional().default(true),
  status: z.string().optional().default('draft'),
  fabric: z.string().optional().nullable(),
  occasion: z.union([
    z.string(),
    z.array(z.string()),
  ]).optional().nullable().transform(val =>
    Array.isArray(val) ? val.join(',') : (val ?? null)
  ),
  fit: z.string().optional().nullable(),
  season: z.string().optional().nullable(),
  tags: z.array(z.string()).optional().nullable(),
  is_featured: z.boolean().optional(),
  weight: z.coerce.number().min(0).optional().nullable(),
  weight_grams: z.coerce.number().min(0).optional().nullable(),
  mrp: z.coerce.number().min(0).optional().nullable(),
  first_order_discount: z.any().optional().nullable(),
  short_description: z.string().optional().nullable(),
  specifications: z.any().optional().nullable(),
  collection: z.string().optional().nullable(),
  colour: z.string().optional().nullable(),
  hsn_code: z.string().optional().nullable(),
  meta_title: z.string().optional().nullable(),
  meta_description: z.string().optional().nullable(),
  size_chart_data: z.any().optional().nullable(),
  variants: z.array(VariantSchema).optional().default([]),
  images: z.array(ImageSchema).optional().default([]),
})

export async function GET(req: NextRequest) {
  try {
    const guard = await requireAdmin()
    if (guard instanceof NextResponse) return guard
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
        'id, name, slug, collection_id, price, compare_at_price, visible, status, created_at, is_featured, product_variants(id, size, stock_qty, price), product_images(url, is_cover, sort_order)',
        { count: 'exact' }
      )
      .order('created_at', { ascending: false })

    if (search)   query = query.ilike('name', `%${search}%`)
    if (category) query = query.eq('collection_id', category)
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
  } catch (error) {
    console.error('[admin/products GET]', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}


// ── Helper: Collision-safe Slug Generation ─────────────────────────────────────
async function generateUniqueSlug(supabase: any, name: string): Promise<string> {
  const base = name
    .toLowerCase().trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')

  let slug = base
  let counter = 1
  while (true) {
    const { data } = await supabase
      .from('products')
      .select('id')
      .eq('slug', slug)
      .maybeSingle()
    if (!data) return slug
    slug = `${base}-${counter++}`
  }
}



export async function POST(req: NextRequest) {
  const guard = await requireAdmin()
  if (guard instanceof NextResponse) return guard

  // ── Validate request body ───────────────────────────────────────────────────
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body', fieldErrors: {} },
      { status: 400 }
    )
  }

  const result = CreateProductSchema.safeParse(body)
  if (!result.success) {
    const fieldErrors: Record<string, string[]> = {}
    for (const issue of result.error.issues) {
      const path = issue.path.map(String).join('.') || '_root'
      if (!fieldErrors[path]) fieldErrors[path] = []
      fieldErrors[path].push(issue.message)
    }
    return NextResponse.json(
      { error: 'Validation failed', fieldErrors },
      { status: 400 }
    )
  }

  const { variants = [], images = [], ...productData } = (body as any)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createAdminSupabaseClient() as any

  // Status Guard
  const ALLOWED_STATUSES = ['draft', 'published', 'archived']
  const safeStatus = ALLOWED_STATUSES.includes((body as any).status) 
    ? (body as any).status 
    : 'draft'

  // Collision-safe Slug
  const slug = await generateUniqueSlug(supabase, productData.name)

  // Whitelist approach: Only pick fields that actually exist in the products table
  const allowedFields: Record<string, any> = {
    name:               productData.name,
    slug,
    description:        productData.description,
    price:              Number(productData.price) || 0,
    compare_at_price:   productData.mrp !== undefined ? Number(productData.mrp) : (productData.compare_at_price !== undefined ? Number(productData.compare_at_price) : null),
    collection_id:      productData.collection_id,
    category_id:        productData.category_id,
    visible:            productData.visible ?? true,
    status:             safeStatus,
    fabric:             productData.fabric,
    fit:                productData.fit,
    season:             productData.season,
    tags:               productData.tags,
    hsn_code:           productData.hsn_code,
    weight:             productData.weight_grams !== undefined ? Number(productData.weight_grams) : (productData.weight !== undefined ? Number(productData.weight) : null),
    size_chart_data:    productData.size_chart_data,
    meta_title:         productData.meta_title,
    meta_description:   productData.meta_description,
    is_featured:        productData.is_featured,
    fabric_material:    productData.fabric_material,
    sleeve_type:        productData.sleeve_type,
    fit_type:           productData.fit_type,
    additional_info:    productData.additional_info,
    base_price:         productData.base_price !== undefined ? Number(productData.base_price) : null,
    is_active:          productData.visible ?? true,
    created_at:         new Date().toISOString(),
    updated_at:         new Date().toISOString(),
  }

  // Transform occasion if present
  if (productData.occasion !== undefined) {
    allowedFields.occasion = Array.isArray(productData.occasion) 
      ? productData.occasion.join(',') 
      : productData.occasion
  }

  // Filter out undefined to avoid issues with null defaults
  const insertData = Object.fromEntries(
    Object.entries(allowedFields).filter(([_, v]) => v !== undefined)
  )

  const { data: product, error } = await supabase
    .from('products')
    .insert([insertData])
    .select()
    .single()

  if (error) {
    if (error?.code === '23505' && error.message.includes('products_slug_key')) {
      return NextResponse.json(
        { error: 'A product with this name already exists. Please rename it.' },
        { status: 409 }
      )
    }
    return NextResponse.json(
      { error: error.message, hint: error.hint, details: error.details },
      { status: 500 }
    )
  }

  // Insert variants with retry logic
  if (variants.length > 0) {
    let retryCount = 0
    const MAX_RETRIES = 3
    let success = false
    let lastError: any = null

    while (retryCount < MAX_RETRIES && !success) {
      const variantRows = await Promise.all(variants.map(async (v) => ({
        product_id: product.id,
        size: v.size,
        color: v.color || '',
        stock_qty: v.stock_qty,
        sku: (v.sku && retryCount === 0) ? v.sku : await generateUniqueSKU(supabase, slug, v.size),
        // Use per-variant price; fall back to product price only if variant price not set
        price: v.price !== undefined && v.price !== null ? Number(v.price) : (Number(productData.price) || 0),
        compare_at_price: v.compare_at_price !== undefined && v.compare_at_price !== null ? Number(v.compare_at_price) : null,
        is_active: v.is_active ?? true,
        low_stock_threshold: v.low_stock_threshold ?? 5,
      })))

      const { error: varErr } = await supabase.from('product_variants').insert(variantRows)
      
      if (!varErr) {
        success = true
      } else {
        lastError = varErr
        if (varErr.code === '23505' && (varErr.message.includes('sku') || varErr.message.includes('SKU'))) {
          retryCount++
          await new Promise(resolve => setTimeout(resolve, 100 * retryCount))
          continue
        }
        break
      }
    }

    if (!success) {
      return NextResponse.json(
        { error: lastError?.message || 'Failed to insert variants', code: lastError?.code },
        { status: lastError?.code === '23505' ? 409 : 500 }
      )
    }
  }

  // Insert images
  if (images.length > 0) {
    const imageRows = images
      .filter((img) => img?.url)
      .map((img, i) => ({
        product_id: product.id,
        url: img.url,
        alt: img.alt || null,
        sort_order: i,
        is_cover: i === 0 || img.is_cover === true,
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
