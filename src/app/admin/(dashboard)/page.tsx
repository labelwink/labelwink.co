import Link from 'next/link'
import {
  ShoppingBag, IndianRupee, Package, AlertTriangle,
  Users, TrendingUp, TrendingDown, RotateCcw, Star,
  ArrowRight, Gift, Zap, BarChart2,
} from 'lucide-react'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'
import { formatCurrency, formatDate } from '@/lib/utils/format'
import type { OrderStatus } from '@/lib/utils/constants'

// Local query result types
interface OrderRow {
  id: string
  order_number?: string | null
  total_amount: number | null
  status: string | null
  shipping_name: string | null
  created_at: string
  profiles: { email: string; full_name: string | null } | null
}
interface VariantRow {
  id: string
  size: string
  color: string | null
  stock_qty: number
  low_stock_threshold: number
  product_id: string
  products: { name: string; id: string } | null
}
interface OrderItemRow {
  product_id: string | null
  quantity: number
  products: { name: string } | null
}

export const metadata = { title: 'Dashboard' }
export const revalidate = 60

async function getDashboardData() {
  const supabase = createAdminSupabaseClient()
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString()
  const lastMonthEnd   = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59).toISOString()

  const supabaseAny = supabase as any

  const results = await Promise.all([
    supabaseAny.from('orders').select('id, total_amount, status').gte('created_at', thisMonthStart).neq('status', 'cancelled'),
    supabaseAny.from('orders').select('total_amount').gte('created_at', lastMonthStart).lte('created_at', lastMonthEnd).neq('status', 'cancelled'),
    supabaseAny.from('orders').select('id, total_amount').gte('created_at', todayStart).neq('status', 'cancelled'),
    supabaseAny.from('products').select('id', { count: 'exact', head: true }).eq('visible', true),
    supabaseAny.from('product_variants').select('id, size, color, stock_qty, low_stock_threshold, product_id, products:product_id(name, id)').lte('stock_qty', 10).eq('is_active', true).order('stock_qty', { ascending: true }).limit(20),
    supabaseAny.from('orders').select('id, order_number, total_amount, status, shipping_name, created_at, profiles(email, full_name)').order('created_at', { ascending: false }).limit(5),
    supabaseAny.from('profiles').select('id', { count: 'exact', head: true }),
    supabaseAny.from('returns').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    supabaseAny.from('reviews').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    supabaseAny.from('order_items').select('product_id, quantity, products:product_id(name)').limit(100),
  ])

  const thisMonthOrders = results[0].data as OrderRow[] | null
  const lastMonthOrders = results[1].data as OrderRow[] | null
  const todayOrders = results[2].data as OrderRow[] | null
  const activeProducts = results[3].count
  const lowStockVariants = results[4].data as VariantRow[] | null
  const recentOrders = results[5].data as OrderRow[] | null
  const totalCustomers = results[6].count
  const pendingReturns = results[7].count
  const pendingReviews = results[8].count
  const topProducts = results[9].data as OrderItemRow[] | null

  const sumRevenue = (orders: Array<{ total_amount: number | null }> | null) =>
    orders?.reduce((s, o) => s + Number(o.total_amount ?? 0), 0) ?? 0

  const thisRevenue  = sumRevenue(thisMonthOrders)
  const lastRevenue  = sumRevenue(lastMonthOrders)
  const todayRevenue = sumRevenue(todayOrders)

  const revenueGrowth = lastRevenue === 0 ? 100 : Math.round(((thisRevenue - lastRevenue) / lastRevenue) * 100)
  const orderGrowth   = lastMonthOrders ? Math.round(((( thisMonthOrders?.length ?? 0) - lastMonthOrders.length) / Math.max(lastMonthOrders.length, 1)) * 100) : 0

  const productSales: Record<string, { name: string; quantity: number }> = {}
  for (const item of topProducts ?? []) {
    const pid = item.product_id
    if (!pid) continue
    const name = (item.products as { name: string } | null)?.name ?? 'Unknown'
    if (!productSales[pid]) productSales[pid] = { name, quantity: 0 }
    productSales[pid].quantity += item.quantity
  }
  const topProductsList = Object.entries(productSales).sort((a, b) => b[1].quantity - a[1].quantity).slice(0, 5)

  return {
    thisRevenue, todayRevenue, revenueGrowth,
    totalOrders: thisMonthOrders?.length ?? 0,
    todayOrders: todayOrders?.length ?? 0,
    orderGrowth,
    activeProducts: activeProducts ?? 0,
    lowStockVariants: (lowStockVariants ?? []).filter(v => v.stock_qty <= (v.low_stock_threshold ?? 5)),
    recentOrders: recentOrders ?? [],
    totalCustomers: totalCustomers ?? 0,
    pendingReturns: pendingReturns ?? 0,
    pendingReviews: pendingReviews ?? 0,
    topProductsList,
  }
}

