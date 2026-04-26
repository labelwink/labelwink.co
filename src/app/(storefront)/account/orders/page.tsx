'use client';

import { useState, useEffect } from 'react';
import { buttonVariants } from '@/components/ui/button';
import { Package, Loader2, Search, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

const STATUS_COLORS: Record<string, string> = {
  pending:   'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-blue-100 text-blue-700',
  shipped:   'bg-purple-100 text-purple-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

export default function AccountOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/storefront/orders')
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setOrders(data); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-10 h-10 animate-spin text-teal" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="border-b border-sage/20 pb-4">
        <h1 className="text-3xl font-heading font-semibold text-charcoal uppercase tracking-widest">My Orders</h1>
        <p className="text-muted-foreground text-sm mt-1">Track and manage your Label Wink purchases.</p>
      </div>
      
      {orders.length > 0 ? (
        <div className="space-y-6">
          {orders.map((order) => {
            const firstItem = order.order_items?.[0];
            const variant = firstItem?.product_variants;
            const product = variant?.products;
            const imageId = variant?.image_public_ids?.[0];
            const statusColor = STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-700';
            
            return (
              <div key={order.id} className="border border-sage/20 rounded-none bg-white shadow-sm hover:shadow-md transition-shadow overflow-hidden group">
                {/* Order Header */}
                <div className="flex flex-col sm:flex-row justify-between sm:items-center bg-sage/5 p-4 border-b border-sage/10 gap-3">
                  <div className="flex flex-wrap gap-x-8 gap-y-2">
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-1">Order</p>
                      <p className="text-sm font-mono text-charcoal font-semibold">#{order.id.slice(0, 8).toUpperCase()}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-1">Date</p>
                      <p className="text-sm font-semibold text-charcoal">
                        {new Date(order.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-1">Total</p>
                      <p className="text-sm font-bold text-charcoal">₹{Number(order.total || order.total_amount || 0).toLocaleString()}</p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${statusColor}`}>
                    {order.status}
                  </span>
                </div>
                
                {/* Order Content */}
                <div className="p-6">
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="flex gap-6 flex-1">
                      <div className="w-24 h-32 bg-sage/10 rounded-none overflow-hidden flex-shrink-0 border border-sage/10">
                        {imageId ? (
                          <Image 
                            src={`https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/w_200,h_260,c_fill/${imageId}`}
                            alt={product?.name || 'Product'}
                            width={96}
                            height={128}
                            loading="lazy"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-sage/40">
                            <Package className="w-8 h-8" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className="font-heading text-lg font-semibold text-charcoal group-hover:text-teal transition-colors">
                          {product?.name || 'Multiple Items'}
                        </p>
                        <p className="text-xs text-muted-foreground uppercase tracking-widest font-medium">
                          {variant ? `Size: ${variant.size} | Color: ${variant.color}` : 'View details for item breakdown'}
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                          Qty: {firstItem?.quantity || 1}
                          {order.order_items?.length > 1 && ` + ${order.order_items.length - 1} more item${order.order_items.length - 1 > 1 ? 's' : ''}`}
                        </p>

                        {/* Tracking info if available */}
                        {order.tracking_number && (
                          <div className="mt-3 text-xs text-purple-700 font-semibold">
                            {order.shipping_carrier && <span>{order.shipping_carrier} · </span>}
                            Tracking: {order.tracking_number}
                            {order.tracking_url && (
                              <a href={order.tracking_url} target="_blank" rel="noopener noreferrer" className="ml-2 underline text-purple-600">Track</a>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-row md:flex-col gap-3 justify-end md:w-48">
                      <Link 
                        href={`/account/orders/${order.id}`}
                        className={buttonVariants({ className: 'flex-1 bg-charcoal hover:bg-charcoal/90 text-cream rounded-none h-11 text-xs font-bold uppercase tracking-widest flex items-center gap-2' })}
                      >
                        View Details <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white border-2 border-dashed border-sage/30 rounded-none p-20 text-center space-y-6">
          <div className="w-20 h-20 bg-sage/10 rounded-full flex items-center justify-center mx-auto">
            <Search className="w-10 h-10 text-sage/40" />
          </div>
          <div className="max-w-xs mx-auto">
            <h3 className="text-xl font-heading font-semibold text-charcoal mb-2">No Orders Found</h3>
            <p className="text-sm text-muted-foreground mb-8">It looks like you haven't started your fashion journey with us yet.</p>
            <Link 
              href="/collections/all"
              className={buttonVariants({ className: 'w-full h-14 bg-teal text-cream rounded-none uppercase tracking-widest text-xs font-bold shadow-xl flex items-center justify-center' })}
            >
              Explore Collections
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
