import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'

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
  const { variants, images, ...productData } = body

  // Sync is_active with visible
  if (typeof productData.visible === 'boolean') {
    productData.is_active = productData.visible
  }

  const { error } = await supabase.from('products').update(productData).eq('id', id)
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
      const { error: varErr } = await supabase.from('product_variants').upsert(
        {
          product_id: id,
          size: v.size,
          color: v.color || '',
          stock_qty: Number(v.stock_qty) ?? 0,
          sku: v.sku || null,
          low_stock_threshold: v.low_stock_threshold ?? 5,
          price: Number(productData.price) || Number(v.price) || 0,
          mrp: Number(productData.mrp) || Number(v.mrp) || 0,
        },
        { onConflict: 'product_id,size' }
      )
      if (varErr) console.error('Variant upsert:', varErr)
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
