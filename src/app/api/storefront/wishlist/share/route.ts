import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  // Use admin client here since it's a public share URL and needs to read another user's wishlist
  const supabase = createAdminClient()
  try {
    const user_id = req.nextUrl.searchParams.get('user_id')
    if (!user_id) return NextResponse.json({ error: 'Missing user_id' }, { status: 400 })

    const { data: userProfile, error: profileErr } = await supabase
      .from('profiles')
      .select('first_name')
      .eq('id', user_id)
      .single()
      
    if (profileErr) throw new Error(profileErr.message)

    const { data: wishlists, error } = await supabase
      .from('wishlists')
      .select(`
        *,
        products (
          id, name, slug, price, compare_at_price, images,
          product_variants (size, stock_qty)
        )
      `)
      .eq('user_id', user_id)
      .order('created_at', { ascending: false })

    if (error) throw new Error(error.message)

    const items = wishlists.map(w => {
      const p = Array.isArray(w.products) ? w.products[0] : w.products;
      return {
        ...w,
        product_id: p.id,
        name: p.name,
        slug: p.slug,
        price: p.price,
        compare_at_price: p.compare_at_price,
        images: p.images,
        variants: p.product_variants
      }
    })

    return NextResponse.json({ items, user_first_name: userProfile?.first_name || 'Someone' })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
