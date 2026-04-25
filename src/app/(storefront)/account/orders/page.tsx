'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Package, Download, Loader2, ChevronRight, Search } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function AccountOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function fetchOrders() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            quantity,
            price,
            product_variants (
              size,
              color,
              image_public_ids,
              products (
                name
              )
            )
          )
        `)
        .eq('email', user.email)
        .order('created_at', { ascending: false });

      if (data) setOrders(data);
      setLoading(false);
    }

    fetchOrders();
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
            const product = firstItem?.product_variants?.products;
            const variant = firstItem?.product_variants;
            const imageId = variant?.image_public_ids?.[0];
            
            return (
              <div key={order.id} className="border border-sage/20 rounded-none bg-white shadow-sm hover:shadow-md transition-shadow overflow-hidden group">
                {/* Order Header */}
                <div className="flex flex-col sm:flex-row justify-between sm:items-center bg-sage/5 p-4 border-b border-sage/10 gap-3">
                  <div className="flex flex-wrap gap-x-8 gap-y-2">
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-1">Order Placed</p>
                      <p className="text-sm font-semibold text-charcoal">
                        {new Date(order.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-1">Total Amount</p>
                      <p className="text-sm font-bold text-charcoal">₹{Number(order.total_amount).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-1">Order ID</p>
                      <p className="text-sm font-mono text-charcoal">#{order.id.slice(0, 8).toUpperCase()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                      order.status === 'delivered' ? 'bg-green-100 text-green-700' : 
                      order.status === 'pending' ? 'bg-orange-100 text-orange-700' : 
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {order.status}
                    </span>
                  </div>
                </div>
                
                {/* Order Content */}
                <div className="p-6">
                  <div className="flex flex-col md:flex-row gap-6">
                    {/* Main Item Info */}
                    <div className="flex gap-6 flex-1">
                      <div className="w-24 h-32 bg-sage/10 rounded-none overflow-hidden flex-shrink-0 border border-sage/10">
                        {imageId ? (
                          <img 
                            src={`https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/w_200,h_260,c_fill/${imageId}`} 
                            alt={product?.name} 
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
                          Qty: {firstItem?.quantity || 1} {order.order_items.length > 1 && `+ ${order.order_items.length - 1} more items`}
                        </p>
                        
                        {order.status === 'delivered' && (
                          <div className="flex items-center gap-2 text-green-600 text-[10px] font-bold uppercase tracking-widest mt-4">
                            <Download className="w-3.5 h-3.5" />
                            <button className="hover:underline">Download GST Invoice</button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-row md:flex-col gap-3 justify-end md:w-48">
                      <Button asChild className="flex-1 bg-charcoal hover:bg-charcoal/90 text-cream rounded-none h-11 text-xs font-bold uppercase tracking-widest">
                        <Link href={`/account/orders/${order.id}`}>Track Order</Link>
                      </Button>
                      <Button variant="outline" asChild className="flex-1 border-charcoal/20 hover:border-teal hover:text-teal rounded-none h-11 text-xs font-bold uppercase tracking-widest transition-all">
                        <Link href={`/products/${order.order_items[0]?.product_variants?.products?.slug}`}>Buy Again</Link>
                      </Button>
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
            <Button asChild className="w-full h-14 bg-teal text-cream rounded-none uppercase tracking-widest text-xs font-bold shadow-xl">
              <Link href="/collections/all">Explore Collections</Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
