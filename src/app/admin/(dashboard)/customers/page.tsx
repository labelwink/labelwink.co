'use client'

import { useState, useEffect, useCallback, useTransition } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import {
  Users, Search, Download, RefreshCw,
  ChevronLeft, ChevronRight, Crown,
  TrendingUp, ShoppingBag, Star,
} from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils/format'
import { useToast } from '@/components/admin/Toast'

// ── Types ────────────────────────────────────────────────────────────────────
interface Customer {
  id: string
  full_name: string | null
  email: string | null
  phone: string | null
  wink_points: number
  loyalty_tier: string | null
  created_at: string
  orders: { id: string; total: number; payment_status: string }[]
  // computed
  totalSpent: number
  orderCount: number
  segment: string
}

const SEGMENT_COLORS: Record<string, string> = {
  VIP:      'bg-purple-100 text-purple-700 border-purple-200',
  Regular:  'bg-blue-50 text-blue-700 border-blue-200',
  New:      'bg-emerald-50 text-emerald-700 border-emerald-200',
  Inactive: 'bg-red-50 text-red-500 border-red-200',
}

const TIER_COLORS: Record<string, string> = {
  Bronze:   'text-amber-700',
  Silver:   'text-gray-500',
  Gold:     'text-yellow-600',
  Platinum: 'text-blue-500',
}

const PAGE_SIZE = 25

function computeSegment(orderCount: number, totalSpent: number) {
  if (orderCount >= 10 || totalSpent >= 30000) return 'VIP'
  if (orderCount >= 3)  return 'Regular'
  if (orderCount === 0) return 'Inactive'
  return 'New'
}

