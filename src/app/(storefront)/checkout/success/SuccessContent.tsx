'use client';

import { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  CheckCircle2, ShoppingBag, Share2, Package, Phone, Truck, Gift
} from 'lucide-react';

// ── Mini confetti ──────────────────────────────────────────────────────────────
function Confetti() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;

    const COLORS  = ['#016a6e', '#c9a84c', '#f8f5f0', '#1a3a34', '#e2d9cc'];
    const PIECES  = 80;
    let running   = true;

    interface Piece {
      x: number; y: number; size: number; color: string;
      vx: number; vy: number; rotation: number; vr: number; shape: 'rect' | 'circle';
    }

    const pieces: Piece[] = Array.from({ length: PIECES }, () => ({
      x:        Math.random() * canvas.width,
      y:        -20 - Math.random() * 100,
      size:     6 + Math.random() * 8,
      color:    COLORS[Math.floor(Math.random() * COLORS.length)],
      vx:       (Math.random() - 0.5) * 2,
      vy:       2 + Math.random() * 3,
      rotation: Math.random() * Math.PI * 2,
      vr:       (Math.random() - 0.5) * 0.2,
      shape:    Math.random() > 0.5 ? 'rect' : 'circle',
    }));

    function draw() {
      if (!running || !ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      pieces.forEach(p => {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = 0.85;
        if (p.shape === 'circle') {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        }
        ctx.restore();
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.vr;
        if (p.y > canvas.height + 20) {
          p.y = -20;
          p.x = Math.random() * canvas.width;
        }
      });
      requestAnimationFrame(draw);
    }
    draw();
    // Stop after 3s
    const t = setTimeout(() => { running = false; ctx.clearRect(0, 0, canvas.width, canvas.height); }, 3000);
    return () => { running = false; clearTimeout(t); };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-50"
      aria-hidden="true"
    />
  );
}

// ── Order card info ────────────────────────────────────────────────────────────
interface OrderItem {
  id: string;
  quantity: number;
  price_at_purchase?: number;
  price?: number;
  variant_size?: string;
  variant_color?: string | null;
  product_name?: string;
  size?: string;
  color?: string | null;
  products: { name: string; slug: string } | null;
}

interface OrderInfo {
  id: string;
  order_number?: string | null;
  status: string;
  total: number;
  subtotal: number;
  shipping_amount?: number;
  shipping_fee?: number;
  discount_amount: number;
  customer_name: string | null;
  customer_phone: string | null;
  shipping_address: Record<string, string> | null;
  order_items: OrderItem[];
}

// ── Points earned helper ───────────────────────────────────────────────────────
function pointsEarned(total: number) {
  return Math.floor(total);
}

