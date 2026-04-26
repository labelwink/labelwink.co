import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/storefront/orders — fetch current user's orders
export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await supabase
    .from('orders')
    .select(`
      id, status, total, created_at,
      tracking_number, tracking_url, shipping_carrier,
      order_items (
        id,
        quantity,
        price,
        size,
        color,
        products ( name, slug )
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });


  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data || []);
}
