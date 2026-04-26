'use client';

import { useState, useEffect } from 'react';
import { Package, Loader2, Search, ChevronRight, Truck, RotateCcw } from 'lucide-react';
import Link from 'next/link';

const STATUS_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
  pending:    { label: 'Pending',    color: 'bg-yellow-100 text-yellow-700',  dot: 'bg-yellow-400' },
  confirmed:  { label: 'Confirmed',  color: 'bg-blue-100 text-blue-700',      dot: 'bg-blue-500' },
  processing: { label: 'Processing', color: 'bg-indigo-100 text-indigo-700',  dot: 'bg-indigo-500' },
  shipped:    { label: 'Shipped',    color: 'bg-purple-100 text-purple-700',  dot: 'bg-purple-500' },
  delivered:  { label: 'Delivered',  color: 'bg-green-100 text-green-700',    dot: 'bg-green-500' },
  cancelled:  { label: 'Cancelled',  color: 'bg-red-100 text-red-700',        dot: 'bg-red-400' },
  returned:   { label: 'Returned',   color: 'bg-orange-100 text-orange-700',  dot: 'bg-orange-400' },
};

const STATUS_FILTERS = ['All', 'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];

interface OrderItem {
  id: string;
  quantity: number;
  price_at_purchase: number;
  product_name: string | null;
  variant_size: string | null;
  variant_color: string | null;
  image_url: string | null;
  image_cloudinary_id: string | null;
  product_id: string | null;
}

interface Order {
  id: string;
  order_number: string | null;
  status: string;
  total: number;
  created_at: string;
  tracking_number: string | null;
  tracking_url: string | null;
  shipping_carrier: string | null;
  order_items: OrderItem[];
}

export default function AccountOrdersPage() {
  const [orders,    setOrders]    = useState<Order[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [filter,    setFilter]    = useState('All');
  const [search,    setSearch]    = useState('');

  useEffect(() => {
    fetch('/api/storefront/orders')
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setOrders(data); })
      .finally(() => setLoading(false));
  }, []);

  const filtered = orders.filter(o => {
    const matchStatus = filter === 'All' || o.status === filter;
    const matchSearch = !search || o.id.toLowerCase().includes(search.toLowerCase()) ||
      o.order_items?.some(item => item.product_name?.toLowerCase().includes(search.toLowerCase()));
    return matchStatus && matchSearch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-10 h-10 animate-spin text-teal" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="border-b border-sage/20 pb-4">
        <h1 className="text-3xl font-heading font-semibold text-charcoal">My Orders</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {orders.length} order{orders.length !== 1 ? 's' : ''} · Track and manage your Label Wink purchases.
        </p>
      </div>

      {orders.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search orders or products…"
              className="w-full pl-10 pr-4 py-2.5 border border-sage/20 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal"
            />
          </div>
          {/* Status filter */}
          <div className="flex gap-2 flex-wrap">
            {STATUS_FILTERS.map(s => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-colors ${
                  filter === s
                    ? 'bg-charcoal text-cream'
                    : 'bg-white border border-sage/20 text-charcoal/60 hover:border-charcoal/30'
                }`}
              >
                {s === 'All' ? 'All' : (STATUS_CONFIG[s]?.label || s)}
              </button>
            ))}
          </div>
        </div>
      )}

      {filtered.length > 0 ? (
        <div className="space-y-4">
          {filtered.map(order => {
            const cfg        = STATUS_CONFIG[order.status] || { label: order.status, color: 'bg-gray-100 text-gray-700', dot: 'bg-gray-400' };
            const firstItem  = order.order_items?.[0];
            const extraCount = (order.order_items?.length || 1) - 1;
            const isShipped  = order.status === 'shipped' || order.status === 'delivered';

            return (
              <div
                key={order.id}
                className="bg-white border border-sage/20 rounded-xl overflow-hidden hover:border-sage/40 hover:shadow-md transition-all group"
              >
                {/* Order header bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 bg-sage/5 px-5 py-3 border-b border-sage/10">
                  <div className="flex flex-wrap gap-x-6 gap-y-1">
                    <div>
                      <p className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold">Order</p>
                      <p className="text-xs font-mono font-bold text-charcoal">#{order.id.slice(0, 8).toUpperCase()}</p>
                    </div>
                    <div>
                      <p className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold">Date</p>
                      <p className="text-xs font-semibold text-charcoal">
                        {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                    <div>
                      <p className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold">Total</p>
                      <p className="text-xs font-bold text-charcoal">₹{Number(order.total || 0).toLocaleString('en-IN')}</p>
                    </div>
                  </div>
                  <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${cfg.color}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                    {cfg.label}
                  </span>
                </div>

                {/* Content */}
                <div className="px-5 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    {/* Icon */}
                    <div className="w-14 h-18 bg-sage/10 rounded-lg flex items-center justify-center flex-shrink-0 p-3">
                      <Package className="w-6 h-6 text-sage/50" />
                    </div>

                    <div className="min-w-0">
                      <p className="font-semibold text-charcoal text-sm group-hover:text-teal transition-colors truncate">
                        {firstItem?.product_name || 'Label Wink Order'}
                      </p>
                      {firstItem && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Size: {firstItem.variant_size || '—'}{firstItem.variant_color ? ` · ${firstItem.variant_color}` : ''} · Qty: {firstItem.quantity}
                          {extraCount > 0 && ` · +${extraCount} more item${extraCount > 1 ? 's' : ''}`}
                        </p>
                      )}

                      {/* Tracking */}
                      {isShipped && order.tracking_number && (
                        <div className="flex items-center gap-2 mt-2">
                          <Truck className="w-3.5 h-3.5 text-purple-500" />
                          <span className="text-xs text-purple-700 font-semibold">
                            {order.shipping_carrier && `${order.shipping_carrier} · `}
                            {order.tracking_number}
                          </span>
                          {order.tracking_url && (
                            <a
                              href={order.tracking_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[10px] font-bold text-purple-600 underline underline-offset-2"
                              onClick={e => e.stopPropagation()}
                            >
                              Track
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-auto flex-shrink-0">
                    {order.status === 'delivered' && (
                      <Link
                        href={`/account/orders/${order.id}`}
                        className="text-[10px] font-bold text-amber-600 uppercase tracking-wider hover:underline flex items-center gap-1"
                      >
                        ⭐ Review
                      </Link>
                    )}
                    <Link
                      href={`/account/orders/${order.id}`}
                      className="flex items-center gap-1.5 bg-charcoal text-cream rounded-lg px-4 py-2 text-xs font-bold uppercase tracking-widest hover:bg-teal transition-colors"
                    >
                      Details <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white border-2 border-dashed border-sage/30 rounded-xl p-20 text-center">
          {search || filter !== 'All' ? (
            <>
              <Search className="w-10 h-10 mx-auto text-sage/40 mb-3" />
              <p className="text-sm font-medium text-muted-foreground mb-4">No orders match your filter.</p>
              <button
                onClick={() => { setSearch(''); setFilter('All'); }}
                className="text-xs font-bold text-teal underline underline-offset-4"
              >
                Clear filters
              </button>
            </>
          ) : (
            <>
              <RotateCcw className="w-10 h-10 mx-auto text-sage/40 mb-3" />
              <h3 className="text-lg font-heading font-semibold text-charcoal mb-2">No orders yet</h3>
              <p className="text-sm text-muted-foreground mb-8">Start your fashion journey with Label Wink.</p>
              <Link
                href="/collections/all"
                className="inline-block bg-[#1a3a34] text-white px-8 py-3 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-[#16312b] transition-colors"
              >
                Explore Collections
              </Link>
            </>
          )}
        </div>
      )}
    </div>
  );
}
