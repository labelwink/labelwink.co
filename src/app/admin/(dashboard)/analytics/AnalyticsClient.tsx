'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  IndianRupee, ShoppingBag, Users, TrendingUp, TrendingDown,
  BarChart2, RefreshCw, Package,
} from 'lucide-react'
import {
  ResponsiveContainer, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar, Cell,
} from 'recharts'
import { formatCurrency } from '@/lib/utils/format'
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '@/lib/utils/constants'

// ── Types ──────────────────────────────────────────────────────────────────────
interface AnalyticsData {
  kpis: {
    totalRevenue: number
    totalOrders: number
    avgOrderValue: number
    customerCount: number
    revenueGrowth: number | null
    winkPointsLiability: number
  }
  chartData: { date: string; label: string; revenue: number; orders: number }[]
  statusBreakdown: Record<string, number>
  topProducts: { product_name: string; quantity: number; price_at_purchase: number }[]
  days: number
}

const DAY_OPTIONS = [7, 30] as const
type DayRange = typeof DAY_OPTIONS[number]

const CHART_MODE_OPTIONS = ['revenue', 'orders'] as const
type ChartMode = typeof CHART_MODE_OPTIONS[number]

const STATUS_CHART_COLORS = ['#1b3a34', '#c9a84c', '#3b82f6', '#8b5cf6', '#10b981', '#ef4444', '#f59e0b', '#6b7280']

