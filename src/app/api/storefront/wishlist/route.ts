import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

async function getAuthenticatedUser() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return { supabase, user: null };
  return { supabase, user };
}

// GET /api/storefront/wishlist — fetch user wishlist
export async function GET() {
  try {
    const { supabase, user } = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('wishlists')
      .select('id, product_id, variant_id, added_at, products(id, name, slug, price, mrp, images)')
      .eq('user_id', user.id)
      .order('added_at', { ascending: false });

    if (error) {
      console.error('[GET /api/storefront/wishlist]', { userId: user.id, error });
      return NextResponse.json({ error: error.message ?? 'Fetch failed' }, { status: 500 });
    }

    return NextResponse.json({ items: data ?? [] });
  } catch (err: any) {
    console.error('[GET /api/storefront/wishlist] unexpected:', err);
    return NextResponse.json({ error: err?.message ?? 'Unknown error' }, { status: 500 });
  }
}

// POST /api/storefront/wishlist — add to wishlist
export async function POST(req: NextRequest) {
  try {
    const { supabase, user } = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { product_id, variant_id } = body;
    if (!product_id) {
      return NextResponse.json({ error: 'product_id required' }, { status: 400 });
    }

    const insertPayload: Record<string, string> = {
      user_id: user.id,
      product_id,
    };
    if (variant_id) insertPayload.variant_id = variant_id;

    const { error } = await supabase
      .from('wishlists')
      .insert(insertPayload);

    // 23505 = unique_violation — already wishlisted, treat as success
    if (error && error.code === '23505') {
      return NextResponse.json({ wishlisted: true });
    }
    if (error) {
      console.error('[POST /api/storefront/wishlist]', { userId: user.id, product_id, error });
      return NextResponse.json({ error: error.message ?? 'Insert failed' }, { status: 500 });
    }

    return NextResponse.json({ wishlisted: true });
  } catch (err: any) {
    console.error('[POST /api/storefront/wishlist] unexpected:', err);
    return NextResponse.json({ error: err?.message ?? 'Unknown error' }, { status: 500 });
  }
}

// DELETE /api/storefront/wishlist — remove from wishlist
export async function DELETE(req: NextRequest) {
  try {
    const { supabase, user } = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { product_id } = body;
    if (!product_id) {
      return NextResponse.json({ error: 'product_id required' }, { status: 400 });
    }

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
    console.error('[DELETE /api/storefront/wishlist] unexpected:', err);
    return NextResponse.json({ error: err?.message ?? 'Unknown error' }, { status: 500 });
  }
}
