import { createAdminClient } from '@/lib/supabase/server';
import { ShoppingBag, IndianRupee, Package, Star, Loader2 } from 'lucide-react';
import { KPISkeleton } from '@/components/ui/Skeleton';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default async function AdminDashboard() {
  const supabase = createAdminClient();

  const thisMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

  const [
    { data: revenueData },
    { data: ordersData },
    { data: lowStockData },
    { data: recentOrders },
    { data: pendingReviews },
    { data: productsCount },
  ] = await Promise.all([
    supabase.from('orders').select('total').eq('payment_status', 'paid').gte('created_at', thisMonth),
    supabase.from('orders').select('status').gte('created_at', thisMonth),
    supabase.from('product_variants').select('*, products(name)').lt('stock_qty', 5).gt('stock_qty', 0),
    supabase.from('orders').select('*, users(name)').order('created_at', { ascending: false }).limit(10),
    supabase.from('reviews').select('id').eq('status', 'pending'),
    supabase.from('products').select('*', { count: 'exact', head: true }),
  ]);

  const totalRevenue = revenueData?.reduce((sum, o) => sum + Number(o.total), 0) ?? 0;
  const totalOrders = ordersData?.length ?? 0;
  const pendingOrders = ordersData?.filter(o => o.status === 'pending').length ?? 0;
  const productCount = productsCount ?? 0;

  // First-time setup check
  const isFirstTime = productCount === 0 && totalOrders === 0;

  if (isFirstTime) {
    return (
      <div className="space-y-8 font-body">
        <div>
          <h1 className="admin-page-title text-3xl">Welcome to Label Wink</h1>
          <p className="text-muted-foreground text-sm mt-1">Your store is ready. Let's get you set up.</p>
        </div>

        <div className="bg-white border border-sage/20 rounded-2xl p-8 shadow-sm max-w-2xl">
          <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
            <div className="w-1.5 h-6 bg-teal rounded-full" /> Setup Checklist
          </h2>
          <div className="space-y-4">
            <ChecklistItem label="Add your first category" href="/admin/categories" done={false} />
            <ChecklistItem label="Upload your first product" href="/admin/products/add" done={false} />
            <ChecklistItem label="Configure homepage banner" href="/admin/cms" done={false} />
            <ChecklistItem label="Set up announcement bar" href="/admin/cms" done={false} />
            <ChecklistItem label="Set WhatsApp number" href="/admin/settings" done={false} />
          </div>
        </div>
      </div>
    );
  }

  const kpis = [
    { title: 'Monthly Revenue', value: `₹${totalRevenue.toLocaleString()}`, icon: IndianRupee, color: 'text-teal', bg: 'bg-teal/5' },
    { title: 'Monthly Orders', value: totalOrders, icon: ShoppingBag, color: 'text-purple-600', bg: 'bg-purple-50' },
    { title: 'Active Products', value: productCount, icon: Package, color: 'text-blue-600', bg: 'bg-blue-50' },
    { title: 'Pending Reviews', value: pendingReviews?.length || 0, icon: Star, color: 'text-orange-500', bg: 'bg-orange-50' },
  ];

  return (
    <div className="space-y-8 font-body">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="admin-page-title text-3xl">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">Overview of your store's performance this month.</p>
        </div>
        <Button variant="outline" asChild className="rounded-xl border-sage/20">
          <Link href="/" target="_blank">View Storefront</Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi, i) => (
          <div key={i} className="bg-white border border-sage/20 p-6 rounded-2xl shadow-sm hover:border-teal/30 transition-colors">
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-xl ${kpi.bg}`}>
                <kpi.icon className={`w-6 h-6 ${kpi.color}`} />
              </div>
            </div>
            <div>
              <p className="admin-section-label mb-1">{kpi.title}</p>
              <h3 className="text-3xl font-bold text-charcoal tracking-tight">{kpi.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white border border-sage/20 p-8 rounded-2xl shadow-sm">
          <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-teal" /> Recent Orders
          </h3>
          <div className="space-y-4">
            {recentOrders && recentOrders.length > 0 ? recentOrders.map((order: any) => (
              <div key={order.id} className="flex items-center justify-between p-4 hover:bg-sage/5 rounded-xl transition-colors border border-transparent hover:border-sage/10 group">
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 bg-sage/5 rounded-full flex items-center justify-center text-xs font-bold text-charcoal">
                      #{order.order_number?.slice(-4) || '—'}
                   </div>
                   <div>
                    <p className="text-sm font-bold text-charcoal">{order.users?.name || 'Guest Customer'}</p>
                    <p className="text-[10px] uppercase tracking-widest text-gray-400 font-medium">
                      {new Date(order.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                    </p>
                   </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-charcoal">₹{Number(order.total).toLocaleString('en-IN')}</p>
                  <p className="text-[10px] uppercase tracking-widest font-bold text-teal mt-0.5">{order.status}</p>
                </div>
              </div>
            )) : (
              <div className="text-center py-20 bg-sage/5 rounded-xl border border-dashed border-sage/20">
                <ShoppingBag className="w-10 h-10 mx-auto mb-2 text-sage/30" />
                <p className="text-sm text-muted-foreground font-medium">No orders yet this month.</p>
              </div>
            )}
          </div>
          {recentOrders && recentOrders.length > 0 && (
            <Link href="/admin/orders" className="block text-center mt-6 text-xs font-bold uppercase tracking-widest text-teal hover:underline">
              View All Orders →
            </Link>
          )}
        </div>

        <div className="bg-white border border-sage/20 p-8 rounded-2xl shadow-sm">
          <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
            <Package className="w-5 h-5 text-red-500" /> Low Stock Alert
          </h3>
          <div className="space-y-4">
            {lowStockData && lowStockData.length > 0 ? lowStockData.map((variant: any) => (
              <div key={variant.id} className="flex justify-between items-center text-sm p-3 bg-red-50/50 rounded-lg border border-red-100/50">
                <div>
                  <p className="font-bold text-charcoal">{variant.products?.name}</p>
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">{variant.size} / {variant.color}</p>
                </div>
                <span className="text-red-600 font-bold px-2 py-1 bg-white rounded text-xs">{variant.stock_qty} left</span>
              </div>
            )) : (
              <div className="text-center py-20 bg-sage/5 rounded-xl border border-dashed border-sage/20">
                <Package className="w-10 h-10 mx-auto mb-2 text-sage/30" />
                <p className="text-sm text-muted-foreground font-medium">All items well stocked.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ChecklistItem({ label, href, done }: { label: string, href: string, done: boolean }) {
  return (
    <Link href={href} className="flex items-center gap-3 p-4 border border-sage/20 rounded-xl hover:border-teal transition-all group hover:bg-teal/[0.02]">
      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${done ? 'bg-teal border-teal' : 'border-sage/40 group-hover:border-teal/40'}`}>
        {done && <div className="w-2 h-2 bg-white rounded-full" />}
      </div>
      <span className={`text-sm ${done ? 'text-charcoal/40 line-through' : 'text-charcoal font-medium'}`}>{label}</span>
      {!done && <span className="ml-auto text-teal opacity-0 group-hover:opacity-100 transition-opacity">→</span>}
    </Link>
  );
}
