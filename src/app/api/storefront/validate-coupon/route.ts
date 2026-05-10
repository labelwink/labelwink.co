import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { code, cart_total, user_id } = body;

    if (!code || cart_total === undefined) {
      return NextResponse.json({ error: 'Missing code or cart_total' }, { status: 400 });
    }

    const supabaseAdmin = createAdminClient();
    
    const { data: discount, error } = await supabaseAdmin
      .from('discount_codes')
      .select('*')
      .eq('code', code.toUpperCase())
      .eq('is_active', true)
      .single();

    if (error || !discount) {
      return NextResponse.json({ error: 'Invalid coupon code' }, { status: 404 });
    }

    const now = new Date();

    if (discount.starts_at && new Date(discount.starts_at) > now) {
      return NextResponse.json({ error: 'This coupon is not active yet' }, { status: 400 });
    }
    if (discount.expires_at && new Date(discount.expires_at) < now) {
      return NextResponse.json({ error: 'This coupon has expired' }, { status: 400 });
    }
    if (discount.max_uses && discount.used_count >= discount.max_uses) {
      return NextResponse.json({ error: 'This coupon is no longer available' }, { status: 400 });
    }
    if (discount.min_order_amount && cart_total < discount.min_order_amount) {
      return NextResponse.json({ error: `Minimum order ₹${discount.min_order_amount} required` }, { status: 400 });
    }

    if (discount.single_use_per_customer && user_id) {
      const { count } = await supabaseAdmin
        .from('discount_code_uses')
        .select('id', { count: 'exact' })
        .eq('discount_code_id', discount.id)
        .eq('user_id', user_id);
      
      if (count && count > 0) {
        return NextResponse.json({ error: 'You have already used this coupon' }, { status: 400 });
      }
    }

    let discount_amount = 0;
    if (discount.type === 'percentage') {
      discount_amount = Math.round(cart_total * (discount.value / 100) * 100) / 100;
    } else if (discount.type === 'flat') {
      discount_amount = Math.min(discount.value, cart_total);
    } else if (discount.type === 'free_shipping') {
      discount_amount = 0;
    }

    return NextResponse.json({
      valid: true,
      discount_amount,
      type: discount.type,
      code: discount.code,
      message: discount.type === 'free_shipping' ? `Shipping charge waived!` : `₹${discount_amount} off applied!`
    });

  } catch (err: any) {
    console.error('Coupon validation error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