export default function CustomersPage() {
  const router       = useRouter()
  const pathname     = usePathname()
  const searchParams = useSearchParams()
  const { showToast, ToastComponent } = useToast()
  const [, startTransition] = useTransition()

  const [customers,  setCustomers]  = useState<Customer[]>([])
  const [total,      setTotal]      = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [loading,    setLoading]    = useState(true)
  const [stats,      setStats]      = useState({ total: 0, vip: 0, newThisMonth: 0 })

  const search = searchParams.get('q')    ?? ''
  const page   = Number(searchParams.get('page') ?? '0')

  const updateUrl = (updates: Record<string, string>) => {
    const p = new URLSearchParams(searchParams.toString())
    for (const [k, v] of Object.entries(updates)) {
      if (v) p.set(k, v); else p.delete(k)
    }
    startTransition(() => router.push(`${pathname}?${p}`))
  }

  const fetchCustomers = useCallback(async () => {
    setLoading(true)
    try {
      const p = new URLSearchParams({ page: String(page) })
      if (search) p.set('q', search)
      const res  = await fetch(`/api/admin/customers?${p}`)
      const data = await res.json()

      const enriched: Customer[] = (data.customers ?? []).map((c: Customer) => {
        const paid       = (c.orders ?? []).filter(o => o.payment_status === 'paid')
        const totalSpent = paid.reduce((s, o) => s + Number(o.total), 0)
        const orderCount = paid.length
        return { ...c, totalSpent, orderCount, segment: computeSegment(orderCount, totalSpent) }
      })

      setCustomers(enriched)
      setTotal(data.total ?? 0)
      setTotalPages(data.totalPages ?? 0)

      // Compute stats from all customers on first page
      if (page === 0 && !search) {
        const vip  = enriched.filter(c => c.segment === 'VIP').length
        const thisMonth = new Date()
        thisMonth.setDate(1)
        const newM = enriched.filter(c => new Date(c.created_at) >= thisMonth).length
        setStats({ total: data.total ?? 0, vip, newThisMonth: newM })
      }
    } catch {
      setCustomers([])
    } finally {
      setLoading(false)
    }
  }, [search, page])

  useEffect(() => { fetchCustomers() }, [fetchCustomers])

  const exportCSV = () => {
    const h = ['Name', 'Email', 'Phone', 'Orders', 'Total Spent', 'Segment', 'Wink Points', 'Joined']
    const rows = customers.map(c => [
      c.full_name ?? '', c.email ?? '', c.phone ?? '',
      c.orderCount, formatCurrency(c.totalSpent), c.segment,
      c.wink_points, formatDate(c.created_at),
    ])
    const csv  = [h, ...rows].map(r => r.map(String).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const a    = document.createElement('a')
    a.href = URL.createObjectURL(blob); a.download = `customers-${Date.now()}.csv`; a.click()
    URL.revokeObjectURL(a.href)
  }

  return (
    <div className="space-y-5 max-w-[1200px]">
      {ToastComponent}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#1a1a1a]">Customers</h1>
          <p className="text-xs text-[#6b7280] mt-0.5">{total.toLocaleString('en-IN')} registered</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => fetchCustomers()} disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-[#e5e7eb] rounded-lg text-xs text-[#6b7280] hover:bg-gray-50 disabled:opacity-50 transition-colors">
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
          <button onClick={exportCSV} disabled={customers.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-[#e5e7eb] rounded-lg text-xs text-[#6b7280] hover:bg-gray-50 disabled:opacity-50 transition-colors">
            <Download size={13} /> Export
          </button>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total Customers', value: stats.total.toLocaleString('en-IN'), icon: Users,       color: 'text-blue-600',   bg: 'bg-blue-50' },
          { label: 'VIP Customers',   value: stats.vip.toLocaleString('en-IN'),   icon: Crown,       color: 'text-purple-600', bg: 'bg-purple-50' },
          { label: 'New This Month',  value: stats.newThisMonth.toLocaleString('en-IN'), icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        ].map(kpi => (
          <div key={kpi.label} className="bg-white border border-[#e5e7eb] rounded-xl px-4 py-3 flex items-center gap-3">
            <div className={`w-8 h-8 ${kpi.bg} rounded-lg flex items-center justify-center flex-shrink-0`}>
              <kpi.icon size={15} className={kpi.color} />
            </div>
            <div>
              <p className="text-lg font-bold text-[#1a1a1a] leading-none">{kpi.value}</p>
              <p className="text-[10px] text-[#9ca3af] mt-0.5">{kpi.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af]" />
        <input
          type="text"
          defaultValue={search}
          onChange={e => {
            const val = e.target.value
            clearTimeout((window as unknown as { _cst?: ReturnType<typeof setTimeout> })._cst)
            ;(window as unknown as { _cst?: ReturnType<typeof setTimeout> })._cst = setTimeout(
              () => updateUrl({ q: val, page: '' }), 350
            )
          }}
          placeholder="Search by name, email or phone…"
          className="w-full pl-9 pr-4 py-2 border border-[#e5e7eb] rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#1b3a34]/20 focus:border-[#1b3a34]"
        />
      </div>

      {/* Table */}
      <div className="bg-white border border-[#e5e7eb] rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] font-semibold uppercase tracking-wider text-[#9ca3af] border-b border-[#e5e7eb] bg-[#f9f9f9]">
                <th className="text-left px-5 py-3">Customer</th>
                <th className="text-left px-4 py-3">Contact</th>
                <th className="text-center px-4 py-3"><ShoppingBag size={11} className="inline" /> Orders</th>
                <th className="text-right px-4 py-3">Spent</th>
                <th className="text-center px-4 py-3">Segment</th>
                <th className="text-right px-4 py-3"><Star size={11} className="inline" /> Points</th>
                <th className="text-left px-4 py-3">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f3f4f6]">
              {loading ? (
                [...Array(8)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {[...Array(7)].map((_, j) => (
                      <td key={j} className="px-4 py-4"><div className="h-3.5 bg-gray-100 rounded" /></td>
                    ))}
                  </tr>
                ))
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-16">
                    <Users size={32} className="mx-auto text-gray-200 mb-3" />
                    <p className="text-sm text-[#6b7280]">{search ? `No results for "${search}"` : 'No customers yet'}</p>
                  </td>
                </tr>
              ) : customers.map(c => (
                <tr key={c.id} className="hover:bg-[#f9fafb] transition-colors">
                  {/* Avatar + Name */}
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#1b3a34]/10 text-[#1b3a34] flex items-center justify-center text-xs font-bold flex-shrink-0">
                        {(c.full_name?.[0] ?? c.email?.[0] ?? 'U').toUpperCase()}
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-[#1a1a1a]">{c.full_name || 'Anonymous'}</p>
                        <p className="text-[10px] text-[#9ca3af] font-mono">{c.id.slice(0, 8)}</p>
                      </div>
                    </div>
                  </td>
                  {/* Contact */}
                  <td className="px-4 py-3.5">
                    <p className="text-xs text-[#4b5563]">{c.email || '—'}</p>
                    <p className="text-[10px] text-[#9ca3af]">{c.phone || '—'}</p>
                  </td>
                  {/* Orders */}
                  <td className="px-4 py-3.5 text-center">
                    <span className="text-xs font-bold text-[#1a1a1a]">{c.orderCount}</span>
                  </td>
                  {/* Spent */}
                  <td className="px-4 py-3.5 text-right">
                    <span className="text-xs font-bold text-[#1a1a1a]">{formatCurrency(c.totalSpent)}</span>
                  </td>
                  {/* Segment */}
                  <td className="px-4 py-3.5 text-center">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${SEGMENT_COLORS[c.segment] ?? ''}`}>
                      {c.segment}
                    </span>
                  </td>
                  {/* Points */}
                  <td className="px-4 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <span className={`text-xs font-semibold ${TIER_COLORS[c.loyalty_tier ?? ''] ?? 'text-[#6b7280]'}`}>
                        {(c.wink_points ?? 0).toLocaleString('en-IN')}
                      </span>
                      {c.loyalty_tier && (
                        <span className={`text-[9px] ${TIER_COLORS[c.loyalty_tier] ?? 'text-[#9ca3af]'}`}>
                          {c.loyalty_tier}
                        </span>
                      )}
                    </div>
                  </td>
                  {/* Joined */}
                  <td className="px-4 py-3.5 text-xs text-[#9ca3af]">{formatDate(c.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-[#e5e7eb] bg-[#f9f9f9]">
            <p className="text-xs text-[#6b7280]">
              {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} of {total.toLocaleString('en-IN')}
            </p>
            <div className="flex items-center gap-1.5">
              <button onClick={() => updateUrl({ page: String(Math.max(0, page - 1)) })} disabled={page === 0}
                className="w-7 h-7 flex items-center justify-center rounded-lg border border-[#e5e7eb] hover:bg-white disabled:opacity-40">
                <ChevronLeft size={14} />
              </button>
              <span className="text-xs text-[#6b7280] px-1">{page + 1} / {totalPages}</span>
              <button onClick={() => updateUrl({ page: String(Math.min(totalPages - 1, page + 1)) })} disabled={page >= totalPages - 1}
                className="w-7 h-7 flex items-center justify-center rounded-lg border border-[#e5e7eb] hover:bg-white disabled:opacity-40">
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
