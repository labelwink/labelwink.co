import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  try {
    const { email, cart_items, cart_total, user_id } = await req.json();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
    }

    if (!cart_items || cart_items.length === 0) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
    }

    const supabaseAdmin = createAdminClient();

    const { data: existing } = await supabaseAdmin
      .from('abandoned_carts')
      .select('id')
      .eq('email', email)
      .eq('recovered', false)
      .maybeSingle();

    if (existing) {
      await supabaseAdmin
        .from('abandoned_carts')
        .update({
          cart_items,
          cart_total,
          user_id: user_id || null,
          updated_at: new Date().toISOString(),
          recovered: false
        })
        .eq('id', existing.id);
    } else {
      await supabaseAdmin
        .from('abandoned_carts')
        .insert({
          email,
          cart_items,
          cart_total,
          user_id: user_id || null,
          recovered: false
        });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Abandon cart error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
