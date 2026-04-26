import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q')?.trim()

  if (!q || q.length < 2) {
    return NextResponse.json({ products: [] })
  }

  const supabase = createClient()

  const { data, error } = await supabase
    .from('products')
    .select('id, name, slug, price, mrp, product_images(url, cloudinary_public_id, is_cover, sort_order), product_variants(price, mrp)')
    .or(`name.ilike.%${q}%,short_description.ilike.%${q}%,category.ilike.%${q}%,description.ilike.%${q}%`)
    .eq('visible', true)
    .limit(8)

  if (error) {
    console.error('Search error:', error)
    return NextResponse.json({ products: [] })
  }

  return NextResponse.json({ products: data || [] })
}
