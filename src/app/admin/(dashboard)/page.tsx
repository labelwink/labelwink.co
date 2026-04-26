import Link from 'next/link'
import {
  ShoppingBag, IndianRupee, Package, AlertTriangle,
  Users, TrendingUp, TrendingDown, RotateCcw, Star,
  ArrowRight, Gift,
} from 'lucide-react'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'
import { formatCurrency, formatDate } from '@/lib/utils/format'
import { ORDER_STATUS_COLORS } from '@/lib/utils/constants'
import type { OrderStatus } from '@/lib/utils/constants'

// Local query result types (avoids `never` from unregistered tables)
interface OrderRow {
  id: string
  total: number | null
  status: string | null
  customer_name: string | null
  customer_email: string | null
  created_at: string
}
interface VariantRow {
  id: string
  size: string
  color: string | null
  stock_qty: number
  product_id: string
  products: { name: string; id: string } | null
}
interface OrderItemRow {
  product_id: string | null
  quantity: number
  products: { name: string } | null
}

export const metadata = { title: 'Dashboard' }
export const revalidate = 60   // ISR — refresh every 60s

// ── Data Fetching ─────────────────────────────────────────────────────────────
async function getDashboardData() {
  const supabase = createAdminSupabaseClient()

  const now = new Date()
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString()
  const lastMonthEnd   = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59).toISOString()

  const supabaseAny = supabase as ReturnType<typeof createAdminSupabaseClient>

  const [
    { data: thisMonthOrders },
    { data: lastMonthOrders },
    { count: activeProducts },
    { data: lowStockVariants },
    { data: recentOrders },
    { count: totalCustomers },
    { count: pendingReturns },
    { count: pendingReviews },
    { data: topProducts },
  ] = await Promise.all([
    supabaseAny
      .from('orders')
      .select('id, total, status, customer_name, customer_email, created_at')
      .gte('created_at', thisMonthStart)
      .neq('status', 'cancelled')
      .returns<OrderRow[]>(),

    supabaseAny
      .from('orders')
      .select('total, status')
      .gte('created_at', lastMonthStart)
      .lte('created_at', lastMonthEnd)
      .neq('status', 'cancelled')
      .returns<OrderRow[]>(),

    supabaseAny
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('visible', true),

    supabaseAny
      .from('product_variants')
      .select('id, size, color, stock_qty, product_id, products:product_id(name, id)')
      .lte('stock_qty', 5)
      .order('stock_qty', { ascending: true })
      .limit(8)
      .returns<VariantRow[]>(),

    supabaseAny
      .from('orders')
      .select('id, total, status, customer_name, customer_email, created_at')
      .order('created_at', { ascending: false })
      .limit(8)
      .returns<OrderRow[]>(),

    supabaseAny
      .from('profiles')
      .select('id', { count: 'exact', head: true }),

    supabaseAny
      .from('return_requests')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending'),

    supabaseAny
      .from('reviews')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending'),

    supabaseAny
      .from('order_items')
      .select('product_id, quantity, products:product_id(name)')
      .limit(100)
      .returns<OrderItemRow[]>(),
  ])

  const sumRevenue = (orders: Array<{ total: number | null }> | null) =>
    orders?.reduce((s, o) => s + Number(o.total ?? 0), 0) ?? 0

  const thisRevenue = sumRevenue(thisMonthOrders)
  const lastRevenue = sumRevenue(lastMonthOrders)

  const revenueGrowth = lastRevenue === 0
    ? 100
    : Math.round(((thisRevenue - lastRevenue) / lastRevenue) * 100)

  const orderGrowth = lastMonthOrders
    ? Math.round(((( thisMonthOrders?.length ?? 0) - lastMonthOrders.length) / Math.max(lastMonthOrders.length, 1)) * 100)
    : 0

  // Aggregate top products
  const productSales: Record<string, { name: string; quantity: number }> = {}
  for (const item of topProducts ?? []) {
    const pid = item.product_id
    if (!pid) continue
    const name = (item.products as { name: string } | null)?.name ?? 'Unknown'
    if (!productSales[pid]) productSales[pid] = { name, quantity: 0 }
    productSales[pid].quantity += item.quantity
  }
  const topProductsList = Object.entries(productSales)
    .sort((a, b) => b[1].quantity - a[1].quantity)
    .slice(0, 5)

  return {
    thisRevenue,
    revenueGrowth,
    totalOrders: thisMonthOrders?.length ?? 0,
    orderGrowth,
    activeProducts: activeProducts ?? 0,
    lowStockVariants: lowStockVariants ?? [],
    recentOrders: recentOrders ?? [],
    totalCustomers: totalCustomers ?? 0,
    pendingReturns: pendingReturns ?? 0,
    pendingReviews: pendingReviews ?? 0,
    topProductsList,
  }
}

