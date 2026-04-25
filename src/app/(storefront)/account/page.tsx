'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { buttonVariants } from '@/components/ui/button';
import { Package, Heart, Star, ChevronRight, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function AccountDashboard() {
  const [user, setUser] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function fetchAccountData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }
      setUser(user);

      // Fetch Recent Orders
      const { data: ordersData } = await supabase
        .from('orders')
        .select('*')
        .eq('email', user.email)
        .order('created_at', { ascending: false })
        .limit(3);

      if (ordersData) setOrders(ordersData);
      setLoading(false);
    }

    fetchAccountData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[40vh]">
        <Loader2 className="w-8 h-8 animate-spin text-teal" />
      </div>
    );
  }

  const winkPoints = orders.reduce((acc, o) => acc + (o.status === 'delivered' ? Math.floor(Number(o.total_amount)) : 0), 0);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-heading font-semibold text-charcoal uppercase tracking-widest">
          Hello, {user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Shopper'}
        </h1>
        <p className="text-muted-foreground mt-1 font-medium italic">Welcome back to your curated space.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-sage/20 shadow-sm bg-teal/5 rounded-none border-l-4 border-l-teal">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-charcoal/60">Wink Points</CardTitle>
            <Star className="w-4 h-4 text-teal fill-teal/20" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-heading font-bold text-teal">{winkPoints.toLocaleString()}</div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1 font-semibold">Earned from delivered orders</p>
          </CardContent>
        </Card>

        <Card className="border-sage/20 shadow-sm rounded-none">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-charcoal/60">Total Orders</CardTitle>
            <Package className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-heading font-bold">{orders.length}</div>
            <Link href="/account/orders" className="text-[10px] uppercase tracking-widest text-teal font-bold hover:underline mt-1 inline-block">
              View History
            </Link>
          </CardContent>
        </Card>

        <Card className="border-sage/20 shadow-sm rounded-none">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-charcoal/60">Saved Items</CardTitle>
            <Heart className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-heading font-bold">0</div>
            <Link href="/account/wishlist" className="text-[10px] uppercase tracking-widest text-teal font-bold hover:underline mt-1 inline-block">
              Go to Wishlist
            </Link>
          </CardContent>
        </Card>
      </div>

      <div>
        <div className="flex justify-between items-center mb-6 border-b border-sage/20 pb-2">
          <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-charcoal">Recent Activity</h2>
          <Link href="/account/orders" className="text-xs text-muted-foreground hover:text-teal underline underline-offset-4 font-medium uppercase tracking-wider">
            All Orders
          </Link>
        </div>

        {orders.length > 0 ? (
          <div className="bg-white border border-sage/20 rounded-none shadow-sm divide-y divide-sage/10 overflow-hidden">
            {orders.map((order) => (
              <Link 
                key={order.id} 
                href={`/account/orders/${order.id}`}
                className="p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-sage/5 transition-colors group"
              >
                <div className="flex gap-4 items-center">
                  <div className="w-12 h-12 bg-sage/10 flex items-center justify-center text-teal font-bold text-xs uppercase rounded-full">
                    #{order.id.slice(0, 4)}
                  </div>
                  <div>
                    <p className="font-bold text-sm tracking-tight group-hover:text-teal transition-colors">Order {order.id.slice(0, 8).toUpperCase()}</p>
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
                      Placed on {new Date(order.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-6 self-end sm:self-auto">
                  <div className="text-right">
                    <p className="font-bold text-sm">₹{Number(order.total_amount).toLocaleString()}</p>
                    <span className={`text-[9px] px-2 py-0.5 rounded-full uppercase tracking-tighter font-bold ${
                      order.status === 'delivered' ? 'bg-green-100 text-green-700' : 
                      order.status === 'pending' ? 'bg-orange-100 text-orange-700' : 
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {order.status}
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="bg-white border border-dashed border-sage/40 rounded-none p-12 text-center">
            <Package className="w-10 h-10 mx-auto text-sage/40 mb-3" />
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest mb-4">You haven't placed any orders yet.</p>
            <Link 
              href="/collections/all"
              className={buttonVariants({ className: "bg-teal text-cream rounded-none uppercase tracking-widest text-xs font-bold h-12 px-8" })}
            >
              Start Your Collection
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
