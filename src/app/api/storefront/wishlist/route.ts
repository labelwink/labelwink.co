import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

async function getUser() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return { supabase, user };
}

// GET /api/storefront/wishlist — fetch all wishlisted products for current user
export async function GET() {
  const { supabase, user } = await getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await supabase
    .from('wishlists')
    .select(`
      id,
      product_id,
      products (
        id,
        name,
        slug,
        product_variants ( id, price, mrp, image_public_ids, color, size ),
        product_images ( url, cloudinary_public_id )
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const items = (data || []).map((row: any) => ({
    wishlist_id: row.id,
    product_id: row.product_id,
    product: row.products,
  }));

  return NextResponse.json(items);
}

// POST /api/storefront/wishlist — add product to wishlist
export async function POST(req: NextRequest) {
  const { supabase, user } = await getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { product_id } = await req.json();
  if (!product_id) return NextResponse.json({ error: 'product_id required' }, { status: 400 });

  const { error } = await supabase
    .from('wishlists')
    .insert({ user_id: user.id, product_id })
    .select()
    .single();

  // ON CONFLICT DO NOTHING — Supabase returns 409/23505 for unique violations; ignore
  if (error && error.code !== '23505') {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ added: true });
}

// DELETE /api/storefront/wishlist?product_id=xxx
export async function DELETE(req: NextRequest) {
  const { supabase, user } = await getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const product_id = new URL(req.url).searchParams.get('product_id');
  if (!product_id) return NextResponse.json({ error: 'product_id required' }, { status: 400 });

  const { error } = await supabase
    .from('wishlists')
    .delete()
    .eq('user_id', user.id)
    .eq('product_id', product_id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ removed: true });
}
