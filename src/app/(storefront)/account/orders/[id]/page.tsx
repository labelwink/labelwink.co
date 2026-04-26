'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Loader2, Package, MapPin, CreditCard, Truck,
  CheckCircle2, Circle, Star, ExternalLink, ArrowLeft,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { buttonVariants } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';

const STATUS_ORDER = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];
const STATUS_COLORS: Record<string, string> = {
  pending:    'bg-yellow-100 text-yellow-700',
  confirmed:  'bg-blue-100 text-blue-700',
  processing: 'bg-indigo-100 text-indigo-700',
  shipped:    'bg-purple-100 text-purple-700',
  delivered:  'bg-green-100 text-green-700',
  cancelled:  'bg-red-100 text-red-700',
  returned:   'bg-orange-100 text-orange-700',
};

interface OrderItem {
  id: string;
  quantity: number;
  price_at_purchase?: number;
  price?: number;  // alias
  variant_size?: string;
  variant_color?: string | null;
  product_name?: string;
  size?: string;
  color?: string | null;
  products: { id: string; name: string; slug: string } | null;
}

interface Order {
  id: string;
  status: string;
  total: number;
  subtotal: number;
  shipping_amount?: number;
  shipping_fee?: number;
  discount_amount: number;
  coupon_code?: string | null;
  customer_name: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  payment_status: string | null;
  payment_method: string | null;
  razorpay_payment_id: string | null;
  shipping_carrier: string | null;
  tracking_number: string | null;
  tracking_url: string | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  shipping_address: Record<string, any> | null;
  shipping_method: string | null;
  created_at: string;
  order_items: OrderItem[];
}

