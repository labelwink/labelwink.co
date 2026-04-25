import { createAdminClient } from '@/lib/supabase/server'
import { KPICard } from '@/components/admin/KPICard'
import { ShoppingBag, IndianRupee, Package, AlertTriangle } from 'lucide-react'
import Link from 'next/link'

const STATUS_BADGE: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  processing: 'bg-blue-100 text-blue-800',
  shipped: 'bg-orange-100 text-orange-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
}

export const metadata = { title: 'Dashboard' }

export default async function AdminDashboard() {
  const supabase = createAdminClient()
  const today = new Date().toISOString().slice(0, 10)

  const [
    { data: allOrders },
    { data: allProducts },
    { data: lowStockVariants },
    { data: recentOrders },
  ] = await Promise.all([
    supabase.from('orders').select('total, status, payment_status'),
    supabase.from('products').select('id', { count: 'exact', head: false }).eq('visible', true),
    supabase.from('product_variants').select('*, products(name)').lte('stock_qty', 5),
    supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(10),
  ])

  const validStatuses = ['delivered', 'completed', 'paid', 'shipped', 'processing']
  
  // Total Revenue: sum of total from orders (completed/delivered/paid)
  const totalRevenue = allOrders
    ?.filter(o => o.payment_status === 'paid' || validStatuses.includes(o.status?.toLowerCase()))
    .reduce((s, o) => s + Number(o.total), 0) ?? 0

  // Total Orders: exclude cancelled
  const totalOrderCount = allOrders?.filter(o => o.status !== 'cancelled').length ?? 0
  const productCount = allProducts?.length ?? 0
  const lowStockCount = lowStockVariants?.filter(v => (v.stock_qty ?? 0) > 0).length ?? 0

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#1a1a1a]">Dashboard</h1>
        <p className="text-[#6b7280] text-sm mt-1">Welcome back. Here&apos;s what&apos;s happening across your store.</p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        <KPICard
          title="Total Orders"
          value={totalOrderCount}
          icon={<ShoppingBag size={18} />}
          linkHref="/admin/orders"
          linkLabel="View all orders"
        />
        <KPICard
          title="Total Revenue"
          value={`₹${totalRevenue.toLocaleString('en-IN')}`}
          icon={<IndianRupee size={18} />}
          subtitle="Valid orders only"
        />
        <KPICard
          title="Active Products"
          value={productCount}
          icon={<Package size={18} />}
          linkHref="/admin/products"
          linkLabel="Manage products"
        />
        <KPICard
          title="Low Stock Items"
          value={lowStockCount}
          icon={<AlertTriangle size={18} />}
          subtitle="Variants ≤ 5 units"
          linkHref="/admin/inventory"
          linkLabel="View inventory"
        />
      </div>

      {/* Two-column section */}
      <div className="grid grid-cols-1 lg:grid-cols-[55%_1fr] gap-8">
        {/* Recent Orders */}
        <div className="bg-white border border-[#e5e7eb] rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-semibold text-[#1a1a1a] flex items-center gap-2">
              <ShoppingBag size={18} className="text-[#1b3a34]" /> Recent Orders
            </h2>
            <Link href="/admin/orders" className="text-xs text-[#1b3a34] hover:underline font-medium">
              View all →
            </Link>
          </div>

          {!recentOrders || recentOrders.length === 0 ? (
            <div className="text-center py-12 text-[#6b7280]">
              <ShoppingBag size={36} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">No orders yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[#6b7280] border-b border-[#e5e7eb]">
                    <th className="text-left pb-3 font-medium">Order #</th>
                    <th className="text-left pb-3 font-medium">Customer</th>
                    <th className="text-left pb-3 font-medium">Amount</th>
                    <th className="text-left pb-3 font-medium">Status</th>
                    <th className="text-left pb-3 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e5e7eb]">
                  {recentOrders.map((order: any) => (
                    <tr key={order.id} className="hover:bg-[#f9f9f9]">
                      <td className="py-3">
                        <Link href={`/admin/orders/${order.id}`} className="text-[#1b3a34] font-medium hover:underline">
                          #{order.order_number}
                        </Link>
                      </td>
                      <td className="py-3 text-[#1a1a1a]">{order.customer_name || order.guest_email || '—'}</td>
                      <td className="py-3 font-medium">₹{Number(order.total).toLocaleString('en-IN')}</td>
                      <td className="py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${STATUS_BADGE[order.status] || 'bg-gray-100 text-gray-700'}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="py-3 text-[#6b7280]">
                        {new Date(order.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-white border border-[#e5e7eb] rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-semibold text-[#1a1a1a] flex items-center gap-2">
              <AlertTriangle size={18} className="text-orange-500" /> Low Stock
            </h2>
            <Link href="/admin/inventory" className="text-xs text-[#1b3a34] hover:underline font-medium">
              Restock →
            </Link>
          </div>

          {!lowStockVariants || lowStockVariants.length === 0 ? (
            <div className="text-center py-12 text-[#6b7280]">
              <Package size={36} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">All items well stocked</p>
            </div>
          ) : (
            <div className="space-y-3">
              {lowStockVariants.slice(0, 8).map((v: any) => (
                <div
                  key={v.id}
                  className={`flex items-center justify-between p-3 rounded-lg text-sm ${
                    v.stock_qty === 0 ? 'bg-red-50 border border-red-100' : 'bg-yellow-50 border border-yellow-100'
                  }`}
                >
                  <div>
                    <p className="font-medium text-[#1a1a1a]">{(v as any).products?.name || 'Unknown'}</p>
                    <p className="text-xs text-[#6b7280]">Size: {v.size}</p>
                  </div>
                  <span className={`font-bold text-xs px-2 py-1 rounded ${v.stock_qty === 0 ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {v.stock_qty === 0 ? 'Out of stock' : `${v.stock_qty} left`}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
