'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { TrendingUp, TrendingDown, AlertTriangle, ArrowRight, RefreshCw } from 'lucide-react'
import { formatCurrency } from '@/lib/utils/format'

// ── Types ─────────────────────────────────────────────────────────────────────
interface DayBar { date: string; revenue: number; order_count: number }
interface Overview {
  period: string; revenue: number; order_count: number; avg_order_value: number
  total_discounts: number; total_shipping: number
  orders_by_status: Record<string, number>
  new_customers: number; total_customers: number; pending_orders: number
  revenue_growth_pct: number | null
  daily_chart: DayBar[]
  low_stock_count: number; out_of_stock_count: number
}
interface Product { id: string; name: string; slug: string; images?: unknown; units_sold: number; revenue: number }
interface SearchTerm { query: string; count: number; avg_results: number }
interface Products { bestsellers: Product[]; top_revenue: Product[]; top_searches: SearchTerm[]; never_sold: {id:string;name:string}[] }
interface Customer { id: string; full_name: string | null; email: string | null; order_count: number; lifetime: number }
interface Customers {
  new_customers_chart: {date:string;count:number}[]
  segments: { high_value: number; regular: number; one_time: number; inactive: number }
  repeat_rate: number
  top_customers: Customer[]
}

type Period = 'today' | 'week' | 'month' | 'year'
const PERIODS: { label: string; value: Period }[] = [
  { label: 'Today',  value: 'today' },
  { label: '7 Days', value: 'week'  },
  { label: '30 Days',value: 'month' },
  { label: '1 Year', value: 'year'  },
]

const STATUS_COLORS: Record<string, string> = {
  pending: '#f59e0b', confirmed: '#0ea5e9', packed: '#8b5cf6',
  dispatched: '#6366f1', delivered: '#22c55e', cancelled: '#ef4444',
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}
function fmtShort(n: number) {
  if (n >= 1e7) return `₹${(n/1e7).toFixed(1)}Cr`
  if (n >= 1e5) return `₹${(n/1e5).toFixed(1)}L`
  if (n >= 1e3) return `₹${(n/1e3).toFixed(1)}K`
  return `₹${n.toFixed(0)}`
}

// ── Sub-components ────────────────────────────────────────────────────────────
function SectionCard({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="bg-white border border-[#e5e7eb] rounded-xl shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#f3f4f6]">
        <h2 className="font-semibold text-[#1b3a34] text-sm">{title}</h2>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </div>
  )
}

