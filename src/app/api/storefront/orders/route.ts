import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/storefront/orders — fetch current user's orders
export async function GET() {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError) {
      console.error('[storefront/orders] Auth error:', authError.message);
      return NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
    }

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // order_items already has denormalized product_name, variant_size, variant_color,
    // price_at_purchase — no need to join products (which fails when RLS hides
    // invisible products via the public read policy).
    const { data, error } = await supabase
      .from('orders')
      .select(`
        id, order_number, status, total, created_at,
        tracking_number, tracking_url, shipping_carrier,
        order_items (
          id,
          quantity,
          price_at_purchase,
          product_name,
          variant_size,
          variant_color,
          image_url,
          image_cloudinary_id,
          product_id
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[storefront/orders] Query error:', error.message, error.details, error.hint);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (err) {
    console.error('[storefront/orders] Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
