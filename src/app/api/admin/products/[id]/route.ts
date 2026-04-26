import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('products')
    .select('*, product_variants(*), product_images(*)')
    .eq('id', id)
    .single()

  if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(data)
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createAdminClient()
  const body = await req.json()
  const { variants, images, ...productData } = body

  // Sync is_active with visible so both RLS policies work
  if (typeof productData.visible === 'boolean') {
    productData.is_active = productData.visible
  }

  const { error } = await supabase
    .from('products')
    .update(productData)
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Upsert variants
  if (variants && variants.length > 0) {
    for (const v of variants) {
      const { error: variantError } = await supabase.from('product_variants').upsert(
        {
          product_id: id,
          size: v.size,
          color: v.color || '',
          stock_qty: Number(v.stock_qty) || 0,
          sku: v.sku || null,
          low_stock_threshold: v.low_stock_threshold ?? 5,
          price: Number(productData.price) || Number(v.price) || 0,
          mrp: Number(productData.mrp) || Number(v.mrp) || 0,
        },
        { onConflict: 'product_id,size' }
      )
      if (variantError) console.error('Variant upsert error:', variantError)
    }
  }

  // Sync product_images: delete existing then re-insert
  if (Array.isArray(images)) {
    await supabase.from('product_images').delete().eq('product_id', id)
    if (images.length > 0) {
      const imageRows = images
        .filter((img: any) => img?.url)
        .map((img: any, i: number) => ({
          product_id: id,
          url: img.url,
          cloudinary_public_id: img.public_id || img.cloudinary_public_id || null,
          alt: img.alt || null,
          sort_order: i,
          is_cover: i === 0 || img.is_cover === true,
          is_primary: i === 0 || img.is_cover === true,
        }))
      if (imageRows.length > 0) {
        const { error: imgError } = await supabase.from('product_images').insert(imageRows)
        if (imgError) console.error('Image insert error:', imgError)
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

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createAdminClient()

  const { error } = await supabase.from('products').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
