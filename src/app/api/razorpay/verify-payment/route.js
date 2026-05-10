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

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
    } = body;

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

    // ── 4. Insert confirmed order into Supabase ───────────────────────────────
    const { data: order, error: insertError } = await supabaseAdmin
      .from("orders")
      .insert({
        user_id: user.id,
        status: "confirmed",
        payment_status: "paid",
        payment_method: "razorpay",
        razorpay_order_id: razorpayOrderId,
        razorpay_payment_id: razorpayPaymentId,
        razorpay_signature: razorpaySignature,
        items,                // JSONB snapshot of cart items (includes Cloudinary image URLs)
        total: totalAmount,
        subtotal: subtotal ?? totalAmount,
        shipping_fee: shippingFee ?? 0,
        discount_amount: discountAmount ?? 0,
        coupon_code: couponCode ?? null,
        shipping_address: shippingAddress,
        customer_name: customerName ?? user.email,
        customer_email: customerEmail ?? user.email,
        customer_phone: customerPhone ?? null,
      })
      .select("id, status, total")
      .single();

    if (insertError) {
      console.error("[verify-payment] Supabase insert error:", insertError);
      return NextResponse.json(
        { error: "Payment verified but failed to save order. Contact support." },
        { status: 500 }
      );
    }

    // Send Telegram alert for new order
    try {
      await sendTelegramMessage(
        `🛒 <b>New Order Placed</b>\n` +
        `💰 Total: ₹${order.total}\n` +
        `👤 Customer: ${customerName || user.email}\n` +
        `📦 Items: ${items.length}\n` +
        `🆔 Order ID: <code>${order.id}</code>`
      )
    } catch (alertError) {
      console.error('[verify-payment] Telegram alert failed:', alertError)
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

    // ── 5. Return success ─────────────────────────────────────────────────────
    return NextResponse.json({
      success: true,
      orderId: order.id,
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
