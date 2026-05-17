'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, Download, Package, MapPin, CreditCard, Star, XCircle } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ReturnModal } from '@/components/storefront/ReturnModal';

const STATUS_BADGE: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700',
  confirmed: 'bg-blue-100 text-blue-700',
  packed: 'bg-indigo-100 text-indigo-700',
  order_ready: 'bg-purple-100 text-purple-700',
  dispatched: 'bg-violet-100 text-violet-700',
  shipped: 'bg-violet-100 text-violet-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
  return_requested: 'bg-orange-100 text-orange-700',
};

export default function OrderDetailsPage() {
  const { id } = useParams();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/storefront/orders/${encodeURIComponent(String(id))}`)
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(data => {
        if (data?.error) throw new Error(data.error);
        setOrder(data);
      })
      .catch(err => {
        console.error('[order-detail] fetch error', err);
        setError(err.message ?? 'Order not found.');
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="h-[40vh] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#c9a84c] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="text-center py-20 space-y-4">
        <p className="text-muted-foreground">{error ?? 'Order not found or unauthorized.'}</p>
        <Link href="/account/orders" className="inline-flex items-center gap-2 text-sm text-[#1B3A2D] underline">
          ← Back to My Orders
        </Link>
      </div>
    );
  }

  const steps = ['pending', 'confirmed', 'packed', 'shipped', 'delivered'];
  let currentStepIdx = steps.indexOf(order.status);
  if (currentStepIdx === -1) {
    if (order.status === 'dispatched') currentStepIdx = 3;
    if (order.status === 'order_ready') currentStepIdx = 2;
  }

  const isDelivered = order.status === 'delivered';
  const isDispatched = ['dispatched', 'shipped'].includes(order.status);
  const daysSinceOrder = Math.floor((Date.now() - new Date(order.created_at).getTime()) / (1000 * 3600 * 24));
  const hoursSinceOrder = (Date.now() - new Date(order.created_at).getTime()) / (1000 * 3600);
  const canReturn = isDelivered && daysSinceOrder <= 7;
  const canCancel = ['pending', 'confirmed', 'packed'].includes(order.status) && hoursSinceOrder <= 5;
  const hoursLeft = Math.max(0, 5 - hoursSinceOrder);

  const handleCancel = async () => {
    if (!confirm('Cancel this order? This action cannot be undone.')) return;
    setCancelling(true);
    setCancelError(null);
    try {
      const res = await fetch(`/api/storefront/orders/${order.id}/cancel`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setOrder({ ...order, status: 'cancelled' });
      } else {
        setCancelError(data.error || 'Failed to cancel order');
      }
    } catch {
      setCancelError('Network error. Please try again.');
    } finally {
      setCancelling(false);
    }
  };

  // Build tracking URL from Shiprocket AWB if present
  const trackingUrl = order.shiprocket_awb_code
    ? `https://shiprocket.co/tracking/${order.shiprocket_awb_code}`
    : null;

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header */}
      <div className="flex items-center gap-4 border-b border-sage/20 pb-4">
        <Link href="/account/orders" className="p-2 hover:bg-sage/10 rounded-full transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-heading font-bold text-charcoal">
            Order #{order.order_number || order.id?.slice(0, 8).toUpperCase()}
          </h1>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            {order.invoice_number && (
              <span className="text-xs text-muted-foreground">
                Invoice: <span className="font-mono text-[#c9a84c] font-bold">{order.invoice_number}</span>
              </span>
            )}
            <span className="text-xs text-muted-foreground">
              {new Date(order.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}
            </span>
            <span className={`text-[10px] uppercase tracking-wider font-bold px-2.5 py-0.5 rounded-full ${STATUS_BADGE[order.status] || 'bg-gray-100 text-gray-700'}`}>
              {order.status?.replace(/_/g, ' ')}
            </span>
          </div>
        </div>
      </div>

      {/* Timeline */}
      {order.status !== 'cancelled' ? (
        <div className="bg-white border border-sage/20 rounded-xl p-6 overflow-x-auto">
          <div className="min-w-[500px] flex justify-between items-center relative px-4">
            <div className="absolute top-4 left-8 right-8 h-1 bg-sage/20 -z-10" />
            <div
              className="absolute top-4 left-8 h-1 bg-[#c9a84c] -z-10 transition-all duration-500"
              style={{ width: `calc(${Math.max(0, currentStepIdx) * (100 / (steps.length - 1))}%)` }}
            />
            {steps.map((step, idx) => {
              const isCompleted = idx <= currentStepIdx;
              const isCurrent = idx === currentStepIdx;
              return (
                <div key={step} className="flex flex-col items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center border-4 border-white transition-colors duration-500 ${isCompleted ? 'bg-[#c9a84c] text-white' : 'bg-sage/30'} ${isCurrent ? 'ring-4 ring-[#c9a84c]/20' : ''}`}>
                    {isCompleted ? <div className="w-2 h-2 rounded-full bg-white" /> : null}
                  </div>
                  <p className={`text-[10px] uppercase tracking-widest font-bold ${isCompleted ? 'text-charcoal' : 'text-muted-foreground'}`}>{step}</p>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-100 font-bold text-center uppercase tracking-widest text-sm">
          This order was cancelled
        </div>
      )}

      {/* Items */}
      <div className="bg-white border border-sage/20 rounded-xl overflow-hidden">
        <div className="bg-sage/5 px-6 py-3 border-b border-sage/10">
          <h3 className="text-xs uppercase tracking-widest font-bold text-charcoal/60">
            Items ({order.order_items?.length || 0})
          </h3>
        </div>
        <div className="divide-y divide-sage/10">
          {(order.order_items ?? []).map((item: any) => (
            <div key={item.id} className="p-5 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <div className="w-16 h-16 bg-sage/10 rounded-lg overflow-hidden flex-shrink-0 relative">
                {item.image_url && (
                  <Image
                    src={item.image_url}
                    alt={item.product_name ?? 'Product'}
                    fill
                    sizes="64px"
                    className="object-cover"
                  />
                )}
              </div>
              <div className="flex-1">
                <p className="font-bold text-charcoal text-sm mb-1">{item.product_name}</p>
                <div className="flex gap-3 text-xs text-muted-foreground flex-wrap">
                  {item.size && <span className="bg-sage/10 px-2 py-0.5 rounded font-medium">Size: {item.size}</span>}
                  {item.color && <span>Color: {item.color}</span>}
                  <span>Qty: {item.quantity}</span>
                  {item.sku && <span className="font-mono text-[10px]">SKU: {item.sku}</span>}
                </div>
              </div>
              <div className="text-right flex flex-col items-end gap-2">
                <div>
                  <p className="font-bold text-charcoal">₹{Number(item.total_price ?? (item.unit_price ?? item.price ?? 0) * item.quantity).toLocaleString('en-IN')}</p>
                  <p className="text-[10px] text-muted-foreground">₹{item.unit_price ?? item.price ?? 0} each</p>
                </div>
                {isDelivered && item.slug && (
                  <Link
                    href={`/products/${item.slug}#reviews`}
                    className="text-[11px] font-bold text-amber-600 hover:text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2 py-1 rounded flex items-center gap-1 transition-colors"
                  >
                    <Star className="w-3 h-3 text-amber-500 fill-amber-500" /> Rate Item
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Shiprocket tracking */}
        {order.shiprocket_awb_code && (
          <div className="bg-white border border-sage/20 rounded-xl p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-[#1a1a1a] rounded-full flex items-center justify-center text-[#c9a84c]">
                <Package className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs uppercase tracking-widest font-bold text-charcoal/60">Shipping</h3>
                <p className="font-bold text-charcoal text-sm">{order.shiprocket_courier_name ?? 'Courier'}</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              AWB: <span className="font-mono text-charcoal bg-sage/10 px-1.5 py-0.5 rounded">{order.shiprocket_awb_code}</span>
            </p>
            {trackingUrl && (
              <a href={trackingUrl} target="_blank" rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#c9a84c] uppercase tracking-widest hover:underline">
                Track Package →
              </a>
            )}
          </div>
        )}

        {/* Delivery address */}
        <div className="bg-sage/5 border border-sage/20 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <MapPin className="w-5 h-5 text-muted-foreground" />
            <h3 className="text-xs uppercase tracking-widest font-bold text-charcoal/60">Delivery Address</h3>
          </div>
          <p className="font-bold text-sm text-charcoal">
            {order.shipping_name || `${order.shipping_address?.first_name ?? ''} ${order.shipping_address?.last_name ?? ''}`.trim()}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {order.shipping_address?.line1 || order.shipping_address?.address_line1}<br />
            {order.shipping_city}, {order.shipping_state} - {order.shipping_pincode}
          </p>
          {(order.shipping_phone || order.customer_phone) && (
            <p className="text-sm text-muted-foreground mt-1">📞 {order.shipping_phone || order.customer_phone}</p>
          )}
        </div>

        {/* Payment info */}
        <div className="bg-white border border-sage/20 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <CreditCard className="w-5 h-5 text-muted-foreground" />
            <h3 className="text-xs uppercase tracking-widest font-bold text-charcoal/60">Payment</h3>
          </div>
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-green-100 text-green-700 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">
              ✅ {order.payment_status ?? 'Paid'}
            </span>
            <span className="text-sm text-charcoal font-medium capitalize">{order.payment_method ?? 'Razorpay'}</span>
          </div>
          {order.razorpay_payment_id && (
            <p className="text-xs text-muted-foreground">TXN: <span className="font-mono">{order.razorpay_payment_id}</span></p>
          )}
          {order.coupon_code && (
            <p className="text-xs text-muted-foreground mt-1">Coupon: <span className="font-mono text-[#1B3A2D]">{order.coupon_code}</span></p>
          )}
        </div>
      </div>

      {/* Price breakdown */}
      <div className="bg-white border border-sage/20 rounded-xl p-6 max-w-sm ml-auto space-y-3">
        {order.subtotal != null && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-bold">₹{Number(order.subtotal).toLocaleString('en-IN')}</span>
          </div>
        )}
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Shipping</span>
          <span className="font-bold">{Number(order.shipping_amount) === 0 ? 'FREE' : `₹${order.shipping_amount}`}</span>
        </div>
        {Number(order.discount_amount) > 0 && (
          <div className="flex justify-between text-sm text-green-600">
            <span>Discount</span>
            <span className="font-bold">-₹{order.discount_amount}</span>
          </div>
        )}
        {Number(order.points_redeemed) > 0 && (
          <div className="flex justify-between text-sm text-purple-600">
            <span>Wink Points</span>
            <span className="font-bold">-₹{order.points_redeemed}</span>
          </div>
        )}
        <div className="flex justify-between text-lg pt-4 border-t border-sage/20 font-bold">
          <span className="text-charcoal">Total</span>
          <span className="text-[#c9a84c]">₹{Number(order.total_amount).toLocaleString('en-IN')}</span>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-3 pt-4 border-t border-sage/20">
        {(order.invoice_signed_url || order.invoice_number) && (
          <a
            href={order.invoice_signed_url || `/account/orders/${order.id}/invoice`}
            target={order.invoice_signed_url ? "_blank" : "_self"}
            rel="noopener noreferrer"
            className="flex items-center gap-2 border border-[#1a1a1a] px-5 py-2.5 rounded-lg text-xs font-bold tracking-widest uppercase hover:bg-sage/5 transition-colors"
          >
            <Download className="w-4 h-4" /> Download Invoice
          </a>
        )}

        {isDispatched && trackingUrl && (
          <a
            href={trackingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-[#1a1a1a] text-white px-5 py-2.5 rounded-lg text-xs font-bold tracking-widest uppercase hover:bg-black transition-colors"
          >
            Track Package 🚚
          </a>
        )}

        {isDelivered && (
          <>
            {canReturn && (
              <button
                onClick={() => setShowReturnModal(true)}
                className="flex items-center gap-2 border border-red-200 text-red-600 px-5 py-2.5 rounded-lg text-xs font-bold tracking-widest uppercase hover:bg-red-50 transition-colors"
              >
                Return Items ↩️
              </button>
            )}
            {(() => {
              const firstItem = (order.order_items ?? []).find((item: any) => item.slug);
              return (
                <Link
                  href={firstItem ? `/products/${firstItem.slug}#reviews` : '/products'}
                  className="flex items-center gap-2 border border-amber-500 text-amber-500 px-5 py-2.5 rounded-lg text-xs font-bold tracking-widest uppercase hover:bg-amber-50 transition-colors"
                >
                  <Star className="w-3.5 h-3.5" /> Rate Items ⭐
                </Link>
              );
            })()}
          </>
        )}

        {order.status === 'return_requested' && (
          <div className="w-full mt-2 bg-orange-50 text-orange-700 border border-orange-200 p-4 rounded-xl text-sm font-medium">
            ↩️ Return request submitted. We&apos;ll contact you within 24 hours.
          </div>
        )}

        {/* Cancel button — only within 5 hours */}
        {canCancel && (
          <div className="w-full mt-2">
            <button
              onClick={handleCancel}
              disabled={cancelling}
              className="flex items-center gap-2 border border-red-300 text-red-600 bg-red-50 hover:bg-red-100 px-5 py-2.5 rounded-lg text-xs font-bold tracking-widest uppercase transition-colors disabled:opacity-50"
            >
              <XCircle className="w-4 h-4" />
              {cancelling ? 'Cancelling…' : 'Cancel Order'}
            </button>
            <p className="text-[10px] text-muted-foreground mt-1">
              Can cancel within {hoursLeft.toFixed(1)}h — Contact support after that.
            </p>
            {cancelError && (
              <p className="text-xs text-red-600 mt-1">{cancelError}</p>
            )}
          </div>
        )}
      </div>

      {/* Return Modal */}
      {showReturnModal && (
        <ReturnModal
          orderId={order.id}
          items={(order.order_items ?? []).map((item: any) => ({
            id: item.id,
            product_name: item.product_name,
            size: item.size,
            quantity: item.quantity,
            product_image: item.image_url,
          }))}
          onSuccess={() => {
            setOrder({ ...order, status: 'return_requested' });
          }}
          onClose={() => setShowReturnModal(false)}
        />
      )}
    </div>
  );
}
