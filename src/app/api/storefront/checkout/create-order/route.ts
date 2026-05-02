import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { createRazorpayOrder } from '@/lib/razorpay';

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { address_id, shipping_method, coupon_code, use_loyalty_points, cart_items } = body;

    if (!address_id || !cart_items || cart_items.length === 0) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabaseAdmin = createAdminClient();

    const { data: address } = await supabaseAdmin
      .from('addresses')
      .select('*')
      .eq('id', address_id)
      .eq('user_id', user.id)
      .single();

    if (!address) {
      return NextResponse.json({ error: 'Invalid address' }, { status: 400 });
    }

    let subtotal = 0;
    for (const item of cart_items) {
      const { data: product } = await supabaseAdmin
        .from('products')
        .select('name, price, stock_qty')
        .eq('id', item.product_id)
        .single();
        
      if (!product) {
        return NextResponse.json({ error: `Product not found: ${item.product_id}` }, { status: 400 });
      }

      const { data: variant } = await supabaseAdmin
        .from('product_variants')
        .select('stock_qty, price, size, color')
        .eq('product_id', item.product_id)
        .eq('size', item.size || '')
        .maybeSingle();
        
      let price = product.price;
      let stock = product.stock_qty;
      
      if (variant) {
        price = variant.price;
        stock = variant.stock_qty;
      }

      if (stock < item.quantity) {
        return NextResponse.json({ error: `${product.name} (Size ${item.size || 'N/A'}) is out of stock` }, { status: 400 });
      }

      subtotal += price * item.quantity;
    }

    const { data: settings } = await supabaseAdmin.from('shop_settings').select('*').single();
    const freeShippingThreshold = settings?.free_shipping_threshold ?? 999;
    const standardCharge = settings?.standard_shipping_charge ?? 79;
    const expressCharge = settings?.express_shipping_charge ?? 149;
    const redemptionRatio = settings?.loyalty_redemption_ratio ?? 100;

    let shipping = 0;
    if (subtotal < freeShippingThreshold) {
      shipping = shipping_method === 'express' ? expressCharge : standardCharge;
    }

    let discount_amount = 0;
    if (coupon_code) {
      const { data: discountCode } = await supabaseAdmin
        .from('discount_codes')
        .select('*')
        .eq('code', coupon_code.toUpperCase())
        .eq('is_active', true)
        .single();
        
      if (!discountCode) {
        return NextResponse.json({ error: 'Invalid coupon code' }, { status: 400 });
      }
      
      const now = new Date();
      if (discountCode.starts_at && new Date(discountCode.starts_at) > now) {
        return NextResponse.json({ error: 'This coupon is not active yet' }, { status: 400 });
      }
      if (discountCode.expires_at && new Date(discountCode.expires_at) < now) {
        return NextResponse.json({ error: 'This coupon has expired' }, { status: 400 });
      }
      if (discountCode.max_uses && discountCode.used_count >= discountCode.max_uses) {
        return NextResponse.json({ error: 'This coupon is no longer available' }, { status: 400 });
      }
      if (discountCode.min_order_amount && subtotal < discountCode.min_order_amount) {
        return NextResponse.json({ error: `Minimum order ₹${discountCode.min_order_amount} required` }, { status: 400 });
      }
      if (discountCode.single_use_per_customer) {
        const { count } = await supabaseAdmin
          .from('discount_code_uses')
          .select('id', { count: 'exact' })
          .eq('discount_code_id', discountCode.id)
          .eq('user_id', user.id);
        if (count && count > 0) {
          return NextResponse.json({ error: 'You have already used this coupon' }, { status: 400 });
        }
      }

      if (discountCode.type === 'percentage') {
        discount_amount = Math.round((subtotal * discountCode.value) / 100);
      } else if (discountCode.type === 'flat') {
        discount_amount = Math.min(discountCode.value, subtotal);
      } else if (discountCode.type === 'free_shipping') {
        shipping = 0;
      }
    }

    let loyalty_discount = 0;
    if (use_loyalty_points) {
      const { data: loyalty } = await supabaseAdmin
        .from('loyalty_points')
        .select('balance')
        .eq('user_id', user.id)
        .single();
        
      if (loyalty && loyalty.balance > 0) {
        loyalty_discount = Math.floor(loyalty.balance / redemptionRatio);
      }
    }

    const currentTotalBeforeLoyalty = subtotal + shipping - discount_amount;
    if (loyalty_discount > currentTotalBeforeLoyalty - 1) {
      loyalty_discount = currentTotalBeforeLoyalty - 1;
    }
    if (loyalty_discount < 0) loyalty_discount = 0;

    const taxable = subtotal - discount_amount - loyalty_discount;
    let tax = 0;
    if (taxable > 1000) {
      tax = Math.round((taxable * 0.12) * 100) / 100;
    }

    let total = subtotal + shipping - discount_amount - loyalty_discount + tax;
    if (total < 1) total = 1;

    const rzpOrder = await createRazorpayOrder(total, `rcpt_${Date.now()}`);

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('first_name, last_name, email, phone')
      .eq('id', user.id)
      .single();

    // NEXT_PUBLIC_RAZORPAY_KEY_ID is the public key safe to send to client
    // RAZORPAY_KEY_SECRET never leaves the server
    return NextResponse.json({
      razorpay_order_id: rzpOrder.id,
      amount: rzpOrder.amount,
      key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID,
      order_summary: { subtotal, shipping, discount_amount, loyalty_discount, tax, total },
      prefill: { 
        name: profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() : '', 
        email: profile?.email || user.email, 
        contact: profile?.phone || '' 
      }
    });

  } catch (error: any) {
    console.error('Create order error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
