/**
 * /src/app/api/razorpay/create-order/route.js
 *
 * Creates a pending Razorpay order and returns the order_id to the frontend.
 * The actual Supabase order row is NOT created here — only after payment is verified.
 *
 * Required env vars:
 *   RAZORPAY_KEY_ID        — your Razorpay key id (server-only, no NEXT_PUBLIC_)
 *   RAZORPAY_KEY_SECRET    — your Razorpay key secret (server-only)
 */

import Razorpay from "razorpay";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";


const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

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

    // ── 2. Parse & validate the request body ──────────────────────────────────
    const body = await request.json();
    const { amount, currency = "INR", items, shippingAddress } = body;

    if (!amount || typeof amount !== "number" || amount <= 0) {
      return NextResponse.json(
        { error: "Invalid amount. Must be a positive number." },
        { status: 400 }
      );
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Cart items are required." },
        { status: 400 }
      );
    }

    // ── 3. Create a Razorpay order ────────────────────────────────────────────
    // amount must be in the smallest currency unit (paise for INR)
    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(amount * 100), // convert ₹ → paise
      currency,
      receipt: `receipt_${user.id}_${Date.now()}`,
      notes: {
        user_id: user.id,
        user_email: user.email,
      },
    });

    // ── 4. Return order details to the frontend ───────────────────────────────
    return NextResponse.json({
      orderId: razorpayOrder.id,        // e.g. "order_XXXXXXXXXXXXXXXXXX"
      amount: razorpayOrder.amount,     // in paise
      currency: razorpayOrder.currency,
      keyId: process.env.RAZORPAY_KEY_ID, // safe to expose — it's the key_id not secret
    });
  } catch (error) {
    console.error("[create-order] Error:", error);
    return NextResponse.json(
      { error: "Failed to create Razorpay order. Please try again." },
      { status: 500 }
    );
  }
}