// ── Status Badge ──────────────────────────────────────────────────────────────
const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  pending:          { bg: '#fdf6e3',  text: '#a0842e' },
  confirmed:        { bg: '#eff6ff',  text: '#1d4ed8' },
  processing:       { bg: '#f3f0ff',  text: '#6d28d9' },
  shipped:          { bg: '#ecfeff',  text: '#0e7490' },
  delivered:        { bg: '#eef5f1',  text: '#2d5a3d' },
  cancelled:        { bg: '#fdf0ef',  text: '#c0392b' },
  return_requested: { bg: '#fdf6e3',  text: '#a0842e' },
}


function StatusBadge({ status }: { status: string }) {
  const s = STATUS_COLORS[status] ?? { bg: 'rgba(96,96,96,0.15)', text: '#9aab9e' }
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '3px 10px', borderRadius: '20px',
      fontSize: '12px', fontWeight: 500,
      background: s.bg, color: s.text,
      whiteSpace: 'nowrap',
    }}>
      {status.replace(/_/g, ' ')}
    </span>
  )
}

// ── KPI Card ──────────────────────────────────────────────────────────────────
function KpiCard({ title, value, icon, trend, trendLabel, href, subtitle }: {
  title: string; value: string | number; icon: React.ReactNode;
  trend?: number; trendLabel?: string; href?: string; subtitle?: string;
}) {
  const isUp = trend !== undefined && trend >= 0
  const trendColor = isUp ? '#2d5a3d' : '#c0392b'
  const TrendIcon = isUp ? TrendingUp : TrendingDown

  const inner = (
    <div style={{
      background: '#ffffff', border: '1px solid #e8e2d6', borderRadius: '12px',
      padding: '24px', position: 'relative', overflow: 'hidden',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div style={{
          width: '40px', height: '40px', borderRadius: '10px',
          background: '#eef5f1', display: 'flex',
          alignItems: 'center', justifyContent: 'center', color: '#2d5a3d',
        }}>
          {icon}
        </div>
        {trend !== undefined && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 600, color: trendColor }}>
            <TrendIcon size={12} />
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <p style={{ fontSize: '12px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#9aab9e', margin: '0 0 6px' }}>
        {title}
      </p>
      <p style={{ fontSize: '28px', fontWeight: 700, color: '#1a2e1e', margin: 0, lineHeight: 1.1 }}>{value}</p>
      {subtitle && <p style={{ fontSize: '12px', color: '#9aab9e', marginTop: '4px' }}>{subtitle}</p>}
      {trendLabel && <p style={{ fontSize: '11px', color: '#d4cebf', marginTop: '4px' }}>{trendLabel}</p>}
    </div>
  )

  if (href) return <Link href={href} style={{ textDecoration: 'none', display: 'block' }}>{inner}</Link>
  return inner
}

// ── Dashboard Page ────────────────────────────────────────────────────────────
export default async function AdminDashboard() {
  const {
    thisRevenue, todayRevenue, revenueGrowth,
    totalOrders, todayOrders, orderGrowth,
    activeProducts, lowStockVariants, recentOrders,
    totalCustomers, pendingReturns, pendingReviews, topProductsList,
  } = await getDashboardData()

  const now = new Date()
  const hour = now.getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const dateStr = now.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

  return (
    <div style={{ minHeight: '100vh', background: '#faf8f4', padding: '32px' }}>
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', maxWidth: '1400px' }}>


      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 600, color: '#1a2e1e', margin: 0 }}>{greeting} 👋</h1>
          <p style={{ fontSize: '13px', color: '#9aab9e', marginTop: '4px' }}>{dateStr}</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {pendingReturns > 0 && (
            <Link href="/admin/returns" style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              fontSize: '12px', fontWeight: 500, padding: '6px 12px', borderRadius: '8px',
              background: '#fdf6e3', color: '#a0842e', border: '1px solid #f0e4b8',
              textDecoration: 'none',
            }}>
              <RotateCcw size={12} />
              {pendingReturns} Return{pendingReturns > 1 ? 's' : ''} Pending
            </Link>
          )}
          {pendingReviews > 0 && (
            <Link href="/admin/reviews" style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              fontSize: '12px', fontWeight: 500, padding: '6px 12px', borderRadius: '8px',
              background: '#eef5f1', color: '#2d5a3d', border: '1px solid #d4e8db',
              textDecoration: 'none',
            }}>
              <Star size={12} />
              {pendingReviews} Review{pendingReviews > 1 ? 's' : ''}
            </Link>
          )}
        </div>
      </div>

      {/* KPI Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        <KpiCard title="Today's Revenue" value={formatCurrency(todayRevenue)} icon={<IndianRupee size={18} />} subtitle="Today only" />
        <KpiCard title="Month Revenue" value={formatCurrency(thisRevenue)} icon={<IndianRupee size={18} />} trend={revenueGrowth} trendLabel="vs last month" />
        <KpiCard title="Today's Orders" value={todayOrders} icon={<ShoppingBag size={18} />} href="/admin/orders" subtitle="Today only" />
        <KpiCard title="Month Orders" value={totalOrders} icon={<ShoppingBag size={18} />} trend={orderGrowth} trendLabel="vs last month" href="/admin/orders" />
        <KpiCard title="Active Products" value={activeProducts} icon={<Package size={18} />} href="/admin/products" subtitle="Published" />
        <KpiCard title="Customers" value={totalCustomers.toLocaleString('en-IN')} icon={<Users size={18} />} href="/admin/customers" subtitle="Registered" />
      </div>

      {/* Low stock alert banner */}
      {lowStockVariants.length > 0 && (
        <div style={{
          background: '#fdf6e3', border: '1px solid #f0e4b8',
          borderRadius: '10px', padding: '12px 20px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <AlertTriangle size={16} style={{ color: '#a0842e', flexShrink: 0 }} />
            <p style={{ fontSize: '14px', fontWeight: 500, color: '#a0842e' }}>
              {lowStockVariants.length} variant{lowStockVariants.length > 1 ? 's are' : ' is'} running low on stock
            </p>
          </div>
          <Link href="/admin/inventory" style={{
            fontSize: '12px', fontWeight: 600, color: '#a0842e', textDecoration: 'none',
            display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0,
          }}>
            Restock <ArrowRight size={12} />
          </Link>
        </div>
      )}

      {/* Main Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '24px' }} className="xl:grid-cols-[1fr_320px] grid-cols-1">

        {/* Recent Orders */}
        <div style={{ background: '#ffffff', border: '1px solid #e8e2d6', borderRadius: '12px', overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #f5f2ec' }}>
            <h2 style={{ fontSize: '15px', fontWeight: 600, color: '#1a2e1e', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
              <ShoppingBag size={15} style={{ color: '#c9a84c' }} />
              Recent Orders
            </h2>
            <Link href="/admin/orders" style={{ fontSize: '12px', color: '#c9a84c', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
              View all <ArrowRight size={11} />
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 24px', gap: '12px' }}>
              <ShoppingBag size={32} style={{ color: '#333' }} />
              <p style={{ fontSize: '14px', color: '#9aab9e' }}>No orders yet</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f5f2ec' }}>
                    {['Order', 'Customer', 'Amount', 'Status', 'Date'].map(h => (
                      <th key={h} style={{
                        padding: '12px 16px', textAlign: 'left',
                        fontSize: '11px', fontWeight: 500,
                        textTransform: 'uppercase', letterSpacing: '0.05em', color: '#9aab9e',
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((order) => (
                    <tr key={order.id} style={{ borderBottom: '1px solid #f5f2ec' }}>
                      <td style={{ padding: '14px 16px' }}>
                        <Link href={`/admin/orders/${order.id}`} style={{ fontSize: '13px', fontWeight: 600, color: '#c9a84c', textDecoration: 'none' }}>
                           #{order.order_number || order.id.slice(0, 8).toUpperCase()}
                        </Link>
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: '13px', color: '#5a7060', maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {order.shipping_name || (order.profiles as any)?.full_name || (order.profiles as any)?.email || '—'}
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: '13px', fontWeight: 600, color: '#1a2e1e', textAlign: 'right' }}>
                        {formatCurrency(Number(order.total_amount ?? 0))}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <StatusBadge status={order.status ?? 'pending'} />
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: '12px', color: '#9aab9e' }}>
                        {formatDate(order.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Side Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Quick Actions */}
          <div style={{ background: '#ffffff', border: '1px solid #e8e2d6', borderRadius: '12px', padding: '20px' }}>
            <h2 style={{ fontSize: '14px', fontWeight: 600, color: '#1a2e1e', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Zap size={14} style={{ color: '#c9a84c' }} /> Quick Actions
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {[
                { href: '/admin/products/new', label: '+ Product', icon: Package },
                { href: '/admin/discounts', label: '+ Discount', icon: Gift },
                { href: '/admin/returns', label: 'Returns', icon: RotateCcw },
                { href: '/admin/analytics', label: 'Analytics', icon: BarChart2 },
              ].map(a => (
                <Link key={a.href} href={a.href} style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  padding: '10px 12px', borderRadius: '8px',
                  background: '#f5f2ec', border: '1px solid #e8e2d6',
                  fontSize: '13px', color: '#5a7060', textDecoration: 'none',
                  transition: 'color 150ms, border-color 150ms',
                }}>
                  <a.icon size={13} style={{ color: '#2d5a3d' }} />
                  {a.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Top Products */}
          <div style={{ background: '#ffffff', border: '1px solid #e8e2d6', borderRadius: '12px', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #f5f2ec' }}>
              <h2 style={{ fontSize: '14px', fontWeight: 600, color: '#1a2e1e', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                <Gift size={14} style={{ color: '#c9a84c' }} /> Top Products
              </h2>
              <Link href="/admin/products" style={{ fontSize: '12px', color: '#c9a84c', textDecoration: 'none' }}>All →</Link>
            </div>
            <div>
              {topProductsList.length === 0 ? (
                <p style={{ fontSize: '13px', color: '#9aab9e', textAlign: 'center', padding: '24px' }}>No sales data yet</p>
              ) : (
                topProductsList.map(([pid, info], i) => (
                  <div key={pid} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 20px', borderBottom: '1px solid #f5f2ec' }}>
                    <span style={{
                      width: '20px', height: '20px', borderRadius: '50%',
                      background: '#eef5f1', color: '#2d5a3d',
                      fontSize: '10px', fontWeight: 700,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>{i + 1}</span>
                    <p style={{ flex: 1, fontSize: '13px', color: '#5a7060', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0 }}>{info.name}</p>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: '#c9a84c', flexShrink: 0 }}>{info.quantity} sold</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Low Stock */}
          <div style={{ background: '#ffffff', border: '1px solid #e8e2d6', borderRadius: '12px', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #f5f2ec' }}>
              <h2 style={{ fontSize: '14px', fontWeight: 600, color: '#1a2e1e', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                <AlertTriangle size={14} style={{ color: '#fb923c' }} /> Low Stock
              </h2>
              <Link href="/admin/inventory" style={{ fontSize: '12px', color: '#c9a84c', textDecoration: 'none' }}>Restock →</Link>
            </div>
            <div>
              {lowStockVariants.length === 0 ? (
                <p style={{ fontSize: '13px', color: '#2d5a3d', textAlign: 'center', padding: '24px' }}>✓ All items well stocked</p>
              ) : (
                lowStockVariants.slice(0, 5).map((v) => {
                  const name = (v.products as { name: string } | null)?.name ?? 'Unknown'
                  const isOut = v.stock_qty === 0
                  return (
                    <div key={v.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', borderBottom: '1px solid #f5f2ec' }}>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ fontSize: '13px', fontWeight: 500, color: '#5a7060', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0 }}>{name}</p>
                        <p style={{ fontSize: '11px', color: '#9aab9e' }}>{v.size}{v.color ? ` · ${v.color}` : ''}</p>
                      </div>
                      <span style={{
                        fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '20px', flexShrink: 0, marginLeft: '8px',
                        background: isOut ? '#fdf0ef' : '#fdf6e3',
                        color: isOut ? '#c0392b' : '#a0842e',
                      }}>
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
    </div>
  )
}

