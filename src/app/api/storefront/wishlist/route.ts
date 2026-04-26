import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

async function getUser() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return { supabase, user };
}

// GET /api/storefront/wishlist
export async function GET() {
  try {
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
          product_variants ( id, price, mrp, color, size ),
          product_images ( url, alt, is_cover )
        )
      `)
      .eq('user_id', user.id)
      .eq('product_images.is_cover', true)
      .order('added_at', { ascending: false });

    if (error) {
      console.error('[GET /api/storefront/wishlist]', { userId: user.id, error });
      return NextResponse.json({ error: error.message ?? 'Fetch failed' }, { status: 500 });
    }

    const items = (data || []).map((row: any) => ({
      wishlist_id: row.id,
      product_id: row.product_id,
      product: row.products,
    }));

    return NextResponse.json(items);
  } catch (err: any) {
    console.error('[GET /api/storefront/wishlist] unexpected:', { error: err });
    return NextResponse.json({ error: err?.message ?? 'Unknown error' }, { status: 500 });
  }
}

// POST /api/storefront/wishlist
export async function POST(req: NextRequest) {
  try {
    const { supabase, user } = await getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { product_id } = body;
    if (!product_id) return NextResponse.json({ error: 'product_id required' }, { status: 400 });

    const { error } = await supabase
      .from('wishlists')
      .insert({ user_id: user.id, product_id })
      .select()
      .single();

    // 23505 = unique_violation — already wishlisted, treat as success
    if (error && error.code !== '23505') {
      console.error('[POST /api/storefront/wishlist]', { userId: user.id, product_id, error });
      return NextResponse.json({ error: error.message ?? 'Insert failed' }, { status: 500 });
    }

    return NextResponse.json({ added: true });
  } catch (err: any) {
    console.error('[POST /api/storefront/wishlist] unexpected:', { error: err });
    return NextResponse.json({ error: err?.message ?? 'Unknown error' }, { status: 500 });
  }
}

// DELETE /api/storefront/wishlist?product_id=xxx
export async function DELETE(req: NextRequest) {
  try {
    const { supabase, user } = await getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const product_id = new URL(req.url).searchParams.get('product_id');
    if (!product_id) return NextResponse.json({ error: 'product_id required' }, { status: 400 });

    const { error } = await supabase
      .from('wishlists')
      .delete()
      .eq('user_id', user.id)
      .eq('product_id', product_id);

    if (error) {
      console.error('[DELETE /api/storefront/wishlist]', { userId: user.id, product_id, error });
      return NextResponse.json({ error: error.message ?? 'Delete failed' }, { status: 500 });
    }

    return NextResponse.json({ removed: true });
  } catch (err: any) {
    console.error('[DELETE /api/storefront/wishlist] unexpected:', { error: err });
    return NextResponse.json({ error: err?.message ?? 'Unknown error' }, { status: 500 });
  }
}
