'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Package, Loader2, ExternalLink, Star, RotateCcw, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';

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

const FILTER_TABS = [
  { id: 'all',       label: 'All' },
  { id: 'active',    label: 'Active' },
  { id: 'delivered', label: 'Delivered' },
  { id: 'cancelled', label: 'Cancelled' },
  { id: 'returns',   label: 'Returns' },
];

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [returnWindowDays, setReturnWindowDays] = useState(7);
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: settings } = await supabase.from('shop_settings').select('return_window_days').single();
      if (settings?.return_window_days) setReturnWindowDays(settings.return_window_days);

      const { data } = await supabase
        .from('orders')
        .select(`
          id, order_number, status, total_amount, created_at, shipping_carrier, tracking_number, tracking_url, items,
          order_items (id, product_name, image_url),
          invoices (invoice_number)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      setOrders(data || []);
      setLoading(false);
    }
    load();
  }, []);

  const filtered = orders.filter(o => {
    if (filter === 'all') return true;
    if (filter === 'active') return ['pending', 'confirmed', 'packed', 'order_ready', 'dispatched', 'shipped'].includes(o.status);
    if (filter === 'delivered') return o.status === 'delivered';
    if (filter === 'cancelled') return o.status === 'cancelled';
    if (filter === 'returns') return o.status === 'return_requested';
    return true;
  });

  if (loading) {
    return (
      <div className="h-[40vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#c9a84c]" />
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="bg-white border-2 border-dashed border-sage/30 rounded-xl p-16 text-center animate-in fade-in">
        <Package className="w-16 h-16 mx-auto text-sage/40 mb-4" />
        <h2 className="text-xl font-bold text-charcoal mb-2">You haven&apos;t placed any orders yet</h2>
        <p className="text-muted-foreground mb-8">Once you place an order, it will appear here.</p>
        <Link
          href="/products"
          className="inline-block bg-[#c9a84c] text-[#ffffff] px-8 py-3 rounded-lg text-sm font-bold uppercase tracking-widest hover:bg-[#b5953e] transition-colors"
        >
          Shop Now
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h1 className="text-2xl font-heading font-bold text-charcoal border-b border-sage/20 pb-4">My Orders</h1>

      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {FILTER_TABS.map(tab => {
          const count = tab.id === 'all'
            ? orders.length
            : orders.filter(o => {
                if (tab.id === 'active') return ['pending', 'confirmed', 'packed', 'order_ready', 'dispatched', 'shipped'].includes(o.status);
                if (tab.id === 'delivered') return o.status === 'delivered';
                if (tab.id === 'cancelled') return o.status === 'cancelled';
                if (tab.id === 'returns') return o.status === 'return_requested';
                return false;
              }).length;

          return (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={cn(
                "px-4 py-2 text-xs font-bold uppercase tracking-widest rounded-full whitespace-nowrap transition-colors",
                filter === tab.id
                  ? "bg-[#1B3A2D] text-white"
                  : "bg-sage/5 text-[#5a7060] hover:bg-sage/10"
              )}
            >
              {tab.label} {count > 0 && <span className="ml-1 text-[10px] opacity-60">({count})</span>}
            </button>
          );
        })}
      </div>

      {/* Orders list */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm">
          No orders in this category.
        </div>
      ) : (
        filtered.map((order) => {
          const invoiceNum = order.invoices?.[0]?.invoice_number || 'Pending';
          const itemCount = order.order_items?.length || 0;
          const images = (order.order_items || [])
            .slice(0, 2)
            .map((i: any) => i.image_url)
            .filter(Boolean);
          const moreCount = Math.max(0, itemCount - 2);

          const isDelivered = order.status === 'delivered';
          const daysSinceOrder = Math.floor((Date.now() - new Date(order.created_at).getTime()) / (1000 * 3600 * 24));
          const canReturn = isDelivered && daysSinceOrder <= returnWindowDays;
          const isDispatched = ['dispatched', 'shipped'].includes(order.status);
          const isActive = ['pending', 'confirmed', 'packed', 'order_ready'].includes(order.status);

          return (
            <div key={order.id} className="bg-white border border-sage/20 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              {/* Header */}
              <div className="p-5 border-b border-sage/10 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-sage/5">
                <div className="flex items-center gap-4 flex-wrap">
                  <div>
                    <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-0.5">Invoice</p>
                    <p className="font-mono font-bold text-[#c9a84c] text-sm">{invoiceNum}</p>
                  </div>
                  <div className="w-px h-8 bg-sage/20 hidden md:block" />
                  <div>
                    <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-0.5">Date</p>
                    <p className="font-bold text-sm text-charcoal">{new Date(order.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}</p>
                  </div>
                  <div className="w-px h-8 bg-sage/20 hidden md:block" />
                  <div>
                    <p className="text-[10px] uppercase tracking-widest font-bold text-[#5a7060] mb-0.5">Total</p>
                    <p className="font-bold text-sm text-[#1A1A1A]">₹{Number(order.total_amount).toLocaleString('en-IN')}</p>
                  </div>
                </div>
                <span className={`text-[10px] uppercase tracking-wider font-bold px-3 py-1 rounded-full self-start md:self-center ${STATUS_BADGE[order.status] || 'bg-gray-100 text-gray-700'}`}>
                  {order.status.replace(/_/g, ' ')}
                </span>
              </div>

              {/* Body */}
              <div className="p-5">
                {/* Images preview */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex -space-x-3">
                    {images.map((img: string, idx: number) => (
                      <div key={idx} className="w-12 h-12 rounded-lg border-2 border-white overflow-hidden bg-sage/10 shadow-sm relative">
                        <Image 
                          src={img} 
                          alt="" 
                          fill
                          sizes="48px"
                          className="object-cover" 
                        />
                      </div>
                    ))}
                    {images.length === 0 && (
                      <div className="w-12 h-12 rounded-lg border-2 border-white bg-sage/10 flex items-center justify-center">
                        <Package className="w-5 h-5 text-sage/40" />
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    <span className="font-bold text-charcoal">{itemCount} item{itemCount !== 1 ? 's' : ''}</span>
                    {moreCount > 0 && <span className="text-xs"> (+{moreCount} more)</span>}
                  </p>
                </div>

                {/* AWB info */}
                {order.tracking_number && (
                  <p className="text-xs text-muted-foreground mb-4 flex items-center gap-2">
                    📦 {order.shipping_carrier} — AWB: <span className="font-mono bg-sage/10 px-1.5 py-0.5 rounded text-charcoal font-bold">{order.tracking_number}</span>
                  </p>
                )}

                {/* Status-based CTAs + View Details */}
                <div className="flex flex-wrap gap-3 mt-2">
                  <Link
                    href={`/account/orders/${order.id}`}
                    className="flex items-center gap-1.5 bg-[#1B3A2D] text-white px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.2em] rounded hover:bg-black transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" /> View Details
                  </Link>

                  {isActive && (
                    <Link
                      href={`/account/orders/${order.id}`}
                      className="flex items-center gap-1.5 text-[#c9a84c] text-[10px] font-bold uppercase tracking-[0.2em] hover:underline underline-offset-4"
                    >
                      Track Order →
                    </Link>
                  )}

                  {isDispatched && order.tracking_url && (
                    <a
                      href={order.tracking_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-charcoal text-[10px] font-bold uppercase tracking-[0.2em] hover:underline underline-offset-4"
                    >
                      Track Package 🚚
                    </a>
                  )}

                  {isDelivered && (
                    <div className="flex gap-4">
                      <Link
                        href={`/products#reviews`}
                        className="flex items-center gap-1.5 text-amber-600 text-[10px] font-bold uppercase tracking-[0.2em] hover:underline underline-offset-4"
                      >
                        Rate Items ⭐
                      </Link>
                      <Link
                        href={`/account/orders/${order.id}#return`}
                        className="flex items-center gap-1.5 text-red-500 text-[10px] font-bold uppercase tracking-[0.2em] hover:underline underline-offset-4"
                      >
                        Return Items ↩️
                      </Link>
                    </div>
                  )}

                  {order.status === 'cancelled' && (
                    <Link
                      href={`/account/orders/${order.id}`}
                      className="flex items-center gap-1.5 text-muted-foreground text-[10px] font-bold uppercase tracking-[0.2em] hover:underline underline-offset-4"
                    >
                      View Details
                    </Link>
                  )}
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
