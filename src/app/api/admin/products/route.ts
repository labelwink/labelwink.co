import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const supabase = createAdminClient()
  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search') || ''
  const category = searchParams.get('category') || ''
  const status = searchParams.get('status') || ''

  let query = supabase
    .from('products')
    .select('*, product_variants(*), product_images(*)')
    .order('created_at', { ascending: false })

  if (search) query = query.ilike('name', `%${search}%`)
  if (category) query = query.eq('category', category)
  if (status === 'visible') query = query.eq('visible', true)
  if (status === 'hidden') query = query.eq('visible', false)

  const { data, error } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const supabase = createAdminClient()
  const body = await req.json()

  // Separate relational data from the product row
  const { variants, images, ...productData } = body

  // Auto-generate slug if missing
  if (!productData.slug) {
    productData.slug = (productData.name as string)
      .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
  }

  // Sync is_active with visible so both RLS policies work
  if (typeof productData.visible === 'boolean') {
    productData.is_active = productData.visible
  }

  // Step 1: Insert the product
  const { data: product, error } = await supabase
    .from('products')
    .insert([productData])
    .select()
    .single()

  if (error) {
    console.error('Product insert error:', JSON.stringify(error, null, 2))
    return NextResponse.json(
      { error: error.message, hint: error.hint, details: error.details, code: error.code },
      { status: 500 }
    )
  }

  // Step 2: Insert variants (sequential — needs product.id)
  if (variants && variants.length > 0) {
    const variantRows = variants.map((v: any) => ({
      product_id: product.id,
      size: v.size,
      color: v.color || '',
      stock_qty: v.stock_qty ?? 0,
      sku: v.sku || null,
      price: Number(productData.price) || 0,
      mrp: Number(productData.mrp) || 0,
    }))
    const { error: variantError } = await supabase
      .from('product_variants')
      .insert(variantRows)
    if (variantError) {
      console.error('Variant insert error:', variantError)
      return NextResponse.json({ error: variantError.message }, { status: 500 })
    }
  }

  // Step 3: Insert images (sequential — needs product.id)
  if (images && images.length > 0) {
    const imageRows = images
      .filter((img: any) => img?.url)
      .map((img: any, i: number) => ({
        product_id: product.id,
        url: img.url,
        cloudinary_public_id: img.public_id || img.cloudinary_public_id || null,
        alt: img.alt || null,
        sort_order: i,
        is_cover: i === 0 || img.is_cover === true,
        is_primary: i === 0 || img.is_cover === true,
      }))
    if (imageRows.length > 0) {
      const { error: imgError } = await supabase
        .from('product_images')
        .insert(imageRows)
      if (imgError) {
        console.error('Image insert error:', imgError)
        return NextResponse.json({ error: imgError.message }, { status: 500 })
      }
    }
  }

  // Return full product with relations
  const { data: full } = await supabase
    .from('products')
    .select('*, product_variants(*), product_images(*)')
    .eq('id', product.id)
    .single()

  return NextResponse.json(full, { status: 201 })
}
