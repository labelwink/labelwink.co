import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Package } from 'lucide-react';

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

export default async function OrdersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: settings } = await supabase.from('shop_settings').select('return_window_days').single();
  const returnWindowDays = settings?.return_window_days || 7;

  // Manual query logic since Supabase doesn't support raw JOINs via auto-API natively without a view
  const { data: ordersData } = await supabase
    .from('orders')
    .select(`
      id, status, total, created_at, shipping_carrier, tracking_number,
      order_items (id, product_name),
      invoices (invoice_number)
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  const orders = ordersData || [];

  if (orders.length === 0) {
    return (
      <div className="bg-white border-2 border-dashed border-sage/30 rounded-xl p-16 text-center animate-in fade-in">
        <Package className="w-16 h-16 mx-auto text-sage/40 mb-4" />
        <h2 className="text-xl font-bold text-charcoal mb-2">You haven&apos;t placed any orders yet</h2>
        <p className="text-muted-foreground mb-8">Once you place an order, it will appear here.</p>
        <Link
          href="/collections/all"
          className="inline-block bg-[#c9a84c] text-charcoal px-8 py-3 rounded-xl text-sm font-bold uppercase tracking-widest hover:bg-[#b5953e] transition-colors"
        >
          Shop Now
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h1 className="text-2xl font-heading font-bold text-charcoal mb-8 border-b border-sage/20 pb-4">My Orders</h1>
      
      {orders.map((order) => {
        const invoiceNum = order.invoices?.[0]?.invoice_number || 'Pending';
        const itemCount = order.order_items?.length || 0;
        const itemNames = (order.order_items || []).slice(0, 2).map((i: any) => i.product_name).join(', ');
        const hasMore = itemCount > 2;
        
        const isDelivered = order.status === 'delivered';
        const daysSinceOrder = Math.floor((new Date().getTime() - new Date(order.created_at).getTime()) / (1000 * 3600 * 24));
        const canReturn = isDelivered && daysSinceOrder <= returnWindowDays;

        return (
          <div key={order.id} className="bg-white border border-sage/20 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            <div className="p-5 border-b border-sage/10 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-sage/5">
              <div>
                <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-1">Invoice</p>
                <p className="font-mono font-bold text-[#c9a84c]">{invoiceNum}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-1">Date</p>
                <p className="font-bold text-sm text-charcoal">{new Date(order.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-1">Total</p>
                <p className="font-bold text-sm text-charcoal">₹{order.total}</p>
              </div>
              <div>
                <span className={`text-[10px] uppercase tracking-wider font-bold px-3 py-1 rounded-full ${STATUS_BADGE[order.status] || 'bg-gray-100 text-gray-700'}`}>
                  {order.status.replace('_', ' ')}
                </span>
              </div>
            </div>
            
            <div className="p-5">
              <div className="mb-4">
                <p className="text-sm font-medium text-charcoal">
                  <span className="font-bold">{itemCount} items:</span> {itemNames}{hasMore ? '...' : ''}
                </p>
                {order.tracking_number && (
                  <p className="text-xs text-muted-foreground mt-2 flex items-center gap-2">
                    📦 Shipped via <span className="font-bold">{order.shipping_carrier}</span> — AWB: <span className="font-mono bg-sage/10 px-1">{order.tracking_number}</span>
                  </p>
                )}
              </div>
              
              <div className="flex flex-wrap gap-3 mt-6">
                <Link 
                  href={`/account/orders/${order.id}`}
                  className="bg-[#1a1a1a] text-white px-4 py-2 text-xs font-bold uppercase tracking-widest rounded-lg hover:bg-black transition-colors"
                >
                  View Details
                </Link>
                <Link 
                  href={`/account/orders/${order.id}/invoice`}
                  className="border border-[#1a1a1a] text-[#1a1a1a] px-4 py-2 text-xs font-bold uppercase tracking-widest rounded-lg hover:bg-sage/5 transition-colors"
                >
                  Download Invoice
                </Link>
                {canReturn && (
                  <Link 
                    href={`/account/orders/${order.id}#return`}
                    className="border border-red-200 text-red-600 px-4 py-2 text-xs font-bold uppercase tracking-widest rounded-lg hover:bg-red-50 transition-colors"
                  >
                    Request Return
                  </Link>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