export default function SuccessContent() {
  const searchParams = useSearchParams();
  const orderId   = searchParams.get('orderId');
  const paymentId = searchParams.get('paymentId');
  const verified  = searchParams.get('verified') === '1';

  const [order, setOrder] = useState<OrderInfo | null>(null);
  const [showConfetti, setShowConfetti] = useState(true);

  useEffect(() => {
    if (!orderId) return;
    fetch(`/api/storefront/orders/${orderId}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setOrder(d); });
    // Hide confetti after 3.5s
    const t = setTimeout(() => setShowConfetti(false), 3500);
    return () => clearTimeout(t);
  }, [orderId]);

  const shortId  = order?.order_number || (orderId ? orderId.slice(0, 8).toUpperCase() : '—');
  const pts      = order ? pointsEarned(order.total) : null;
  const addr     = (order?.shipping_address as any) || {};

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'I just shopped at Label Wink! 🛍️',
        text: `Just placed an order at Label Wink — handcrafted boutique fashion ✨`,
        url: 'https://labelwink.com',
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText('https://labelwink.com').then(() => alert('Link copied!'));
    }
  };

  return (
    <div className="min-h-screen bg-[#faf8f5]">
      {showConfetti && <Confetti />}

      <div className="container mx-auto px-4 py-12 max-w-3xl">

        {/* ── Hero ── */}
        <div className="text-center mb-10">
          <div className="relative inline-flex mb-6">
            <div className="w-24 h-24 bg-[#016a6e]/10 rounded-full flex items-center justify-center animate-in zoom-in-50 duration-500">
              <CheckCircle2 className="w-14 h-14 text-[#016a6e]" strokeWidth={1.5} />
            </div>
            <span className="absolute -top-1 -right-1 text-3xl">🎉</span>
          </div>
          <h1 className="font-heading text-4xl md:text-5xl font-semibold text-[#1a3a34] mb-3">
            Order Confirmed!
          </h1>
          <p className="text-base text-[#1a3a34]/60 max-w-md mx-auto leading-relaxed">
            Thank you for shopping with <span className="font-semibold text-[#1a3a34]">Label Wink</span>.{' '}
            Your order <span className="font-mono font-bold text-[#016a6e]">#{shortId}</span> has been received and is being processed.
          </p>
          {paymentId && (
            <p className="mt-2 text-xs text-[#1a3a34]/40 font-mono">Payment: {paymentId}</p>
          )}
          {verified && (
            <div className="mt-3 inline-flex items-center gap-1.5 bg-green-50 border border-green-200 text-green-700 text-xs font-semibold px-3 py-1.5 rounded-full">
              <CheckCircle2 className="w-3.5 h-3.5" /> Payment Verified
            </div>
          )}
        </div>

        {/* ── Loyalty points banner ── */}
        {pts !== null && (
          <div className="bg-gradient-to-r from-[#c9a84c]/20 to-[#016a6e]/10 border border-[#c9a84c]/30 rounded-2xl p-5 mb-6 flex items-center gap-4 animate-in slide-in-from-bottom-4 duration-500 delay-150">
            <div className="w-12 h-12 bg-[#c9a84c]/20 rounded-full flex items-center justify-center flex-shrink-0">
              <Gift className="w-6 h-6 text-[#c9a84c]" />
            </div>
            <div>
              <p className="font-bold text-sm text-[#1a3a34]">
                🌟 You&apos;ll earn <span className="text-[#c9a84c]">{pts.toLocaleString('en-IN')} Wink Points</span> when your order is delivered!
              </p>
              <p className="text-xs text-[#1a3a34]/60 mt-0.5">Points are credited automatically on delivery. Use them for future discounts.</p>
            </div>
          </div>
        )}

        <div className="grid md:grid-cols-5 gap-6">

          {/* ── Order summary ── */}
          {order && (
            <div className="md:col-span-3 bg-white border border-[#e2d9cc] rounded-2xl overflow-hidden shadow-sm">
              <div className="bg-[#1a3a34]/5 px-6 py-4 border-b border-[#e2d9cc]">
                <h2 className="font-semibold text-[#1a3a34] flex items-center gap-2">
                  <Package className="w-4 h-4" /> Order Summary
                </h2>
              </div>
              <div className="divide-y divide-[#e2d9cc]/60">
                {order.order_items?.map(item => {
                  const itemPrice = item.price_at_purchase ?? item.price ?? 0;
                  const itemSize  = item.variant_size  || item.size  || '—';
                  const itemColor = item.variant_color || item.color || null;
                  const itemName  = item.product_name  || item.products?.name || 'Item';
                  return (
                    <div key={item.id} className="px-6 py-4 flex justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-[#1a3a34]">{itemName}</p>
                        <p className="text-xs text-[#1a3a34]/50 mt-0.5">
                          Size: {itemSize}{itemColor ? ` · ${itemColor}` : ''} · Qty: {item.quantity}
                        </p>
                      </div>
                      <p className="text-sm font-bold text-[#1a3a34] flex-shrink-0">
                        ₹{(Number(itemPrice) * item.quantity).toLocaleString('en-IN')}
                      </p>
                    </div>
                  );
                })}
              </div>
              <div className="px-6 py-4 border-t border-[#e2d9cc] bg-[#faf8f5] space-y-2 text-sm">
                <div className="flex justify-between text-[#1a3a34]/60">
                  <span>Subtotal</span>
                  <span>₹{Number(order.subtotal || 0).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-[#1a3a34]/60">
                  <span>Shipping</span>
                  <span className={Number(order.shipping_amount || order.shipping_fee || 0) === 0 ? 'text-[#016a6e] font-semibold' : ''}>
                    {Number(order.shipping_amount || order.shipping_fee || 0) === 0 ? 'FREE' : `₹${Number(order.shipping_amount || order.shipping_fee).toLocaleString('en-IN')}`}
                  </span>
                </div>
                {(order.discount_amount || 0) > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span>−₹{Number(order.discount_amount).toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-base text-[#1a3a34] pt-2 border-t border-[#e2d9cc]">
                  <span>Total Paid</span>
                  <span>₹{Number(order.total || 0).toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>
          )}

          {/* ── Right col ── */}
          <div className="md:col-span-2 space-y-5">

            {/* Delivery address */}
            {order?.shipping_address && (
              <div className="bg-white border border-[#e2d9cc] rounded-2xl p-5">
                <h3 className="font-semibold text-[#1a3a34] text-sm flex items-center gap-2 mb-3">
                  <Truck className="w-4 h-4 text-[#016a6e]" /> Delivering To
                </h3>
                <p className="text-sm font-semibold text-[#1a3a34]">{addr.fullName || order.customer_name}</p>
                <p className="text-xs text-[#1a3a34]/60 mt-0.5">{addr.address || addr.line1}</p>
                <p className="text-xs text-[#1a3a34]/60">{[addr.city, addr.state, addr.pincode].filter(Boolean).join(', ')}</p>
                {(addr.phone || order.customer_phone) && (
                  <p className="text-xs text-[#1a3a34]/60 mt-1 flex items-center gap-1">
                    <Phone className="w-3 h-3" /> {addr.phone || order.customer_phone}
                  </p>
                )}
              </div>
            )}

            {/* What's next */}
            <div className="bg-white border border-[#e2d9cc] rounded-2xl p-5">
              <h3 className="font-semibold text-[#1a3a34] text-sm mb-3">What Happens Next?</h3>
              <ol className="space-y-3">
                {[
                  'Order confirmation sent to your email.',
                  'Our team prepares and quality-checks your package.',
                  "We'll share a tracking link via SMS/WhatsApp once shipped.",
                  'Delivery in 3–7 business days.',
                ].map((step, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-[#016a6e]/10 text-[#016a6e] text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <span className="text-xs text-[#1a3a34]/70 leading-relaxed">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>

        {/* ── CTA buttons ── */}
        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href={`/account/orders/${orderId}`}
            className="flex items-center justify-center gap-2 bg-[#1a3a34] text-white h-13 px-8 py-3.5 rounded-xl text-sm font-bold uppercase tracking-widest hover:bg-[#16312b] transition-colors"
          >
            <Package className="w-4 h-4" /> Track My Order
          </Link>
          <Link
            href="/collections/all"
            className="flex items-center justify-center gap-2 border border-[#1a3a34]/20 text-[#1a3a34] h-13 px-8 py-3.5 rounded-xl text-sm font-bold uppercase tracking-widest hover:bg-[#1a3a34]/5 transition-colors"
          >
            <ShoppingBag className="w-4 h-4" /> Continue Shopping
          </Link>
          <button
            onClick={handleShare}
            className="flex items-center justify-center gap-2 border border-[#c9a84c]/40 text-[#c9a84c] h-13 px-8 py-3.5 rounded-xl text-sm font-bold uppercase tracking-widest hover:bg-[#c9a84c]/5 transition-colors"
          >
            <Share2 className="w-4 h-4" /> Share Label Wink
          </button>
        </div>

        {/* Footer */}
        <div className="mt-12 pt-6 border-t border-[#e2d9cc] flex items-center justify-center gap-2 text-xs text-[#1a3a34]/40">
          <ShoppingBag className="w-3 h-3" />
          Label Wink · Handcrafted Boutique Fashion
        </div>
      </div>
    </div>
  );
}
