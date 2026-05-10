import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.redirect(new URL('/products', req.url));
    }

    const supabaseAdmin = createAdminClient();

    const { data: cart } = await supabaseAdmin
      .from('abandoned_carts')
      .select('cart_items')
      .eq('recovery_token', token)
      .eq('recovered', false)
      .maybeSingle();

    if (!cart) {
      return NextResponse.redirect(new URL('/products', req.url));
    }

    // Mark as recovered
    await supabaseAdmin
      .from('abandoned_carts')
      .update({ 
        recovered: true, 
        recovered_at: new Date().toISOString() 
      })
      .eq('recovery_token', token);

    const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || new URL(req.url).origin;
    const response = NextResponse.redirect(new URL('/?cart_restored=true', SITE_URL));
    
    // Pass items via cookie for the client to pick up and restore to store
    response.cookies.set('restored_cart', JSON.stringify(cart.cart_items), { 
      path: '/',
      maxAge: 300, // 5 minutes
      httpOnly: false // Accessible by client JS
    });

    return response;
  } catch (error) {
    console.error('Recovery error:', error);
    return NextResponse.redirect(new URL('/products', req.url));
  }
}
