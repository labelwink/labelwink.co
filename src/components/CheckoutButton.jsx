"use client";

/**
 * CheckoutButton.jsx
 *
 * Orchestrates the full Razorpay payment flow:
 *   1. POST /api/razorpay/create-order   → get Razorpay order_id
 *   2. Dynamically load Razorpay SDK     → open checkout modal
 *   3. On payment.success                → POST /api/razorpay/verify-payment
 *   4. On verified                       → redirect to /orders/[id]
 *
 * Props:
 *   items           {Array}   — cart items (must include product name, qty, price, image_url from Cloudinary)
 *   totalAmount     {number}  — final payable amount in ₹ (not paise)
 *   subtotal        {number}  — amount before shipping/discount
 *   shippingFee     {number}  — shipping charge
 *   discountAmount  {number}  — discount applied
 *   couponCode      {string}  — coupon code used (optional)
 *   shippingAddress {object}  — { name, line1, line2, city, state, pincode, country }
 *   customerName    {string}
 *   customerEmail   {string}
 *   customerPhone   {string}
 *   onSuccess       {function} — optional callback after confirmed order (receives orderId)
 */

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { loadRazorpay } from "@/lib/loadRazorpay";

export default function CheckoutButton({
  items,
  totalAmount,
  subtotal,
  shippingFee = 0,
  discountAmount = 0,
  couponCode,
  shippingAddress,
  customerName,
  customerEmail,
  customerPhone,
  onSuccess,
}) {
  const router = useRouter();
  const [status, setStatus] = useState("idle"); // idle | loading | verifying | success | error
  const [errorMsg, setErrorMsg] = useState("");
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setUserId(user.id);
    };
    fetchUser();
  }, []);

  const handlePayment = async () => {
    setStatus("loading");
    setErrorMsg("");

    try {
      // ── Step 1: Create a Razorpay order on the backend ──────────────────────
      const createRes = await fetch("/api/razorpay/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: totalAmount, currency: "INR", items, shippingAddress }),
      });

      const createData = await createRes.json();

      if (!createRes.ok) {
        throw new Error(createData.error || "Failed to initiate payment.");
      }

      const { orderId, amount, currency, keyId } = createData;

      // ── Step 2: Load the Razorpay SDK (promise-based, safe on Next.js dev) ──
      const RazorpayConstructor = await loadRazorpay();

      // ── Step 3: Configure and open the checkout modal ───────────────────────
      const options = {
        key: keyId,
        amount,
        currency,
        name: "Your Store Name",
        description: `Order for ${items.length} item(s)`,
        order_id: orderId,
        prefill: {
          name: customerName || "",
          email: customerEmail || "",
          contact: customerPhone || "",
        },
        notes: {
          shipping_address: shippingAddress ? JSON.stringify(shippingAddress) : "",
        },
        theme: {
          color: "#0F6E56",
        },

        handler: async function (response) {
          setStatus("verifying");

          try {
            const verifyRes = await fetch("/api/razorpay/verify-payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
                // Order data
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
              }),
            });

            const verifyData = await verifyRes.json();

            if (!verifyRes.ok) {
              throw new Error(verifyData.error || "Payment verification failed.");
            }

            setStatus("success");

            if (onSuccess) {
              onSuccess(verifyData.orderId);
            } else {
              router.push(`/order-confirmation?order_id=${verifyData.orderId}`);
            }
          } catch (verifyError) {
            console.error("[CheckoutButton] Verify error:", verifyError);
            setStatus("error");
            setErrorMsg(verifyError.message || "Verification failed. Contact support.");
          }
        },

        modal: {
          ondismiss: () => {
            if (status !== "verifying" && status !== "success") {
              setStatus("idle");
              setErrorMsg("Payment was cancelled.");
            }
          },
        },
      };

      const rzp = new RazorpayConstructor(options);

      rzp.on("payment.failed", (response) => {
        console.error("[CheckoutButton] Payment failed:", response.error);
        setStatus("error");
        setErrorMsg(
          response.error?.description || "Payment failed. Please try again."
        );
      });

      rzp.open();
    } catch (err) {
      console.error("[CheckoutButton] Error:", err);
      setStatus("error");
      setErrorMsg(err.message || "Something went wrong. Please try again.");
    }
  };

  const isLoading = status === "loading" || status === "verifying";
  const buttonLabel =
    status === "loading"
      ? "Preparing payment…"
      : status === "verifying"
      ? "Confirming order…"
      : status === "success"
      ? "Order placed!"
      : `Pay ₹${totalAmount?.toLocaleString("en-IN")}`;

  return (
    <div className="flex flex-col gap-2 w-full">
      <button
        onClick={handlePayment}
        disabled={isLoading || status === "success"}
        className={
          `
          w-full py-3 px-6 rounded-lg text-white font-medium text-base
          transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2
          ${
            status === "success"
              ? "bg-[#059669] cursor-default focus:ring-green-500"
              : isLoading
              ? "bg-[#9ca3af] cursor-not-allowed"
              : "bg-[#1B3A2D] hover:bg-[#173129] active:scale-[0.98] focus:ring-[#1B3A2D]"
          }
        `
        }
      >
        {isLoading && (
          <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2 align-middle" />
        )}
        {buttonLabel}
      </button>

      {status === "error" && errorMsg && (
        <p className="text-sm text-red-600 text-center">{errorMsg}</p>
      )}

      {status === "idle" && (
        <p className="text-xs text-gray-400 text-center">
          Secured by Razorpay · UPI, Cards, NetBanking accepted
        </p>
      )}
    </div>
  );
}
