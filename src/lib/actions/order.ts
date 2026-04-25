'use server';

import { createAdminClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import Razorpay from 'razorpay';

interface CheckoutData {
  userId?: string;
  items: any[];
  subtotal: number;
  couponCode?: string;
  address: any;
  paymentMethod: 'razorpay' | 'cod';
}

export async function createOrder(checkoutData: CheckoutData) {
  const supabase = createAdminClient();
  const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
  });

  // 1. Verify stock for all items
  for (const item of checkoutData.items) {
    const { data: variant } = await supabase
      .from('product_variants')
      .select('stock_qty')
      .eq('id', item.variantId)
      .single();
    
    if (!variant || variant.stock_qty < item.quantity) {
      return { error: `${item.name} is out of stock` };
    }
  }

  // 2. Fetch site settings for threshold
  const { data: thresholdSetting } = await supabase
    .from('site_settings')
    .select('value')
    .eq('key', 'free_shipping_threshold')
    .single();
  
  const threshold = thresholdSetting?.value?.amount || 999;
  let shippingFee = checkoutData.subtotal >= threshold ? 0 : 99;
  let discountAmount = 0;

  // 3. Validate coupon if applied
  if (checkoutData.couponCode) {
    const { data: coupon } = await supabase
      .from('coupons')
      .select('*')
      .eq('code', checkoutData.couponCode.toUpperCase())
      .eq('is_active', true)
      .single();
    
    if (coupon) {
      if (coupon.type === 'percentage') discountAmount = (checkoutData.subtotal * Number(coupon.value)) / 100;
      if (coupon.type === 'fixed_amount') discountAmount = Number(coupon.value);
      if (coupon.type === 'free_shipping') shippingFee = 0;
    }
  }

  const total = checkoutData.subtotal - discountAmount + shippingFee;

  // 4. Handle COD
  if (checkoutData.paymentMethod === 'cod') {
    const { data: order, error } = await supabase
      .from('orders')
      .insert({
        user_id: checkoutData.userId,
        payment_method: 'cod',
        payment_status: 'pending',
        shipping_address: checkoutData.address,
        subtotal: checkoutData.subtotal,
        discount_amount: discountAmount,
        coupon_code: checkoutData.couponCode,
        shipping_fee: shippingFee,
        total,
        status: 'pending',
      })
      .select()
      .single();

    if (error) return { error: error.message };
    
    // In a real app, you'd insert order items here too.
    // Reducing stock
    for (const item of checkoutData.items) {
      await supabase.rpc('reduce_stock', { var_id: item.variantId, qty: item.quantity });
    }

    revalidatePath('/admin/orders');
    return { success: true, orderId: order.id, orderNumber: order.order_number, isCOD: true };
  }

  // 5. Handle Razorpay
  const razorpayOrder = await razorpay.orders.create({
    amount: Math.round(total * 100), // in paise
    currency: 'INR',
    receipt: `lw-${Date.now()}`,
  });

  const { data: order } = await supabase
    .from('orders')
    .insert({
      user_id: checkoutData.userId,
      payment_method: 'razorpay',
      payment_status: 'pending',
      razorpay_order_id: razorpayOrder.id,
      shipping_address: checkoutData.address,
      subtotal: checkoutData.subtotal,
      discount_amount: discountAmount,
      coupon_code: checkoutData.couponCode,
      shipping_fee: shippingFee,
      total,
      status: 'pending',
    })
    .select()
    .single();

  return {
    success: true,
    razorpayOrderId: razorpayOrder.id,
    razorpayKeyId: process.env.RAZORPAY_KEY_ID,
    orderId: order!.id,
    amount: razorpayOrder.amount,
    currency: 'INR',
  };
}