export default function AnalyticsPage() {
  const [data,      setData]      = useState<AnalyticsData | null>(null)
  const [loading,   setLoading]   = useState(true)
  const [days,      setDays]      = useState<DayRange>(30)
  const [chartMode, setChartMode] = useState<ChartMode>('revenue')

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/analytics?days=${days}`)
      const d   = await res.json()
      setData(d)
    } catch {
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [days])

  useEffect(() => { fetchData() }, [fetchData])

  const kpis = data ? [
    {
      title: 'Total Revenue',
      value: formatCurrency(data.kpis.totalRevenue),
      sub:   data.kpis.revenueGrowth !== null
        ? `${data.kpis.revenueGrowth >= 0 ? '+' : ''}${data.kpis.revenueGrowth.toFixed(1)}% vs prev ${days}d`
        : 'All time',
      subColor: data.kpis.revenueGrowth !== null && data.kpis.revenueGrowth >= 0 ? 'text-emerald-600' : 'text-red-500',
      icon: IndianRupee, color: 'text-emerald-600', bg: 'bg-emerald-50',
      trend: data.kpis.revenueGrowth,
    },
    {
      title: 'Orders',
      value: data.kpis.totalOrders.toLocaleString('en-IN'),
      sub:   `Last ${days} days`,
      subColor: 'text-[#9ca3af]',
      icon: ShoppingBag, color: 'text-blue-600', bg: 'bg-blue-50',
      trend: null,
    },
    {
      title: 'Avg Order Value',
      value: formatCurrency(data.kpis.avgOrderValue),
      sub:   `Last ${days} days`,
      subColor: 'text-[#9ca3af]',
      icon: TrendingUp, color: 'text-violet-600', bg: 'bg-violet-50',
      trend: null,
    },
    {
      title: 'Total Customers',
      value: data.kpis.customerCount.toLocaleString('en-IN'),
      sub:   'Registered accounts',
      subColor: 'text-[#9ca3af]',
      icon: Users, color: 'text-amber-600', bg: 'bg-amber-50',
      trend: null,
    },
    {
      title: 'Wink Points Liability',
      value: formatCurrency(data.kpis.winkPointsLiability ?? 0),
      sub:   'Outstanding loyalty balance',
      subColor: 'text-amber-500',
      icon: TrendingDown, color: 'text-amber-600', bg: 'bg-amber-50',
      trend: null,
    },
  ] : []

  const statusEntries = data
    ? Object.entries(data.statusBreakdown).sort(([, a], [, b]) => b - a)
    : []
  const totalStatusOrders = statusEntries.reduce((s, [, v]) => s + v, 0)

  const hasChart = data?.chartData.some(d => chartMode === 'revenue' ? d.revenue > 0 : d.orders > 0)

  return (
    <div className="space-y-5 max-w-[1200px]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#ffffff]">Analytics</h1>
          <p className="text-xs text-[#6b7280] mt-0.5">Store performance overview</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Day range tabs */}
          <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
            {DAY_OPTIONS.map(d => (
              <button key={d} onClick={() => setDays(d)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  days === d ? 'bg-white shadow text-[#ffffff]' : 'text-[#6b7280] hover:text-[#ffffff]'
                }`}>
                {d}d
              </button>
            ))}
          </div>
          <button onClick={fetchData} disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-[#e5e7eb] rounded-lg text-xs text-[#6b7280] hover:bg-white disabled:opacity-50 transition-colors">
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {loading ? (
          [...Array(4)].map((_, i) => (
            <div key={i} className="bg-white border border-[#e5e7eb] rounded-xl p-5 animate-pulse">
              <div className="w-9 h-9 bg-gray-100 rounded-lg mb-3" />
              <div className="h-4 bg-gray-100 rounded w-20 mb-1.5" />
              <div className="h-6 bg-gray-100 rounded w-28" />
            </div>
          ))
        ) : kpis.map((kpi, i) => (
          <div key={i} className="bg-white border border-[#e5e7eb] rounded-xl p-5 hover:shadow-sm transition-shadow">
            <div className={`w-9 h-9 ${kpi.bg} rounded-lg flex items-center justify-center mb-3`}>
              <kpi.icon size={16} className={kpi.color} />
            </div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-[#9ca3af] mb-0.5">{kpi.title}</p>
            <p className="text-xl font-bold text-[#ffffff]">{kpi.value}</p>
            <div className={`flex items-center gap-1 mt-1 text-[10px] font-medium ${kpi.subColor}`}>
              {kpi.trend !== null && (
                kpi.trend >= 0
                  ? <TrendingUp size={10} />
                  : <TrendingDown size={10} />
              )}
              {kpi.sub}
            </div>
          </div>
        ))}
      </div>

      {/* Chart + Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Revenue/Order Chart */}
        <div className="lg:col-span-2 bg-white border border-[#e5e7eb] rounded-xl p-5">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-sm font-semibold text-[#ffffff] flex items-center gap-2">
              <BarChart2 size={15} className="text-[#1b3a34]" />
              {chartMode === 'revenue' ? 'Revenue' : 'Orders'} — Last {days} days
            </h3>
            <div className="flex gap-1 bg-gray-100 p-0.5 rounded-lg">
              {CHART_MODE_OPTIONS.map(m => (
                <button key={m} onClick={() => setChartMode(m)}
                  className={`px-2.5 py-1 rounded text-[10px] font-semibold capitalize transition-colors ${
                    chartMode === m ? 'bg-white shadow text-[#ffffff]' : 'text-[#6b7280]'
                  }`}>
                  {m}
                </button>
              ))}
            </div>
          </div>

          <div className="h-56">
            {loading ? (
              <div className="h-full bg-gray-50 rounded-xl animate-pulse" />
            ) : !hasChart ? (
              <div className="h-full flex flex-col items-center justify-center text-[#9ca3af] border border-dashed border-[#e5e7eb] rounded-xl">
                <BarChart2 size={28} className="mb-2 opacity-40" />
                <p className="text-xs">No data for this period</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data?.chartData ?? []} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#1b3a34" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#1b3a34" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 10, fill: '#9ca3af' }}
                    axisLine={false} tickLine={false} dy={8}
                    interval={days <= 7 ? 0 : Math.floor((data?.chartData.length ?? 30) / 6)}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: '#9ca3af' }}
                    axisLine={false} tickLine={false} dx={-4}
                    tickFormatter={v => chartMode === 'revenue' ? `₹${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}` : String(v)}
                  />
                  <Tooltip
                    contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 20px -3px rgb(0 0 0 / 0.12)', fontSize: 12 }}
                    formatter={(v: unknown) => [
                      chartMode === 'revenue' ? formatCurrency(Number(v)) : `${v} orders`,
                      chartMode === 'revenue' ? 'Revenue' : 'Orders',
                    ]}
                    labelStyle={{ color: '#6b7280', fontSize: 11 }}
                  />
                  <Area
                    type="monotone"
                    dataKey={chartMode}
                    stroke="#1b3a34"
                    strokeWidth={2.5}
                    fill="url(#areaGrad)"
                    dot={false}
                    activeDot={{ r: 4, fill: '#1b3a34' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Order Status Breakdown */}
        <div className="bg-white border border-[#e5e7eb] rounded-xl p-5">
          <h3 className="text-sm font-semibold text-[#ffffff] mb-4">Order Status</h3>
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-2 animate-pulse">
                  <div className="h-3 bg-gray-100 rounded flex-1" />
                  <div className="h-3 w-6 bg-gray-100 rounded" />
                </div>
              ))}
            </div>
          ) : statusEntries.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-[#9ca3af]">
              <ShoppingBag size={24} className="mb-2 opacity-40" />
              <p className="text-xs">No orders yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {statusEntries.map(([status, count], i) => {
                const pct = totalStatusOrders > 0 ? (count / totalStatusOrders) * 100 : 0
                return (
                  <div key={status}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-medium text-[#6b7280]">
                        {ORDER_STATUS_LABELS[status as keyof typeof ORDER_STATUS_LABELS] ?? status}
                      </span>
                      <span className="text-[10px] font-bold text-[#ffffff]">{count}</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: STATUS_CHART_COLORS[i % STATUS_CHART_COLORS.length],
                        }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Top Products */}
      <div className="bg-white border border-[#e5e7eb] rounded-xl p-5">
        <h3 className="text-sm font-semibold text-[#ffffff] mb-4 flex items-center gap-2">
          <Package size={14} className="text-[#c9a84c]" />
          Top Products — Last {days} days
        </h3>
        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 animate-pulse">
                <div className="h-4 w-5 bg-gray-100 rounded" />
                <div className="h-4 bg-gray-100 rounded flex-1" />
                <div className="h-4 w-16 bg-gray-100 rounded" />
                <div className="h-4 w-20 bg-gray-100 rounded" />
              </div>
            ))}
          </div>
        ) : !data?.topProducts.length ? (
          <p className="text-sm text-[#9ca3af] text-center py-8">No product sales in this period</p>
        ) : (
          <div className="space-y-0 divide-y divide-[#f3f4f6]">
            {data.topProducts.map((p, i) => {
              const revenue = p.price_at_purchase * p.quantity
              const maxRev  = Math.max(...(data.topProducts.map(x => x.price_at_purchase * x.quantity)))
              const pct     = maxRev > 0 ? (revenue / maxRev) * 100 : 0
              return (
                <div key={i} className="flex items-center gap-4 py-3">
                  <span className="text-xs font-bold text-[#9ca3af] w-4 text-center">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-[#ffffff] truncate">{p.product_name}</p>
                    <div className="mt-1 h-1 bg-gray-100 rounded-full overflow-hidden w-full">
                      <div className="h-full bg-[#1b3a34] rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                  <span className="text-[10px] text-[#6b7280] w-14 text-right flex-shrink-0">
                    {p.quantity} sold
                  </span>
                  <span className="text-xs font-bold text-[#ffffff] w-20 text-right flex-shrink-0">
                    {formatCurrency(revenue)}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
