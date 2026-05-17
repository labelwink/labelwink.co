/**
 * /src/app/api/razorpay/verify-payment/route.js
 *
 * Verifies the Razorpay HMAC-SHA256 signature.
 * On success → inserts a confirmed order into Supabase using the service role key.
 * On failure → returns 400, no order is saved.
 *
 * Required env vars:
 *   RAZORPAY_KEY_SECRET       — used to compute expected signature
 *   SUPABASE_SERVICE_ROLE_KEY — bypasses RLS for server-side inserts
 *   NEXT_PUBLIC_SUPABASE_URL  — Supabase project URL
 */

import crypto from "crypto";
import { NextResponse } from "next/server";
import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

import { sendTelegramMessage } from "@/lib/telegram";
import { sendOrderConfirmationEmail } from "@/lib/email";

// Service-role client — bypasses RLS, only use server-side
const supabaseAdmin = createSupabaseAdmin(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

export async function POST(request) {
  try {
    // ── 1. Authenticate the user ──────────────────────────────────────────────
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError) {
      console.warn("[verify-payment] Session check error (non-fatal if userId passed):", authError);
    }

    // ── 2. Parse the request body ─────────────────────────────────────────────
    const body = await request.json();
    const {
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      // Order data to persist
      items,
      totalAmount,
      subtotal,
      shippingFee,
      discountAmount,
      couponCode,
      shippingAddress,
      customerName,
      customerEmail,
      customerPhone,
      userId,
    } = body;

    // Determine the user ID (session user preferred, but fallback to passed userId)
    const finalUserId = user?.id || userId;

    if (!finalUserId) {
      return NextResponse.json({ error: "Unauthorized or missing User ID" }, { status: 401 });
    }

    // Validate required payment fields
    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return NextResponse.json(
        { error: "Missing payment verification fields." },
        { status: 400 }
      );
    }

    // ── 3. Verify HMAC-SHA256 signature ───────────────────────────────────────
    // Razorpay's spec: HMAC_SHA256(order_id + "|" + payment_id, key_secret)
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest("hex");

    const isValid = crypto.timingSafeEqual(
      Buffer.from(expectedSignature, "hex"),
      Buffer.from(razorpaySignature, "hex")
    );

    if (!isValid) {
      console.warn(
        "[verify-payment] Signature mismatch for order:",
        razorpayOrderId
      );
      return NextResponse.json(
        { error: "Payment verification failed. Invalid signature." },
        { status: 400 }
      );
    }

    console.log("[verify-payment] Inserting order payload:", JSON.stringify({
      items,
      total_amount: totalAmount,
      subtotal,
      shipping_amount: shippingFee,
      discount_amount: discountAmount,
      coupon_code: couponCode,
      customer_name: customerName,
      customer_email: customerEmail,
      customer_phone: customerPhone,
      user_id: finalUserId,
      razorpay_order_id: razorpayOrderId,
      razorpay_payment_id: razorpayPaymentId,
      razorpay_signature: razorpaySignature
    }, null, 2));

    // ── 4. Insert confirmed order into Supabase ───────────────────────────────
    const { data: order, error: insertError } = await supabaseAdmin
      .from("orders")
      .insert({
        user_id: finalUserId,
        status: "confirmed",
        payment_status: "paid",
        payment_method: "razorpay",
        razorpay_order_id: razorpayOrderId,
        razorpay_payment_id: razorpayPaymentId,
        razorpay_signature: razorpaySignature,
        items,                // JSONB snapshot of cart items (includes Cloudinary image URLs)
        total_amount: totalAmount,
        subtotal: subtotal ?? totalAmount,
        shipping_amount: shippingFee ?? 0,
        discount_amount: discountAmount ?? 0,
        coupon_code: couponCode ?? null,
        shipping_address: shippingAddress,
        customer_name: customerName ?? customerEmail ?? "Customer",
        customer_email: customerEmail,
        customer_phone: customerPhone ?? null,
      })
      .select("id, order_number, invoice_number, status, total_amount, subtotal, shipping_amount, discount_amount, items, customer_name, customer_email, customer_phone, shipping_address, created_at")
      .single();

    if (insertError) {
      console.error("[verify-payment] Supabase insert error:", insertError);
      return NextResponse.json(
        { error: "Payment verified but failed to save order. Contact support." },
        { status: 500 }
      );
    }

    // ── 4b. Decrement Stock and Trigger Stock Alerts ──────────────────────────
    try {
      const itemsList = Array.isArray(items) ? items : [];
      for (const item of itemsList) {
        const variantId = item.variant_id || item.variantId || item.id;
        if (!variantId) continue;

        // Fetch current variant details
        const { data: variant, error: fetchErr } = await supabaseAdmin
          .from('product_variants')
          .select('product_id, stock_qty, low_stock_threshold, size, products(name)')
          .eq('id', variantId)
          .single();

        if (fetchErr || !variant) {
          console.warn("[verify-payment] Variant not found for stock decrement. Variant ID:", variantId, "Error:", fetchErr?.message);
          continue;
        }

        const prevQty = variant.stock_qty || 0;
        const newQty = Math.max(0, prevQty - (item.quantity || 1));

        // Update the variant
        const { error: updErr } = await supabaseAdmin
          .from('product_variants')
          .update({ stock_qty: newQty })
          .eq('id', variantId);

        if (updErr) {
          console.error("[verify-payment] Failed to update stock for variant. Variant ID:", variantId, "Error:", updErr.message);
          continue;
        }

        // Log adjustment
        try {
          await supabaseAdmin
            .from('inventory_adjustments')
            .insert({
              product_id: variant.product_id || item.product_id,
              variant_id: variantId,
              previous_qty: prevQty,
              new_qty: newQty,
              adjustment: -(item.quantity || 1),
              reason: `Order Placement #${order.order_number || order.id.slice(0, 8).toUpperCase()}`,
              adjusted_by: 'system'
            });
        } catch (logErr) {
          console.error('[verify-payment] Failed to log adjustment:', logErr);
        }

        // Handle Stock Alerts
        const pName = (variant.products && !Array.isArray(variant.products)) ? variant.products.name : (item.product_name || item.name || 'Product');
        const threshold = variant.low_stock_threshold !== null && variant.low_stock_threshold !== undefined
          ? variant.low_stock_threshold
          : 5;

        // Out of Stock
        if (newQty === 0 && prevQty > 0) {
          try {
            await supabaseAdmin.from('admin_notifications').insert({
              type: 'out_of_stock',
              title: 'Out of Stock Alert',
              message: `Variant ${variant.size || ''} of product "${pName}" is now out of stock!`,
              metadata: { variant_id: variantId, product_id: variant.product_id || item.product_id }
            });
          } catch (err) {
            console.error('[verify-payment] Out of stock notification insert failed:', err);
          }

          try {
            const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://labelwink.co';
            const msg = `⚠️ <b>Out of Stock Alert</b>\n📦 ${pName} (Size: ${variant.size || ''}) is now out of stock!\n👉 <a href="${SITE_URL}/admin/inventory">Restock Now</a>`;
            await sendTelegramMessage(msg);
          } catch (err) {
            console.error('[verify-payment] Out of stock Telegram alert failed:', err);
          }
        }
        // Low Stock
        else if (newQty <= threshold && prevQty > threshold) {
          try {
            await supabaseAdmin.from('admin_notifications').insert({
              type: 'low_stock',
              title: 'Low Stock Alert',
              message: `Variant ${variant.size || ''} of product "${pName}" is low on stock (${newQty} left).`,
              metadata: { variant_id: variantId, product_id: variant.product_id || item.product_id, current_stock: newQty }
            });
          } catch (err) {
            console.error('[verify-payment] Low stock notification insert failed:', err);
          }

          try {
            const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://labelwink.co';
            const msg = `⚠️ <b>Low Stock Alert</b>\n📦 ${pName} (Size: ${variant.size || ''}) is low on stock (${newQty} left)!\n👉 <a href="${SITE_URL}/admin/inventory">Restock Now</a>`;
            await sendTelegramMessage(msg);
          } catch (err) {
            console.error('[verify-payment] Low stock Telegram alert failed:', err);
          }
        }
      }
    } catch (stockErr) {
      console.error('[verify-payment] Critical stock update routine error:', stockErr);
    }

    // ── 4c. Update Coupon Usage ───────────────────────────────────────────────
    if (couponCode) {
      try {
        const upperCoupon = couponCode.trim().toUpperCase();
        const { data: discount, error: discFetchError } = await supabaseAdmin
          .from('discount_codes')
          .select('id, used_count, usage_count')
          .eq('code', upperCoupon)
          .single();

        if (discount && !discFetchError) {
          const newUsedCount = (discount.used_count || 0) + 1;
          const newUsageCount = (discount.usage_count || 0) + 1;

          await supabaseAdmin
            .from('discount_codes')
            .update({
              used_count: newUsedCount,
              usage_count: newUsageCount
            })
            .eq('id', discount.id);

          await supabaseAdmin
            .from('discount_code_uses')
            .insert({
              discount_code_id: discount.id,
              user_id: finalUserId,
              order_id: order.id
            });

          console.log(`[verify-payment] Successfully recorded coupon usage for code: ${upperCoupon}`);
        } else {
          console.warn("[verify-payment] Coupon not found or error. Code:", upperCoupon, "Error:", discFetchError?.message);
        }
      } catch (couponUseErr) {
        console.error('[verify-payment] Non-fatal coupon usage tracking error:', couponUseErr);
      }
    }

    // Send Telegram alert for new order
    try {
      await sendTelegramMessage(
        `🛒 <b>New Order Placed</b>\n` +
        `💰 Total: ₹${order.total_amount}\n` +
        `👤 Customer: ${customerName || customerEmail}\n` +
        `📦 Items: ${items.length}\n` +
        `🆔 Order ID: <code>${order.id}</code>`
      )
    } catch (alertError) {
      console.error('[verify-payment] Telegram alert failed:', alertError)
    }

    // Insert admin notification
    try {
      await supabaseAdmin.from('admin_notifications').insert({
        type: 'new_order',
        title: `New Order Placed — #${order.order_number || order.id.slice(0, 8).toUpperCase()}`,
        message: `Order for ₹${order.total_amount} placed by ${customerName || customerEmail}`,
        metadata: { order_id: order.id, order_number: order.order_number }
      });
    } catch (notifErr) {
      console.error('[verify-payment] Notification failed:', notifErr);
    }

    // Insert customer storefront notification
    try {
      await supabaseAdmin.from('notifications').insert({
        user_id: finalUserId,
        type: 'order_confirmed',
        title: 'Order Confirmed! ✅',
        message: `Your order #${order.order_number || order.id.slice(0, 8).toUpperCase()} has been successfully confirmed.`,
        data: { order_id: order.id, order_number: order.order_number }
      });
    } catch (custNotifErr) {
      console.error('[verify-payment] Customer storefront notification failed:', custNotifErr);
    }

    // Create Shiprocket order — failure must NOT block payment response
    try {
      const { createShiprocketOrder } = await import('@/lib/shiprocket')
      const shiprocketResult = await createShiprocketOrder(order)
      
      const shiprocketOrderId = shiprocketResult?.order_id || 
                                shiprocketResult?.data?.order_id || null
      const shiprocketShipmentId = shiprocketResult?.shipment_id || 
                                   shiprocketResult?.data?.shipment_id || null

      if (shiprocketOrderId) {
        await supabaseAdmin
          .from('orders')
          .update({
            shiprocket_order_id: String(shiprocketOrderId),
            shiprocket_shipment_id: shiprocketShipmentId 
              ? String(shiprocketShipmentId) 
              : null,
            fulfillment_status: 'pending_pickup',
          })
          .eq('id', order.id)
        
        console.log('[verify-payment] Shiprocket order created:', shiprocketOrderId)
      } else {
        console.warn('[verify-payment] Shiprocket returned no order_id:', 
          JSON.stringify(shiprocketResult))
      }
    } catch (shiprocketError) {
      // Log but never fail payment — customer paid successfully
      console.error('[verify-payment] Shiprocket failed (non-fatal):', 
        shiprocketError)
    }

    // ── 5. Send Email Confirmation ───────────────────────────────────────────
    try {
      await sendOrderConfirmationEmail({
        to: order.customer_email,
        customerName: order.customer_name,
        orderNumber: order.order_number,
        invoiceNumber: order.invoice_number,
        items: order.items,
        totalAmount: order.total_amount,
        deliveryAddress: order.shipping_address,
      });
    } catch (emailError) {
      console.error('[verify-payment] Email notification failed:', emailError);
    }

    // ── 5. Return success ─────────────────────────────────────────────────────
    return NextResponse.json({
      success: true,
      orderId: order.order_number || order.id,
      message: "Payment verified and order confirmed.",
    });
  } catch (error) {
    console.error("[verify-payment] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error during payment verification." },
      { status: 500 }
    );
  }
}
