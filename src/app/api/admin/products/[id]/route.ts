import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'
import { generateUniqueSKU } from '@/lib/sku'

export const runtime = 'nodejs'
type RouteCtx = { params: Promise<{ id: string }> }

export async function GET(_: NextRequest, { params }: RouteCtx) {
  const { id } = await params
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createAdminSupabaseClient() as any

  const { data, error } = await supabase
    .from('products')
    .select('*, product_variants(*), product_images(*)')
    .eq('id', id)
    .single()

  if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(data)
}

export async function PATCH(req: NextRequest, { params }: RouteCtx) {
  const { id } = await params
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createAdminSupabaseClient() as any
  const body = await req.json()
  const { variants, images, ...productData } = (body as any)

  // Whitelist approach: Only pick fields that actually exist in the products table
  const allowedFields: Record<string, any> = {
    name:               productData.name,
    slug:               productData.slug,
    description:        productData.description,
    price:              productData.price !== undefined ? Number(productData.price) : undefined,
    compare_at_price:   productData.mrp !== undefined ? Number(productData.mrp) : (productData.compare_at_price !== undefined ? Number(productData.compare_at_price) : undefined),
    collection_id:      productData.collection_id,
    category_id:        productData.category_id,
    visible:            productData.visible,
    status:             productData.status,
    fabric:             productData.fabric,
    fit:                productData.fit,
    season:             productData.season,
    tags:               productData.tags,
    hsn_code:           productData.hsn_code,
    weight:             productData.weight_grams !== undefined ? Number(productData.weight_grams) : (productData.weight !== undefined ? Number(productData.weight) : undefined),
    size_chart_data:    productData.size_chart_data,
    meta_title:         productData.meta_title,
    meta_description:   productData.meta_description,
    is_featured:        productData.is_featured,
    fabric_material:    productData.fabric_material,
    sleeve_type:        productData.sleeve_type,
    fit_type:           productData.fit_type,
    additional_info:    productData.additional_info,
    base_price:         productData.base_price !== undefined ? Number(productData.base_price) : undefined,
    updated_at:         new Date().toISOString(),
  }

  // Sync is_active with visible if present
  if (typeof productData.visible === 'boolean') {
    allowedFields.is_active = productData.visible
  }

  // Transform occasion array to comma-separated string if needed
  if (productData.occasion !== undefined) {
    allowedFields.occasion = Array.isArray(productData.occasion) 
      ? productData.occasion.join(',') 
      : productData.occasion
  }

  // Remove undefined keys to avoid overwriting with null unless intended
  const cleanPayload = Object.fromEntries(
    Object.entries(allowedFields).filter(([_, v]) => v !== undefined)
  )

  const { error } = await supabase.from('products').update(cleanPayload).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Upsert variants (delete orphans first)
  if (Array.isArray(variants)) {
    const incomingSizes = variants.map((v: Record<string, unknown>) => v.size)

    // Delete variants not in the new set
    if (incomingSizes.length > 0) {
      await supabase
        .from('product_variants')
        .delete()
        .eq('product_id', id)
        .not('size', 'in', `(${incomingSizes.map((s: unknown) => `"${s}"`).join(',')})`)
    } else {
      await supabase.from('product_variants').delete().eq('product_id', id)
    }

    // Upsert remaining
    for (const v of variants) {
      let retryCount = 0
      const MAX_RETRIES = 3
      let varSuccess = false

      while (retryCount < MAX_RETRIES && !varSuccess) {
        const skuToUse = (v.sku && retryCount === 0) 
          ? v.sku 
          : await generateUniqueSKU(supabase, productData.slug || id, v.size)

        const { error: varErr } = await supabase.from('product_variants').upsert(
          {
            product_id: id,
            size: v.size,
            color: v.color || '',
            stock_qty: Number(v.stock_qty) ?? 0,
            sku: skuToUse,
            low_stock_threshold: v.low_stock_threshold ?? 5,
            // Always use per-variant price — never fall back to product-level price
            price: v.price !== undefined && v.price !== null ? Number(v.price) : 0,
            compare_at_price: v.compare_at_price !== undefined && v.compare_at_price !== null ? Number(v.compare_at_price) : null,
            is_active: v.is_active ?? true,
          },
          { onConflict: 'product_id,size' }
        )

        if (!varErr) {
          varSuccess = true
        } else if (varErr.code === '23505' && varErr.message.includes('sku')) {
          retryCount++
          await new Promise(resolve => setTimeout(resolve, 50))
        } else {
          console.error('Variant upsert error:', varErr)
          break
        }
      }
    }
  }

  // Sync images: delete all then re-insert
  if (Array.isArray(images)) {
    await supabase.from('product_images').delete().eq('product_id', id)
    if (images.length > 0) {
      const imageRows = images
        .filter((img: Record<string, unknown>) => img?.url)
        .map((img: Record<string, unknown>, i: number) => ({
          product_id: id,
          url: img.url,
          alt: img.alt || null,
          sort_order: i,
          is_cover: i === 0 || img.is_cover === true,
        }))
      if (imageRows.length > 0) {
        const { error: imgErr } = await supabase.from('product_images').insert(imageRows)
        if (imgErr) console.error('Image insert:', imgErr)
      }
    }
  }

  const { data: full } = await supabase
    .from('products')
    .select('*, product_variants(*), product_images(*)')
    .eq('id', id)
    .single()

  return NextResponse.json(full)
}

export async function DELETE(_: NextRequest, { params }: RouteCtx) {
  const { id } = await params
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createAdminSupabaseClient() as any
  const { error } = await supabase.from('products').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
