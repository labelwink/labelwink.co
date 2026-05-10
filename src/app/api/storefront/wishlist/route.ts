import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

export async function GET() {
  const supabase = await createClient()
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: wishlists, error, count } = await supabase
      .from('wishlists')
      .select(`
        *,
        products (
          id, name, slug, price, compare_at_price,
          product_images (url, alt, is_cover, sort_order),
          product_variants (size, stock_qty)
        )
      `, { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Wishlist query error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const items = wishlists?.map(w => {
      const p = Array.isArray(w.products) ? w.products[0] : w.products;
      if (!p) return null;
      // Get cover image URL from product_images join
      const coverImage =
        (p.product_images as any[])?.find((img: any) => img.is_cover)?.url
        ?? (p.product_images as any[])?.[0]?.url
        ?? null;
      return {
        ...w,
        product_id: p.id,
        name: p.name,
        slug: p.slug,
        price: p.price,
        compare_at_price: p.compare_at_price,
        image_url: coverImage,
        product_images: p.product_images,
        variants: p.product_variants,
      }
    }).filter(Boolean) || [];

    return NextResponse.json({ items, count: count || items.length })
  } catch (err: unknown) {
    console.error('Wishlist GET error:', err);
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { product_id } = body
    if (!product_id) return NextResponse.json({ error: 'Missing product_id' }, { status: 400 })

    const { data: product, error: pErr } = await supabase
      .from('products')
      .select('id, is_active')
      .eq('id', product_id)
      .single()

    if (pErr || !product || !product.is_active) {
      return NextResponse.json({ error: 'Product not found or inactive' }, { status: 404 })
    }

    const { error } = await supabase
      .from('wishlists')
      .insert({ user_id: user.id, product_id })
    
    if (error && error.code !== '23505') {
      console.error('Wishlist insert error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ added: true, product_id })
  } catch (err: unknown) {
    console.error('Wishlist POST error:', err);
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient()
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const product_id = req.nextUrl.searchParams.get('product_id')
    if (!product_id) return NextResponse.json({ error: 'Missing product_id' }, { status: 400 })

    const { error } = await supabase
      .from('wishlists')
      .delete()
      .eq('user_id', user.id)
      .eq('product_id', product_id)

    if (error) {
      console.error('Wishlist delete error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ removed: true, product_id })
  } catch (err: unknown) {
    console.error('Wishlist DELETE error:', err);
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
