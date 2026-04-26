'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2, Package, MapPin, CreditCard, Truck, CheckCircle2, Circle } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { buttonVariants } from '@/components/ui/button';

const STATUS_ORDER = ['pending', 'confirmed', 'shipped', 'delivered'];
const STATUS_COLORS: Record<string, string> = {
  pending:   'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-blue-100 text-blue-700',
  shipped:   'bg-purple-100 text-purple-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    fetch('/api/storefront/orders')
      .then(r => r.json())
      .then((orders: any[]) => {
        const found = orders.find(o => o.id === id);
        if (found) setOrder(found);
        else router.push('/account/orders');
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="flex items-center justify-center h-[60vh]"><Loader2 className="w-10 h-10 animate-spin text-teal" /></div>;
  if (!order) return null;

  const addr = order.shipping_address || {};
  const statusIdx = STATUS_ORDER.indexOf(order.status);
  const isCancelled = order.status === 'cancelled';

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="border-b border-sage/20 pb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-semibold text-charcoal uppercase tracking-widest">
            Order #{order.id.slice(0, 8).toUpperCase()}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Placed on {new Date(order.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <span className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest ${STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-700'}`}>
          {order.status}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Items */}
          <div className="bg-white border border-sage/20 rounded-xl p-6">
            <h2 className="font-semibold text-charcoal mb-4 flex items-center gap-2"><Package className="w-4 h-4 text-teal" /> Items</h2>
            <div className="divide-y divide-sage/10">
              {order.order_items?.map((item: any) => {
                const variant = item.product_variants;
                const product = variant?.products;
                const imageId = variant?.image_public_ids?.[0];
                return (
                  <div key={item.id} className="flex gap-4 py-4">
                    <div className="w-16 h-20 bg-sage/10 rounded overflow-hidden flex-shrink-0">
                      {imageId ? (
                        <Image
                          src={`https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/w_128,h_160,c_fill/${imageId}`}
                          alt={product?.name || 'Product'}
                          width={64}
                          height={80}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-sage/40"><Package className="w-5 h-5" /></div>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-charcoal text-sm">{product?.name || '—'}</p>
                      {variant && <p className="text-xs text-muted-foreground mt-0.5">Size: {variant.size} · Color: {variant.color}</p>}
                      <p className="text-xs text-muted-foreground mt-0.5">Qty: {item.quantity}</p>
                    </div>
                    <p className="font-bold text-charcoal text-sm">₹{(Number(item.price) * item.quantity).toLocaleString()}</p>
                  </div>
                );
              })}
            </div>
            <div className="border-t border-sage/10 pt-4 mt-2 space-y-1.5 text-sm">
              <div className="flex justify-between text-charcoal/60"><span>Subtotal</span><span>₹{Number(order.subtotal || 0).toLocaleString()}</span></div>
              <div className="flex justify-between text-charcoal/60"><span>Shipping</span><span>{Number(order.shipping_fee || 0) === 0 ? 'FREE' : `₹${Number(order.shipping_fee).toLocaleString()}`}</span></div>
              {order.discount_amount > 0 && <div className="flex justify-between text-green-600"><span>Discount</span><span>-₹{Number(order.discount_amount).toLocaleString()}</span></div>}
              <div className="flex justify-between font-bold text-base text-charcoal pt-1 border-t border-sage/10"><span>Total</span><span>₹{Number(order.total || order.total_amount || 0).toLocaleString()}</span></div>
            </div>
          </div>

          {/* Shipping Address */}
          <div className="bg-white border border-sage/20 rounded-xl p-6">
            <h2 className="font-semibold text-charcoal mb-3 flex items-center gap-2"><MapPin className="w-4 h-4 text-teal" /> Shipping Address</h2>
            <p className="text-sm text-charcoal font-semibold">{addr.fullName || addr.full_name || order.customer_name}</p>
            <p className="text-sm text-charcoal/70 mt-0.5">{addr.address}</p>
            <p className="text-sm text-charcoal/70">{[addr.city, addr.state, addr.pincode].filter(Boolean).join(', ')}</p>
            {(addr.phone || order.customer_phone) && <p className="text-sm text-charcoal/70 mt-0.5">📞 {addr.phone || order.customer_phone}</p>}
          </div>

          {/* Tracking */}
          {order.tracking_number && (
            <div className="bg-white border border-sage/20 rounded-xl p-6">
              <h2 className="font-semibold text-charcoal mb-3 flex items-center gap-2"><Truck className="w-4 h-4 text-teal" /> Tracking</h2>
              <div className="text-sm space-y-1">
                {order.shipping_carrier && <p><span className="text-charcoal/60">Carrier:</span> <span className="font-medium">{order.shipping_carrier}</span></p>}
                <p><span className="text-charcoal/60">Tracking #:</span> <span className="font-medium font-mono">{order.tracking_number}</span></p>
              </div>
              {order.tracking_url && (
                <a href={order.tracking_url} target="_blank" rel="noopener noreferrer"
                  className="mt-4 inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-lg transition-colors">
                  <Truck className="w-3.5 h-3.5" /> Track Package
                </a>
              )}
            </div>
          )}
        </div>

        <div className="space-y-6">
          {/* Payment */}
          <div className="bg-white border border-sage/20 rounded-xl p-6">
            <h2 className="font-semibold text-charcoal mb-3 flex items-center gap-2"><CreditCard className="w-4 h-4 text-teal" /> Payment</h2>
            <div className="text-sm space-y-2">
              <div className="flex justify-between"><span className="text-charcoal/60">Method</span><span className="font-medium capitalize">{order.payment_method || 'Online'}</span></div>
              <div className="flex justify-between"><span className="text-charcoal/60">Status</span>
                <span className={`font-semibold ${order.payment_status === 'paid' ? 'text-green-600' : 'text-yellow-600'}`}>{order.payment_status}</span>
              </div>
              {order.razorpay_payment_id && <div className="flex justify-between"><span className="text-charcoal/60">Txn ID</span><span className="font-mono text-xs">{order.razorpay_payment_id}</span></div>}
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
                      <span className={`text-sm capitalize ${done ? 'text-charcoal font-semibold' : 'text-charcoal/40'}`}>{s}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <Link href="/account/orders" className={buttonVariants({ variant: 'outline', className: 'w-full border-charcoal/20 rounded-none text-xs uppercase tracking-widest font-bold h-11' })}>
            ← Back to Orders
          </Link>
        </div>
      </div>
    </div>
  );
}