// ── Review Modal ──────────────────────────────────────────────────────────────
function ReviewModal({
  productId,
  productName,
  orderId,
  onClose,
  onSuccess,
}: {
  productId: string;
  productName: string;
  orderId: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [rating, setRating] = useState(5);
  const [hover,  setHover]  = useState(0);
  const [title,  setTitle]  = useState('');
  const [body,   setBody]   = useState('');
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');

  const submit = async () => {
    if (!body.trim()) { setError('Please write a review'); return; }
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/storefront/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id: productId, order_id: orderId, rating, title, body }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error || 'Failed to submit review');
        return;
      }
      onSuccess();
    } catch {
      setError('Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 animate-in zoom-in-95 duration-200">
        <h2 className="font-heading text-xl font-semibold text-charcoal mb-1">Write a Review</h2>
        <p className="text-sm text-muted-foreground mb-6">{productName}</p>

        {/* Star selector */}
        <div className="flex items-center gap-1 mb-6">
          {[1,2,3,4,5].map(n => (
            <button
              key={n}
              type="button"
              onMouseEnter={() => setHover(n)}
              onMouseLeave={() => setHover(0)}
              onClick={() => setRating(n)}
              className="p-0.5"
            >
              <Star
                className={`w-7 h-7 transition-colors ${
                  n <= (hover || rating) ? 'fill-amber-400 text-amber-400' : 'text-gray-200'
                }`}
              />
            </button>
          ))}
          <span className="text-sm text-muted-foreground ml-2">{rating}/5</span>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-charcoal/60 mb-1">
              Title (optional)
            </label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Summarise your experience"
              className="w-full border border-sage/30 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-charcoal/60 mb-1">
              Your Review *
            </label>
            <textarea
              value={body}
              onChange={e => setBody(e.target.value)}
              rows={4}
              placeholder="Tell us about quality, fit, and your experience..."
              className="w-full border border-sage/30 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal resize-none"
            />
          </div>
          {error && <p className="text-xs text-red-500">{error}</p>}
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 h-12 border border-sage/30 rounded-xl text-sm font-medium text-charcoal/70 hover:bg-sage/5 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={saving}
            className="flex-1 h-12 bg-[#1a3a34] text-white rounded-xl text-sm font-semibold hover:bg-[#16312b] disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit Review'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const supabase = createClient();

  const [order,   setOrder]   = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [reviewTarget, setReviewTarget] = useState<{ id: string; name: string } | null>(null);
  const [reviewedIds, setReviewedIds] = useState<Set<string>>(new Set());
  const [reviewSuccess, setReviewSuccess] = useState(false);

  useEffect(() => {
    if (!id) return;
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push('/account/login'); return; }

      fetch(`/api/storefront/orders/${id}`)
        .then(r => {
          if (r.status === 404) { router.push('/account/orders'); return null; }
          return r.json();
        })
        .then(data => { if (data) setOrder(data); })
        .finally(() => setLoading(false));
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (loading) return (
    <div className="flex items-center justify-center h-[60vh]">
      <Loader2 className="w-10 h-10 animate-spin text-teal" />
    </div>
  );
  if (!order) return null;

  const addr       = order.shipping_address || {};
  const statusIdx  = STATUS_ORDER.indexOf(order.status);
  const isCancelled = order.status === 'cancelled';
  const isDelivered = order.status === 'delivered';
  const cloudName  = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {reviewTarget && (
        <ReviewModal
          productId={reviewTarget.id}
          productName={reviewTarget.name}
          orderId={order.id}
          onClose={() => setReviewTarget(null)}
          onSuccess={() => {
            setReviewedIds(prev => new Set(prev).add(reviewTarget.id));
            setReviewTarget(null);
            setReviewSuccess(true);
          }}
        />
      )}

      {reviewSuccess && (
        <div className="fixed bottom-6 right-6 z-50 bg-green-600 text-white px-5 py-3 rounded-xl shadow-xl text-sm font-medium animate-in slide-in-from-bottom-4">
          ✓ Review submitted! It will appear after moderation.
        </div>
      )}

      {/* Header */}
      <div className="border-b border-sage/20 pb-4">
        <div className="flex items-center gap-3 mb-3">
          <Link href="/account/orders" className="text-muted-foreground hover:text-charcoal transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <nav className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Link href="/account/orders" className="hover:text-charcoal">My Orders</Link>
            <span>/</span>
            <span className="font-mono font-semibold text-charcoal">#{order.id.slice(0, 8).toUpperCase()}</span>
          </nav>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-heading font-semibold text-charcoal uppercase tracking-widest">
              Order #{order.id.slice(0, 8).toUpperCase()}
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Placed on {new Date(order.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <span className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest ${STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-700'}`}>
            {order.status}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">

          {/* Items */}
          <div className="bg-white border border-sage/20 rounded-xl p-6">
            <h2 className="font-semibold text-charcoal mb-4 flex items-center gap-2">
              <Package className="w-4 h-4 text-teal" /> Items ({order.order_items?.length || 0})
            </h2>
            <div className="divide-y divide-sage/10">
              {order.order_items?.map(item => {
                const product  = item.products;
                // Handle both old and new field names
                const itemPrice = item.price_at_purchase ?? item.price ?? 0;
                const itemSize  = item.variant_size  || item.size  || '—';
                const itemColor = item.variant_color || item.color || null;
                const itemName  = item.product_name  || product?.name || '—';
                const alreadyReviewed = reviewedIds.has(item.products?.id || '');
                return (
                  <div key={item.id} className="flex gap-4 py-4">
                    <div className="w-16 h-20 bg-sage/10 rounded overflow-hidden flex-shrink-0 flex items-center justify-center">
                      <Package className="w-5 h-5 text-sage/40" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-charcoal text-sm truncate">
                        {itemName}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Size: {itemSize}{itemColor ? ` · ${itemColor}` : ''} · Qty: {item.quantity}
                      </p>
                      {product && (
                        <Link
                          href={`/products/${product.slug}`}
                          className="text-[10px] text-teal font-semibold uppercase tracking-wider hover:underline mt-1 inline-flex items-center gap-1"
                        >
                          View Product <ExternalLink className="w-3 h-3" />
                        </Link>
                      )}
                      {isDelivered && product && !alreadyReviewed && (
                        <button
                          onClick={() => setReviewTarget({ id: product.id, name: itemName })}
                          className="ml-4 text-[10px] text-amber-600 font-bold uppercase tracking-wider hover:underline inline-flex items-center gap-1"
                        >
                          <Star className="w-3 h-3 fill-amber-400 text-amber-400" /> Write Review
                        </button>
                      )}
                      {alreadyReviewed && (
                        <span className="ml-4 text-[10px] text-green-600 font-semibold">✓ Reviewed</span>
                      )}
                    </div>
                    <p className="font-bold text-charcoal text-sm flex-shrink-0">
                      ₹{(Number(itemPrice) * item.quantity).toLocaleString('en-IN')}
                    </p>
                  </div>
                );
              })}
            </div>
            <div className="border-t border-sage/10 pt-4 mt-2 space-y-1.5 text-sm">
              <div className="flex justify-between text-charcoal/60">
                <span>Subtotal</span>
                <span>₹{Number(order.subtotal || 0).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-charcoal/60">
                <span>Shipping</span>
                <span>{Number(order.shipping_amount || order.shipping_fee || 0) === 0 ? 'FREE' : `₹${Number(order.shipping_amount || order.shipping_fee).toLocaleString('en-IN')}`}</span>
              </div>
              {(order.discount_amount || 0) > 0 && (
                <div className="flex justify-between text-green-600">
                  <span className="flex items-center gap-1">
                    Discount {order.coupon_code && <span className="font-mono text-[10px] bg-green-50 border border-green-100 px-1.5 py-0.5 rounded">{order.coupon_code}</span>}
                  </span>
                  <span>−₹{Number(order.discount_amount).toLocaleString('en-IN')}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-base text-charcoal pt-1 border-t border-sage/10">
                <span>Total</span>
                <span>₹{Number(order.total || 0).toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          {/* Shipping Address */}
          <div className="bg-white border border-sage/20 rounded-xl p-6">
            <h2 className="font-semibold text-charcoal mb-3 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-teal" /> Shipping Address
            </h2>
            <p className="text-sm text-charcoal font-semibold">{addr.fullName || addr.full_name || order.customer_name}</p>
            <p className="text-sm text-charcoal/70 mt-0.5">{addr.address || addr.line1}</p>
            {addr.line2 && <p className="text-sm text-charcoal/70">{addr.line2}</p>}
            <p className="text-sm text-charcoal/70">{[addr.city, addr.state, addr.pincode].filter(Boolean).join(', ')}</p>
            {(addr.phone || order.customer_phone) && (
              <p className="text-sm text-charcoal/70 mt-0.5">📞 {addr.phone || order.customer_phone}</p>
            )}
          </div>

          {/* Tracking */}
          {order.tracking_number && (
            <div className="bg-white border border-sage/20 rounded-xl p-6">
              <h2 className="font-semibold text-charcoal mb-3 flex items-center gap-2">
                <Truck className="w-4 h-4 text-teal" /> Tracking
              </h2>
              <div className="text-sm space-y-1">
                {order.shipping_carrier && (
                  <p><span className="text-charcoal/60">Carrier:</span> <span className="font-medium">{order.shipping_carrier}</span></p>
                )}
                <p><span className="text-charcoal/60">Tracking #:</span> <span className="font-medium font-mono">{order.tracking_number}</span></p>
              </div>
              {order.tracking_url && (
                <a
                  href={order.tracking_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-lg transition-colors"
                >
                  <Truck className="w-3.5 h-3.5" /> Track Package
                </a>
              )}
            </div>
          )}
        </div>

        {/* Right Column */}
        <div className="space-y-6">

          {/* Payment */}
          <div className="bg-white border border-sage/20 rounded-xl p-6">
            <h2 className="font-semibold text-charcoal mb-3 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-teal" /> Payment
            </h2>
            <div className="text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-charcoal/60">Method</span>
                <span className="font-medium capitalize">{order.payment_method || 'Online'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-charcoal/60">Status</span>
                <span className={`font-semibold ${order.payment_status === 'paid' ? 'text-green-600' : 'text-yellow-600'}`}>
                  {order.payment_status}
                </span>
              </div>
              {order.razorpay_payment_id && (
                <div className="flex justify-between">
                  <span className="text-charcoal/60">Txn ID</span>
                  <span className="font-mono text-xs">{order.razorpay_payment_id}</span>
                </div>
              )}
            </div>
          </div>

          {/* Status Timeline */}
          <div className="bg-white border border-sage/20 rounded-xl p-6">
            <h2 className="font-semibold text-charcoal mb-5">Order Timeline</h2>
            {isCancelled ? (
              <p className="text-sm text-red-600 font-semibold">This order was cancelled.</p>
            ) : (
              <div className="space-y-4">
                {STATUS_ORDER.map((s, i) => {
                  const done = i <= statusIdx;
                  const current = i === statusIdx;
                  return (
                    <div key={s} className="flex items-center gap-3">
                      {done ? (
                        <CheckCircle2 className={`w-5 h-5 flex-shrink-0 ${current ? 'text-teal' : 'text-teal/50'}`} />
                      ) : (
                        <Circle className="w-5 h-5 flex-shrink-0 text-sage/30" />
                      )}
                      <span className={`text-sm capitalize ${done ? 'text-charcoal font-semibold' : 'text-charcoal/40'}`}>
                        {s}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <Link
            href="/account/orders"
            className={buttonVariants({ variant: 'outline', className: 'w-full border-charcoal/20 rounded-none text-xs uppercase tracking-widest font-bold h-11' })}
          >
            ← Back to Orders
          </Link>
        </div>
      </div>
    </div>
  );
}