// ── KPI Mini Card ─────────────────────────────────────────────────────────────
function KpiCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  trendLabel,
  href,
  accent = false,
}: {
  title: string
  value: string | number
  subtitle?: string
  icon: React.ReactNode
  trend?: number
  trendLabel?: string
  href?: string
  accent?: boolean
}) {
  const TrendIcon = trend !== undefined && trend >= 0 ? TrendingUp : TrendingDown
  const trendColor = trend !== undefined && trend >= 0 ? 'text-emerald-600' : 'text-red-500'

  const card = (
    <div className={`
      relative bg-white border rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow
      ${accent ? 'border-[#c9a84c]/40 bg-gradient-to-br from-white to-[#faf7f2]' : 'border-[#e5e7eb]'}
    `}>
      <div className="flex items-start justify-between mb-3">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${accent ? 'bg-[#c9a84c]/15 text-[#c9a84c]' : 'bg-[#1b3a34]/8 text-[#1b3a34]'}`}>
          {icon}
        </div>
        {trend !== undefined && (
          <div className={`flex items-center gap-1 text-xs font-semibold ${trendColor}`}>
            <TrendIcon size={12} />
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <p className="text-xs text-[#6b7280] font-medium tracking-wide mb-1">{title}</p>
      <p className="text-2xl font-bold text-[#1a1a1a] leading-tight">{value}</p>
      {subtitle && <p className="text-[11px] text-[#9ca3af] mt-1">{subtitle}</p>}
      {trendLabel && <p className="text-[11px] text-[#9ca3af] mt-0.5">{trendLabel}</p>}
    </div>
  )

  if (href) {
    return (
      <Link href={href} className="block">
        {card}
      </Link>
    )
  }
  return card
}

// ── Dashboard Page ────────────────────────────────────────────────────────────
export default async function AdminDashboard() {
  const {
    thisRevenue,
    revenueGrowth,
    totalOrders,
    orderGrowth,
    activeProducts,
    lowStockVariants,
    recentOrders,
    totalCustomers,
    pendingReturns,
    pendingReviews,
    topProductsList,
  } = await getDashboardData()

  const now = new Date()
  const monthName = now.toLocaleString('en-IN', { month: 'long', year: 'numeric' })

  return (
    <div className="space-y-6 max-w-[1400px]">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#1a1a1a]">Dashboard</h1>
          <p className="text-[#6b7280] text-xs mt-0.5">{monthName} overview</p>
        </div>
        <div className="flex items-center gap-2">
          {pendingReturns > 0 && (
            <Link
              href="/admin/returns"
              className="flex items-center gap-1.5 text-xs font-medium text-orange-700 bg-orange-50 border border-orange-200 px-3 py-1.5 rounded-lg hover:bg-orange-100 transition-colors"
            >
              <RotateCcw size={12} />
              {pendingReturns} Return{pendingReturns > 1 ? 's' : ''} Pending
            </Link>
          )}
          {pendingReviews > 0 && (
            <Link
              href="/admin/reviews"
              className="flex items-center gap-1.5 text-xs font-medium text-purple-700 bg-purple-50 border border-purple-200 px-3 py-1.5 rounded-lg hover:bg-purple-100 transition-colors"
            >
              <Star size={12} />
              {pendingReviews} Review{pendingReviews > 1 ? 's' : ''}
            </Link>
          )}
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Revenue This Month"
          value={formatCurrency(thisRevenue)}
          icon={<IndianRupee size={16} />}
          trend={revenueGrowth}
          trendLabel="vs last month"
          accent
        />
        <KpiCard
          title="Orders This Month"
          value={totalOrders}
          icon={<ShoppingBag size={16} />}
          trend={orderGrowth}
          trendLabel="vs last month"
          href="/admin/orders"
        />
        <KpiCard
          title="Active Products"
          value={activeProducts}
          icon={<Package size={16} />}
          subtitle="Published & visible"
          href="/admin/products"
        />
        <KpiCard
          title="Customers"
          value={totalCustomers.toLocaleString('en-IN')}
          icon={<Users size={16} />}
          subtitle="Registered accounts"
          href="/admin/customers"
        />
      </div>

      {/* Alert Row */}
      {lowStockVariants.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <AlertTriangle size={16} className="text-amber-600 flex-shrink-0" />
            <p className="text-sm font-medium text-amber-800">
              {lowStockVariants.length} variant{lowStockVariants.length > 1 ? 's are' : ' is'} running low on stock
            </p>
          </div>
          <Link
            href="/admin/inventory"
            className="text-xs font-semibold text-amber-700 hover:underline flex items-center gap-1"
          >
            Restock <ArrowRight size={12} />
          </Link>
        </div>
      )}

      {/* Main Grid: Recent Orders + Side Panel */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6">

        {/* Recent Orders Table */}
        <div className="bg-white border border-[#e5e7eb] rounded-xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#e5e7eb]">
            <h2 className="font-semibold text-[#1a1a1a] text-sm flex items-center gap-2">
              <ShoppingBag size={15} className="text-[#1b3a34]" />
              Recent Orders
            </h2>
            <Link
              href="/admin/orders"
              className="text-xs text-[#1b3a34] hover:underline font-medium flex items-center gap-1"
            >
              View all <ArrowRight size={11} />
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            <div className="text-center py-14 text-[#9ca3af]">
              <ShoppingBag size={32} className="mx-auto mb-3 opacity-20" />
              <p className="text-sm">No orders yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[10px] font-semibold uppercase tracking-wider text-[#9ca3af] border-b border-[#e5e7eb]">
                    <th className="text-left px-6 py-3">Order</th>
                    <th className="text-left px-4 py-3">Customer</th>
                    <th className="text-right px-4 py-3">Amount</th>
                    <th className="text-left px-4 py-3">Status</th>
                    <th className="text-left px-4 py-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f3f4f6]">
                  {recentOrders.map((order) => {
                    const statusKey = (order.status ?? 'pending') as OrderStatus
                    const statusColor = ORDER_STATUS_COLORS[statusKey] ?? 'bg-gray-100 text-gray-600'
                    return (
                      <tr key={order.id} className="hover:bg-[#f9f9f9] transition-colors">
                        <td className="px-6 py-3">
                          <Link
                            href={`/admin/orders/${order.id}`}
                            className="text-[#1b3a34] font-semibold hover:underline text-xs"
                          >
                            #{order.id.slice(0, 8).toUpperCase()}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-[#374151] max-w-[140px] truncate">
                          {order.customer_name || order.customer_email || '—'}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-[#1a1a1a]">
                          {formatCurrency(Number(order.total ?? 0))}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusColor}`}>
                            {statusKey.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-[#9ca3af] text-xs">
                          {formatDate(order.created_at)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Side Panel */}
        <div className="space-y-5">

          {/* Top Products */}
          <div className="bg-white border border-[#e5e7eb] rounded-xl shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#e5e7eb]">
              <h2 className="font-semibold text-[#1a1a1a] text-sm flex items-center gap-2">
                <Gift size={14} className="text-[#c9a84c]" />
                Top Products
              </h2>
              <Link href="/admin/products" className="text-xs text-[#1b3a34] hover:underline font-medium">
                All →
              </Link>
            </div>
            <div className="divide-y divide-[#f3f4f6]">
              {topProductsList.length === 0 ? (
                <p className="text-xs text-[#9ca3af] text-center py-8">No sales data yet</p>
              ) : (
                topProductsList.map(([pid, info], i) => (
                  <div key={pid} className="flex items-center gap-3 px-5 py-3">
                    <span className="w-5 h-5 rounded-full bg-[#1b3a34]/8 text-[#1b3a34] text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                      {i + 1}
                    </span>
                    <p className="flex-1 text-xs text-[#374151] font-medium truncate">{info.name}</p>
                    <span className="text-[11px] font-semibold text-[#c9a84c]">{info.quantity} sold</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Low Stock Alerts */}
          <div className="bg-white border border-[#e5e7eb] rounded-xl shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#e5e7eb]">
              <h2 className="font-semibold text-[#1a1a1a] text-sm flex items-center gap-2">
                <AlertTriangle size={14} className="text-orange-500" />
                Low Stock
              </h2>
              <Link href="/admin/inventory" className="text-xs text-[#1b3a34] hover:underline font-medium">
                Restock →
              </Link>
            </div>
            <div className="divide-y divide-[#f3f4f6]">
              {lowStockVariants.length === 0 ? (
                <p className="text-xs text-[#9ca3af] text-center py-8">All items well stocked ✓</p>
              ) : (
                lowStockVariants.slice(0, 6).map((v) => {
                  const productName = (v.products as { name: string } | null)?.name ?? 'Unknown'
                  const isOut = v.stock_qty === 0
                  return (
                    <div key={v.id} className="flex items-center justify-between px-5 py-3">
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-[#374151] truncate">{productName}</p>
                        <p className="text-[11px] text-[#9ca3af]">
                          {v.size}{v.color ? ` · ${v.color}` : ''}
                        </p>
                      </div>
                      <span className={`ml-3 flex-shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full ${isOut ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                        {isOut ? 'Out' : `${v.stock_qty} left`}
                      </span>
                    </div>
                  )
                })
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
