import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/requireAdmin'
import { z } from 'zod/v4'

export const runtime = 'nodejs'

// ── Zod schemas for POST validation ─────────────────────────────────────────────
const VariantSchema = z.object({
  size: z.string().min(1, 'Size is required'),
  color: z.string().optional().default(''),
  stock_qty: z.coerce.number().int().min(0, 'Stock must be ≥ 0'),
  sku: z.string().optional().nullable(),
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
  short_description: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  category_id: z.string().uuid().optional().nullable(),
  price: z.coerce.number().min(0, 'Price must be ≥ 0'),
  mrp: z.coerce.number().min(0, 'MRP must be ≥ 0').optional().nullable(),
  visible: z.boolean().optional().default(true),
  status: z.string().optional().default('active'),
  fabric: z.string().optional().nullable(),
  care_instructions: z.string().optional().nullable(),
  seo_title: z.string().optional().nullable(),
  seo_description: z.string().optional().nullable(),
  og_image_cloudinary_id: z.string().optional().nullable(),
  tags: z.array(z.string()).optional().nullable(),
  featured: z.boolean().optional(),
  weight: z.coerce.number().min(0).optional().nullable(),
  hsn_code: z.string().optional().nullable(),
  fit: z.string().optional().nullable(),
  season: z.string().optional().nullable(),
  variants: z.array(VariantSchema).optional().default([]),
  images: z.array(ImageSchema).optional().default([]),
})

export async function GET(req: NextRequest) {
  const guard = await requireAdmin()
  if (guard) return guard
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
  const guard = await requireAdmin()
  if (guard) return guard

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

  const { variants, images, ...productData } = result.data

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createAdminSupabaseClient() as any

  // Auto-generate slug if missing
  if (!productData.slug && productData.name) {
    productData.slug = (productData.name as string)
      .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
  }

  // Sync is_active with visible
  const insertData: Record<string, unknown> = { ...productData }
  if (typeof productData.visible === 'boolean') {
    insertData.is_active = productData.visible
  }

  const { data: product, error } = await supabase
    .from('products')
    .insert([insertData])
    .select()
    .single()

  if (error) {
    return NextResponse.json(
      { error: error.message, hint: error.hint, details: error.details },
      { status: 500 }
    )
  }

  // Insert variants
  if (variants.length > 0) {
    const variantRows = variants.map((v) => ({
      product_id: product.id,
      size: v.size,
      color: v.color || '',
      stock_qty: v.stock_qty,
      sku: v.sku || null,
      price: Number(productData.price) || 0,
      low_stock_threshold: v.low_stock_threshold ?? 5,
    }))
    const { error: varErr } = await supabase.from('product_variants').insert(variantRows)
    if (varErr) return NextResponse.json({ error: varErr.message }, { status: 500 })
  }

  // Insert images
  if (images.length > 0) {
    const imageRows = images
      .filter((img) => img?.url)
      .map((img, i) => ({
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
