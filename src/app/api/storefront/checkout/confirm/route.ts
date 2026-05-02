import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { verifyRazorpaySignature } from '@/lib/razorpay';
import { sendOrderConfirmationEmail } from '@/lib/brevo';
import { sendNewOrderAlert } from '@/lib/telegram';
import { sendOrderPlacedSMS } from '@/lib/sms-notifications';

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature, address_id, shipping_method, coupon_code, use_loyalty_points, cart_items } = body;

    const valid = verifyRazorpaySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature);
    if (!valid) {
      return NextResponse.json({ error: 'Payment verification failed. Please contact support.' }, { status: 400 });
    }

    const supabaseAdmin = createAdminClient();

    const { data: address } = await supabaseAdmin.from('addresses').select('*').eq('id', address_id).single();
    const { data: profile } = await supabaseAdmin.from('profiles').select('*').eq('id', user.id).single();
    const { data: settings } = await supabaseAdmin.from('shop_settings').select('*').single();

    let subtotal = 0;
    const orderItemsToInsert = [];
    
    for (const item of cart_items) {
      const { data: product } = await supabaseAdmin.from('products').select('name, price, stock_qty, images, sku').eq('id', item.product_id).single();
      const { data: variant } = await supabaseAdmin.from('product_variants').select('price, sku, stock_qty').eq('product_id', item.product_id).eq('size', item.size || '').maybeSingle();
      
      const price = variant?.price || product?.price || 0;
      const sku = variant?.sku || product?.sku || '';
      const image = product?.images?.[0] || '';
      const name = product?.name || 'Unknown Product';
      
      subtotal += price * item.quantity;
      
      orderItemsToInsert.push({
        product_name: name,
        product_image: image,
        size: item.size,
        color: item.color || null,
        sku: sku,
        quantity: item.quantity,
        unit_price: price,
        total_price: price * item.quantity,
      });
    }

    const freeShippingThreshold = settings?.free_shipping_threshold ?? 999;
    const standardCharge = settings?.standard_shipping_charge ?? 79;
    const expressCharge = settings?.express_shipping_charge ?? 149;
    const redemptionRatio = settings?.loyalty_redemption_ratio ?? 100;
    
    let shipping = subtotal < freeShippingThreshold ? (shipping_method === 'express' ? expressCharge : standardCharge) : 0;
    
    let discount_amount = 0;
    let discountCodeId = null;
    if (coupon_code) {
      const { data: dc } = await supabaseAdmin.from('discount_codes').select('*').eq('code', coupon_code.toUpperCase()).single();
      if (dc) {
        discountCodeId = dc.id;
        if (dc.type === 'percentage') discount_amount = Math.round((subtotal * dc.value) / 100);
        else if (dc.type === 'flat') discount_amount = Math.min(dc.value, subtotal);
        else if (dc.type === 'free_shipping') shipping = 0;
      }
    }

    let loyalty_discount = 0;
    let pointsUsed = 0;
    if (use_loyalty_points) {
      const { data: loyalty } = await supabaseAdmin.from('loyalty_points').select('balance').eq('user_id', user.id).single();
      if (loyalty && loyalty.balance > 0) {
        pointsUsed = loyalty.balance;
        loyalty_discount = Math.floor(loyalty.balance / redemptionRatio);
      }
    }

    const currentTotalBeforeLoyalty = subtotal + shipping - discount_amount;
    if (loyalty_discount > currentTotalBeforeLoyalty - 1) {
      loyalty_discount = currentTotalBeforeLoyalty - 1;
      pointsUsed = loyalty_discount * redemptionRatio;
    }
    if (loyalty_discount < 0) { loyalty_discount = 0; pointsUsed = 0; }

    const taxable = subtotal - discount_amount - loyalty_discount;
    let tax = 0;
    if (taxable > 1000) tax = Math.round((taxable * 0.12) * 100) / 100;

    let total = subtotal + shipping - discount_amount - loyalty_discount + tax;
    if (total < 1) total = 1;

    const { data: newOrder, error: orderError } = await supabaseAdmin.from('orders').insert({
      user_id: user.id,
      status: 'pending',
      payment_status: 'paid',
      subtotal,
      shipping_amount: shipping,
      discount_amount,
      loyalty_points_used: pointsUsed,
      tax_amount: tax,
      total,
      coupon_code: coupon_code ? coupon_code.toUpperCase() : null,
      shipping_method,
      customer_name: `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim(),
      customer_email: profile?.email || user.email,
      customer_phone: profile?.phone || '',
      shipping_address: address,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    }).select('id, customer_name, customer_email, customer_phone, total, subtotal, shipping_amount, discount_amount, tax_amount, razorpay_payment_id, shipping_address').single();

    if (orderError || !newOrder) {
      console.error('Order creation error:', orderError);
      return NextResponse.json({ error: 'Failed to create order record' }, { status: 500 });
    }

    const itemsWithOrderId = orderItemsToInsert.map(item => ({ ...item, order_id: newOrder.id }));
    await supabaseAdmin.from('order_items').insert(itemsWithOrderId);

    // 9. Fetch invoice FIRST so we can include it in emails/alerts
    let invoice_number = null;
    const { data: inv } = await supabaseAdmin.from('invoices').select('invoice_number').eq('order_id', newOrder.id).maybeSingle();
    if (inv) invoice_number = inv.invoice_number;
    else {
      await new Promise(r => setTimeout(r, 500));
      const { data: invRetry } = await supabaseAdmin.from('invoices').select('invoice_number').eq('order_id', newOrder.id).maybeSingle();
      if (invRetry) invoice_number = invRetry.invoice_number;
    }

    const postActions = [];

    if (pointsUsed > 0) {
      postActions.push((async () => {
        const { data: lp } = await supabaseAdmin.from('loyalty_points').select('balance').eq('user_id', user.id).single();
        if (lp) {
          await supabaseAdmin.from('loyalty_points').update({ balance: lp.balance - pointsUsed, updated_at: new Date().toISOString() }).eq('user_id', user.id);
          await supabaseAdmin.from('loyalty_transactions').insert({ user_id: user.id, points: -pointsUsed, type: 'redeem', order_id: newOrder.id });
        }
      })());
    }

    if (settings?.loyalty_enabled) {
      const earned = Math.floor(subtotal * (settings.loyalty_points_per_rupee || 0.1));
      if (earned > 0) {
        postActions.push((async () => {
          const { data: lp } = await supabaseAdmin.from('loyalty_points').select('balance, lifetime_earned').eq('user_id', user.id).maybeSingle();
          if (lp) {
            await supabaseAdmin.from('loyalty_points').update({ balance: lp.balance + earned, lifetime_earned: (lp.lifetime_earned || 0) + earned, updated_at: new Date().toISOString() }).eq('user_id', user.id);
          } else {
            await supabaseAdmin.from('loyalty_points').insert({ user_id: user.id, balance: earned, lifetime_earned: earned });
          }
          await supabaseAdmin.from('loyalty_transactions').insert({ user_id: user.id, points: earned, type: 'earn', order_id: newOrder.id });
        })());
      }
    }

    if (discountCodeId) {
      postActions.push((async () => {
        const { data: dc } = await supabaseAdmin.from('discount_codes').select('used_count').eq('id', discountCodeId).single();
        if (dc) {
          await supabaseAdmin.from('discount_codes').update({ used_count: (dc.used_count || 0) + 1 }).eq('id', discountCodeId);
          await supabaseAdmin.from('discount_code_uses').insert({ discount_code_id: discountCodeId, user_id: user.id, order_id: newOrder.id });
        }
      })());
    }

    postActions.push(
      supabaseAdmin.from('admin_notifications').insert({
        type: 'new_order',
        title: 'New Order Received',
        body: `Order for ₹${total} from ${profile?.first_name || ''}`,
        entity_type: 'order',
        entity_id: newOrder.id
      })
    );

    const fullOrderData = {
      order_id: newOrder.id,
      invoice_number: invoice_number || `INV-PENDING`,
      customer_name: newOrder.customer_name,
      customer_phone: newOrder.customer_phone,
      customer_email: newOrder.customer_email,
      total: newOrder.total,
      subtotal: newOrder.subtotal,
      shipping_amount: newOrder.shipping_amount,
      discount_amount: newOrder.discount_amount,
      tax_amount: newOrder.tax_amount,
      razorpay_payment_id: newOrder.razorpay_payment_id,
      shipping_address: address,
      items: orderItemsToInsert
    };

    postActions.push(sendOrderConfirmationEmail(fullOrderData).catch(e => console.error("Email failed", e)));
    postActions.push(sendNewOrderAlert(fullOrderData).catch(e => console.error("Telegram failed", e)));
    if (newOrder.customer_phone) {
      postActions.push(sendOrderPlacedSMS(newOrder.customer_phone, {
        customer_name: newOrder.customer_name,
        order_id: newOrder.id,
        invoice_number: invoice_number || `INV-PENDING`,
        total: newOrder.total,
        store_name: settings?.store_name || 'LabelWink'
      }));
    }

    await Promise.allSettled(postActions);

    return NextResponse.json({ success: true, order_id: newOrder.id, invoice_number, total });

  } catch (error: any) {
    console.error('Confirm order error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