function KpiCard({ icon, title, value, sub, trend, amber, href }: {
  icon: string; title: string; value: string; sub: string
  trend?: number | null; amber?: boolean; href?: string
}) {
  const inner = (
    <div className={`bg-white border rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow ${amber && String(value) !== '0' ? 'border-amber-300 bg-amber-50/40' : 'border-[#e5e7eb]'}`}>
      <div className="flex items-start justify-between mb-3">
        <span className="text-2xl">{icon}</span>
        {trend != null && (
          <span className={`flex items-center gap-0.5 text-xs font-bold ${trend >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
            {trend >= 0 ? <TrendingUp size={11}/> : <TrendingDown size={11}/>}
            {Math.abs(trend)}%
          </span>
        )}
      </div>
      <p className="text-[11px] text-[#6b7280] uppercase tracking-wider mb-1">{title}</p>
      <p className="text-2xl font-bold text-[#1b3a34]">{value}</p>
      <p className="text-[11px] text-[#9ca3af] mt-1">{sub}</p>
    </div>
  )
  return href ? <Link href={href}>{inner}</Link> : inner
}

function BarChart({ data }: { data: DayBar[] }) {
  if (!data.length) return <p className="text-sm text-[#9ca3af] text-center py-8">No data for this period</p>
  const max = Math.max(...data.map(d => d.revenue), 1)
  // Thin out labels when many bars
  const labelEvery = data.length > 14 ? Math.ceil(data.length / 12) : 1

  return (
    <div className="space-y-2">
      <div className="flex items-end gap-[3px] h-36">
        {data.map((d, i) => {
          const pct = Math.max((d.revenue / max) * 100, d.revenue > 0 ? 4 : 0)
          return (
            <div key={i} className="flex-1 flex flex-col items-center justify-end h-full group relative">
              <div
                className="w-full rounded-t-sm bg-[#c9a84c] hover:bg-[#b8973d] transition-colors cursor-default"
                style={{ height: `${pct}%` }}
              />
              {/* Tooltip */}
              <div className="absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 bg-[#1b3a34] text-white text-xs rounded px-2 py-1 whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none z-10 transition-opacity">
                {fmtDate(d.date)}: {fmtShort(d.revenue)} · {d.order_count} orders
              </div>
            </div>
          )
        })}
      </div>
      {/* X-axis labels */}
      <div className="flex gap-[3px]">
        {data.map((d, i) => (
          <div key={i} className="flex-1 text-center text-xs text-[#9ca3af] truncate">
            {i % labelEvery === 0 ? fmtDate(d.date) : ''}
          </div>
        ))}
      </div>
    </div>
  )
}

function DonutChart({ byStatus }: { byStatus: Record<string, number> }) {
  const entries = Object.entries(byStatus).filter(([, v]) => v > 0)
  const total = entries.reduce((s, [, v]) => s + v, 0)
  if (!total) return <p className="text-sm text-[#9ca3af] text-center py-4">No orders</p>

  let cumPct = 0
  const segments = entries.map(([status, count]) => {
    const pct = (count / total) * 100
    const seg = { status, count, pct, start: cumPct }
    cumPct += pct
    return seg
  })

  const gradient = segments.map(s =>
    `${STATUS_COLORS[s.status] ?? '#9ca3af'} ${s.start.toFixed(1)}% ${(s.start + s.pct).toFixed(1)}%`
  ).join(', ')

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6">
      {/* Ring */}
      <div className="relative flex-shrink-0 w-28 h-28">
        <div
          className="w-28 h-28 rounded-full"
          style={{ background: `conic-gradient(${gradient})` }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-white flex flex-col items-center justify-center">
            <span className="text-base font-bold text-[#1b3a34]">{total}</span>
            <span className="text-[8px] text-[#9ca3af]">orders</span>
          </div>
        </div>
      </div>
      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-2">
        {segments.map(s => (
          <div key={s.status} className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: STATUS_COLORS[s.status] ?? '#9ca3af' }} />
            <span className="text-xs text-[#374151] capitalize">{s.status}</span>
            <span className="text-xs font-semibold text-[#1b3a34]">{s.count}</span>
            <span className="text-[10px] text-[#9ca3af]">({s.pct.toFixed(0)}%)</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function CircleProgress({ pct, label }: { pct: number; label: string }) {
  const r = 24, circ = 2 * Math.PI * r
  const dash = (pct / 100) * circ
  return (
    <div className="flex flex-col items-center gap-2">
      <svg width="64" height="64" className="-rotate-90">
        <circle cx="32" cy="32" r={r} fill="none" stroke="#f3f4f6" strokeWidth="6" />
        <circle cx="32" cy="32" r={r} fill="none" stroke="#c9a84c" strokeWidth="6"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" />
      </svg>
      <div className="text-center -mt-10 mb-2">
        <span className="text-sm font-bold text-[#1b3a34]">{pct.toFixed(1)}%</span>
      </div>
      <p className="text-[11px] text-[#6b7280] text-center">{label}</p>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function AnalyticsPage() {
  const [period, setPeriod]       = useState<Period>('month')
  const [overview, setOverview]   = useState<Overview | null>(null)
  const [products, setProducts]   = useState<Products | null>(null)
  const [customers, setCustomers] = useState<Customers | null>(null)
  const [loading, setLoading]     = useState(true)
  const [err, setErr]             = useState<string | null>(null)

  const fetchAll = useCallback(async (p: Period) => {
    setLoading(true); setErr(null)
    try {
      const custPeriod = p === 'today' || p === 'week' ? 'month' : p === 'year' ? 'year' : 'month'
      const [o, pr, cu] = await Promise.all([
        fetch(`/api/admin/analytics/overview?period=${p}`).then(r => r.json()),
        fetch(`/api/admin/analytics/products?period=${p === 'today' ? 'week' : p}`).then(r => r.json()),
        fetch(`/api/admin/analytics/customers?period=${custPeriod}`).then(r => r.json()),
      ])
      if (o.error) throw new Error(o.error)
      setOverview(o); setProducts(pr); setCustomers(cu)
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Failed to load analytics')
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchAll(period) }, [period, fetchAll])

  const Skeleton = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <div key={i} className="h-28 bg-gray-100 rounded-xl animate-pulse" />)}
      </div>
      <div className="h-52 bg-gray-100 rounded-xl animate-pulse" />
      <div className="grid grid-cols-2 gap-4">
        <div className="h-40 bg-gray-100 rounded-xl animate-pulse" />
        <div className="h-40 bg-gray-100 rounded-xl animate-pulse" />
      </div>
    </div>
  )

  return (
    <div className="space-y-6 max-w-[1400px]">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-[#1b3a34]">Analytics</h1>
          <p className="text-xs text-[#6b7280] mt-0.5">Business performance overview</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Period pills */}
          <div className="flex gap-1 bg-[#f3f4f6] p-1 rounded-lg">
            {PERIODS.map(p => (
              <button key={p.value}
                onClick={() => setPeriod(p.value)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  period === p.value
                    ? 'bg-white text-[#1b3a34] shadow-sm'
                    : 'text-[#6b7280] hover:text-[#1b3a34]'
                }`}>
                {p.label}
              </button>
            ))}
          </div>
          <button onClick={() => fetchAll(period)} disabled={loading}
            className="p-2 border border-[#e5e7eb] rounded-lg text-[#6b7280] hover:bg-white disabled:opacity-40 transition-colors">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {err && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
          {err} — <button onClick={() => fetchAll(period)} className="underline font-medium">Retry</button>
        </div>
      )}

      {loading && !overview ? <Skeleton /> : overview && (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard icon="💰" title="Total Revenue"
              value={formatCurrency(overview.revenue)}
              sub={`${overview.order_count} orders`}
              trend={overview.revenue_growth_pct} />
            <KpiCard icon="🛍️" title="Avg Order Value"
              value={`₹${Math.round(overview.avg_order_value).toLocaleString('en-IN')}`}
              sub="Per paid order" />
            <KpiCard icon="👥" title="Total Customers"
              value={overview.total_customers.toLocaleString('en-IN')}
              sub={`+${overview.new_customers} new this period`} />
            <KpiCard icon="⏳" title="Pending Orders"
              value={String(overview.pending_orders)}
              sub="Needs attention"
              amber href="/admin/orders?status=pending" />
          </div>

          {/* Revenue Chart */}
          <SectionCard title="Revenue Over Time">
            <BarChart data={overview.daily_chart} />
          </SectionCard>

          {/* Orders by Status */}
          <SectionCard title="Orders by Status">
            <DonutChart byStatus={overview.orders_by_status} />
          </SectionCard>

          {/* 2-col: Bestsellers + Stock */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

            {/* Bestselling Products */}
            <SectionCard title="Best Selling Products"
              action={<Link href="/admin/products" className="text-xs text-[#c9a84c] hover:underline font-medium flex items-center gap-1">View All <ArrowRight size={10}/></Link>}>
              {!products?.bestsellers?.length ? (
                <p className="text-sm text-[#9ca3af] text-center py-4">No sales data yet</p>
              ) : (
                <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-[10px] uppercase tracking-wider text-[#9ca3af] border-b border-[#f3f4f6]">
                      <th className="text-left pb-2">#</th>
                      <th className="text-left pb-2">Product</th>
                      <th className="text-right pb-2">Units</th>
                      <th className="text-right pb-2">Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f9fafb]">
                    {(products?.bestsellers ?? []).slice(0, 5).map((p, i) => (
                      <tr key={p.id}>
                        <td className="py-2 pr-2">
                          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${i === 0 ? 'bg-[#c9a84c] text-white' : 'bg-[#f3f4f6] text-[#6b7280]'}`}>{i+1}</span>
                        </td>
                        <td className="py-2 text-xs text-[#374151] font-medium truncate max-w-[160px]">{p.name}</td>
                        <td className="py-2 text-right text-xs font-semibold text-[#1b3a34]">{p.units_sold}</td>
                        <td className="py-2 text-right text-xs text-[#6b7280]">{fmtShort(p.revenue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              )}
            </SectionCard>

            {/* Stock Alerts */}
            <SectionCard title="Stock Alerts"
              action={<Link href="/admin/inventory" className="text-xs text-[#c9a84c] hover:underline font-medium flex items-center gap-1">Restock <ArrowRight size={10}/></Link>}>
              <div className="space-y-4">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-red-500 mb-2">
                    Out of Stock ({overview.out_of_stock_count})
                  </p>
                  {overview.out_of_stock_count === 0
                    ? <p className="text-xs text-[#9ca3af] italic">None — all good ✓</p>
                    : <Link href="/admin/inventory?stock=out" className="text-xs text-red-600 underline flex items-center gap-1">View all out-of-stock variants <ArrowRight size={10}/></Link>
                  }
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-amber-500 mb-2">
                    Low Stock — {overview.low_stock_count} variants ≤ 5 units
                  </p>
                  {overview.low_stock_count === 0
                    ? <p className="text-xs text-[#9ca3af] italic">All variants well stocked ✓</p>
                    : <Link href="/admin/inventory?stock=low" className="text-xs text-amber-600 underline flex items-center gap-1">View low stock variants <ArrowRight size={10}/></Link>
                  }
                </div>
                {/* Summary bar */}
                <div className="flex items-center gap-2 pt-1">
                  <div className="flex-1 h-2 bg-[#f3f4f6] rounded-full overflow-hidden">
                    <div className="h-full bg-red-400 rounded-full" style={{ width: `${Math.min((overview.out_of_stock_count / Math.max(overview.out_of_stock_count + overview.low_stock_count, 1)) * 100, 100)}%` }} />
                  </div>
                  <span className="text-[10px] text-[#9ca3af]">{overview.out_of_stock_count + overview.low_stock_count} total alerts</span>
                </div>
              </div>
            </SectionCard>
          </div>

          {/* Customer Insights */}
          {customers && (
            <SectionCard title="Customer Insights">
              <div className="space-y-6">
                {/* 3 metrics */}
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="flex flex-col items-center gap-1">
                    <CircleProgress pct={customers.repeat_rate} label="Repeat Purchase Rate" />
                  </div>
                  <div className="bg-[#faf7f2] border border-[#c9a84c]/20 rounded-xl p-4 flex flex-col items-center justify-center gap-1">
                    <p className="text-2xl font-bold text-[#c9a84c]">{customers.segments.high_value}</p>
                    <p className="text-[11px] text-[#6b7280] text-center">High Value Customers<br/><span className="text-[10px] text-[#9ca3af]">&gt;₹5,000 lifetime</span></p>
                  </div>
                  <div className="bg-[#fff8f0] border border-amber-200 rounded-xl p-4 flex flex-col items-center justify-center gap-1">
                    <p className="text-2xl font-bold text-amber-600">{customers.segments.inactive}</p>
                    <p className="text-[11px] text-[#6b7280] text-center">Inactive Customers<br/><span className="text-[10px] text-[#9ca3af]">90+ days no order</span></p>
                  </div>
                </div>

                {/* Top customers table */}
                <div>
                  <p className="text-xs font-bold text-[#1b3a34] mb-3 uppercase tracking-wider">Top Customers by Lifetime Value</p>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-[10px] uppercase tracking-wider text-[#9ca3af] border-b border-[#f3f4f6]">
                        <th className="text-left pb-2">#</th>
                        <th className="text-left pb-2">Name</th>
                        <th className="text-left pb-2 hidden sm:table-cell">Email</th>
                        <th className="text-right pb-2">Orders</th>
                        <th className="text-right pb-2">Lifetime</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#f9fafb]">
                      {customers.top_customers.slice(0, 5).map((c, i) => (
                        <tr key={c.id} className={i === 0 ? 'bg-[#c9a84c]/5' : ''}>
                          <td className="py-2 pr-2">
                            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${i === 0 ? 'bg-[#c9a84c] text-white' : 'bg-[#f3f4f6] text-[#6b7280]'}`}>{i+1}</span>
                          </td>
                          <td className="py-2 text-xs text-[#1b3a34] font-medium">{c.full_name || '—'}</td>
                          <td className="py-2 text-xs text-[#9ca3af] hidden sm:table-cell truncate max-w-[160px]">{c.email || '—'}</td>
                          <td className="py-2 text-right text-xs text-[#6b7280]">{c.order_count}</td>
                          <td className="py-2 text-right text-xs font-bold text-[#1b3a34]">{fmtShort(c.lifetime)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </SectionCard>
          )}

          {/* Top Searches */}
          {products?.top_searches?.length ? (
            <SectionCard title="Top Search Queries">
              <div className="flex flex-wrap gap-2">
                {products.top_searches.map((s, i) => {
                  const maxCount = products.top_searches[0].count
                  const scale = 0.7 + (s.count / maxCount) * 0.5
                  return (
                    <span key={i}
                      className="bg-[#faf7f2] border border-[#c9a84c]/20 text-[#1b3a34] rounded-full px-3 py-1 cursor-default hover:bg-[#c9a84c]/10 transition-colors"
                      style={{ fontSize: `${Math.round(scale * 12)}px`, fontWeight: s.count === maxCount ? 700 : 500 }}
                      title={`${s.count} searches · avg ${s.avg_results.toFixed(0)} results`}>
                      {s.query}
                      <span className="ml-1.5 text-[#c9a84c] text-[10px] font-bold">{s.count}</span>
                    </span>
                  )
                })}
              </div>
            </SectionCard>
          ) : null}

          {/* Financial Summary */}
          <SectionCard title="Financial Summary">
            <div className="max-w-sm space-y-2">
              {[
                { label: 'Gross Revenue',     value: overview.revenue,         color: 'text-[#1b3a34]', prefix: '' },
                { label: 'Total Discounts',   value: -overview.total_discounts, color: 'text-red-600',   prefix: '' },
                { label: 'Shipping Income',   value: overview.total_shipping,  color: 'text-[#1b3a34]', prefix: '' },
              ].map(row => (
                <div key={row.label} className="flex justify-between items-center text-sm">
                  <span className="text-[#6b7280]">{row.label}</span>
                  <span className={`font-semibold ${row.color}`}>
                    {row.value < 0 ? `-${formatCurrency(Math.abs(row.value))}` : formatCurrency(row.value)}
                  </span>
                </div>
              ))}
              <div className="border-t border-[#e5e7eb] pt-2 mt-2 flex justify-between items-center">
                <span className="font-bold text-[#1b3a34] text-sm">Net Revenue</span>
                <span className="font-bold text-[#c9a84c] text-base">
                  {formatCurrency(overview.revenue - overview.total_discounts)}
                </span>
              </div>
            </div>
          </SectionCard>
        </>
      )}
    </div>
  )
}
