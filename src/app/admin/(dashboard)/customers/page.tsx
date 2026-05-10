'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import {
  Users, Search, Download, RefreshCw, ChevronLeft, ChevronRight,
  Crown, TrendingUp, UserX, Eye, RotateCcw, Plus,
} from 'lucide-react'
import Link from 'next/link'
import { formatCurrency, formatDate } from '@/lib/utils/format'
import { useToast } from '@/components/admin/Toast'

interface Customer {
  id: string
  full_name: string | null
  email: string | null
  phone: string | null
  created_at: string
  order_count: number
  lifetime_value: number
  last_order_date: string | null
  loyalty_points: number
  loyalty_tier: string | null
  is_new: boolean
  is_high_value: boolean
  is_inactive: boolean
  is_deactivated: boolean
}

interface Stats { total: number; new_this_month: number; high_value: number; inactive: number }

const SEGMENTS = [
  { key: '',           label: 'All' },
  { key: 'new',        label: 'New (30d)' },
  { key: 'high_value', label: 'High Value' },
  { key: 'loyal',      label: 'Loyal' },
  { key: 'inactive',   label: 'Inactive' },
] as const

function StatusDot({ customer }: { customer: Customer }) {
  if (customer.is_deactivated) return (
    <span className="flex items-center gap-1 text-[10px] text-red-500 font-medium">
      <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block" />Deactivated
    </span>
  )
  if (customer.is_inactive) return (
    <span className="flex items-center gap-1 text-[10px] text-amber-600 font-medium">
      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" />Inactive
    </span>
  )
  return (
    <span className="flex items-center gap-1 text-[10px] text-emerald-600 font-medium">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />Active
    </span>
  )
}

function QuickPointsForm({ customerId, onDone }: { customerId: string; onDone: () => void }) {
  const [pts, setPts] = useState('')
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)
  const { showToast } = useToast()

  const submit = async () => {
    if (!pts || !reason) return
    setLoading(true)
    const res = await fetch(`/api/admin/customers/${customerId}/loyalty`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'add', points: Number(pts), reason }),
    })
    const d = await res.json()
    setLoading(false)
    if (res.ok) { showToast(`Added ${pts} pts → Balance: ${d.new_balance}`, 'success'); onDone() }
    else showToast(d.error || 'Failed', 'error')
  }

  return (
    <div className="flex items-center gap-1.5 mt-1" onClick={e => e.stopPropagation()}>
      <input value={pts} onChange={e => setPts(e.target.value)} type="number" min="1"
        placeholder="Pts" className="w-16 px-2 py-1 text-xs border border-[#e5e7eb] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#c9a84c]/30" />
      <input value={reason} onChange={e => setReason(e.target.value)}
        placeholder="Reason" className="w-24 px-2 py-1 text-xs border border-[#e5e7eb] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#c9a84c]/30" />
      <button onClick={submit} disabled={loading || !pts || !reason}
        className="px-2 py-1 bg-[#c9a84c] text-white text-xs rounded-lg disabled:opacity-50 hover:bg-[#b8963e] transition-colors">
        {loading ? '…' : '✓'}
      </button>
    </div>
  )
}

export default function CustomersPage() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { showToast, ToastComponent } = useToast()
  const searchRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [customers, setCustomers] = useState<Customer[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<Stats>({ total: 0, new_this_month: 0, high_value: 0, inactive: 0 })
  const [resetRow, setResetRow] = useState<string | null>(null)
  const [pointsRow, setPointsRow] = useState<string | null>(null)

  const search  = searchParams.get('search') || ''
  const segment = searchParams.get('segment') || ''
  const page    = Math.max(1, parseInt(searchParams.get('page') || '1', 10))

  const push = (updates: Record<string, string>) => {
    const p = new URLSearchParams(searchParams.toString())
    for (const [k, v] of Object.entries(updates)) {
      if (v) p.set(k, v); else p.delete(k)
    }
    router.push(`${pathname}?${p}`, { scroll: false })
  }

  const fetchCustomers = useCallback(async () => {
    setLoading(true)
    try {
      const p = new URLSearchParams({ page: String(page), per_page: '20' })
      if (search)  p.set('search', search)
      if (segment) p.set('segment', segment)
      const res  = await fetch(`/api/admin/customers?${p}`)
      const data = await res.json()
      setCustomers(data.customers ?? [])
      setTotal(data.total ?? 0)
      setTotalPages(data.total_pages ?? 1)
      if (data.stats) setStats(data.stats)
    } catch { setCustomers([]) }
    finally { setLoading(false) }
  }, [search, segment, page])

  useEffect(() => { fetchCustomers() }, [fetchCustomers])

  const sendReset = async (id: string, email: string) => {
    setResetRow(id)
    const res = await fetch(`/api/admin/customers/${id}/reset-password`, { method: 'POST' })
    const d = await res.json()
    setResetRow(null)
    if (res.ok) showToast(`Reset email sent to ${email}`, 'success')
    else showToast(d.error || 'Failed to send reset', 'error')
  }

  const exportCSV = () => {
    const h = ['Name', 'Email', 'Phone', 'Orders', 'Lifetime Value', 'Points', 'Joined']
    const rows = customers.map(c => [
      c.full_name || '', c.email || '', c.phone || '',
      c.order_count, c.lifetime_value.toFixed(2), c.loyalty_points,
      formatDate(c.created_at),
    ])
    const csv  = [h, ...rows].map(r => r.map(String).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const a    = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `customers-${Date.now()}.csv`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  return (
    <div className="space-y-5 max-w-[1300px]">
      {ToastComponent}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#1b3a34]">Customers</h1>
          <p className="text-xs text-[#6b7280] mt-0.5">{total.toLocaleString('en-IN')} registered</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => fetchCustomers()} disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-[#e5e7eb] rounded-lg text-xs text-[#6b7280] hover:bg-gray-50 disabled:opacity-50 transition-colors">
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
          <button onClick={exportCSV} disabled={customers.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-[#e5e7eb] rounded-lg text-xs text-[#6b7280] hover:bg-gray-50 disabled:opacity-50 transition-colors">
            <Download size={13} /> Export CSV
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total', value: stats.total, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'New This Month', value: stats.new_this_month, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'High Value', value: stats.high_value, icon: Crown, color: 'text-[#c9a84c]', bg: 'bg-yellow-50' },
          { label: 'Inactive 90d+', value: stats.inactive, icon: UserX, color: 'text-red-500', bg: 'bg-red-50' },
        ].map(kpi => (
          <div key={kpi.label} className="bg-white border border-[#e5e7eb] rounded-xl px-4 py-3 flex items-center gap-3">
            <div className={`w-8 h-8 ${kpi.bg} rounded-lg flex items-center justify-center flex-shrink-0`}>
              <kpi.icon size={15} className={kpi.color} />
            </div>
            <div>
              <p className="text-lg font-bold text-[#1b3a34] leading-none">{kpi.value.toLocaleString('en-IN')}</p>
              <p className="text-[10px] text-[#9ca3af] mt-0.5">{kpi.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters row */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative max-w-xs flex-1">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af]" />
          <input
            ref={searchRef}
            defaultValue={search}
            type="text"
            onChange={e => {
              if (debounceRef.current) clearTimeout(debounceRef.current)
              debounceRef.current = setTimeout(() => push({ search: e.target.value, page: '' }), 400)
            }}
            placeholder="Search name, email, phone…"
            className="w-full pl-9 pr-4 py-2 border border-[#e5e7eb] rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#c9a84c]/30 focus:border-[#c9a84c]"
          />
        </div>

        {/* Segment tabs */}
        <div className="flex gap-1 bg-[#f3f4f6] rounded-lg p-1">
          {SEGMENTS.map(s => (
            <button
              key={s.key}
              onClick={() => push({ segment: s.key, page: '' })}
              className={`px-3 py-1.5 rounded-md text-[11px] font-semibold transition-colors ${
                segment === s.key ? 'bg-white shadow-sm text-[#1b3a34]' : 'text-[#6b7280] hover:text-[#1b3a34]'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-[#e5e7eb] rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] font-semibold uppercase tracking-wider text-[#9ca3af] border-b border-[#e5e7eb] bg-[#f9f9f9]">
                <th className="text-left px-5 py-3">Customer</th>
                <th className="text-left px-4 py-3">Phone</th>
                <th className="text-center px-4 py-3">Orders</th>
                <th className="text-right px-4 py-3">Lifetime Value</th>
                <th className="text-right px-4 py-3">Points</th>
                <th className="text-left px-4 py-3">Last Order</th>
                <th className="text-left px-4 py-3">Joined</th>
                <th className="text-center px-4 py-3">Status</th>
                <th className="text-center px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f3f4f6]">
              {loading ? (
                [...Array(8)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {[...Array(9)].map((_, j) => (
                      <td key={j} className="px-4 py-4"><div className="h-3 bg-gray-100 rounded" /></td>
                    ))}
                  </tr>
                ))
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-16">
                    <Users size={32} className="mx-auto text-[#1a2e1e] mb-3" />
                    <p className="text-sm text-[#6b7280]">
                      {search ? `No results for "${search}"` : 'No customers found'}
                    </p>
                  </td>
                </tr>
              ) : customers.map(c => {
                const initials = (c.full_name || c.email || 'U').slice(0, 2).toUpperCase()
                return (
                  <tr key={c.id} className="hover:bg-[#fafaf9] transition-colors group">
                    {/* Customer */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#c9a84c]/10 text-[#c9a84c] flex items-center justify-center text-xs font-bold flex-shrink-0">
                          {initials}
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-[#1b3a34]">{c.full_name || 'Anonymous'}</p>
                          <p className="text-[10px] text-[#9ca3af]">{c.email}</p>
                        </div>
                      </div>
                    </td>
                    {/* Phone */}
                    <td className="px-4 py-3.5 text-xs text-[#4b5563]">{c.phone || '—'}</td>
                    {/* Orders */}
                    <td className="px-4 py-3.5 text-center">
                      <span className="text-xs font-bold text-[#1b3a34]">{c.order_count}</span>
                    </td>
                    {/* Lifetime Value */}
                    <td className="px-4 py-3.5 text-right">
                      <span className="text-xs font-bold text-[#1b3a34]">{formatCurrency(c.lifetime_value)}</span>
                    </td>
                    {/* Points */}
                    <td className="px-4 py-3.5 text-right">
                      <div>
                        <span className="text-xs font-semibold text-[#c9a84c]">{c.loyalty_points.toLocaleString('en-IN')}</span>
                        {pointsRow === c.id && (
                          <QuickPointsForm customerId={c.id} onDone={() => { setPointsRow(null); fetchCustomers() }} />
                        )}
                      </div>
                    </td>
                    {/* Last Order */}
                    <td className="px-4 py-3.5 text-xs text-[#9ca3af]">
                      {c.last_order_date ? formatDate(c.last_order_date) : '—'}
                    </td>
                    {/* Joined */}
                    <td className="px-4 py-3.5 text-xs text-[#9ca3af]">{formatDate(c.created_at)}</td>
                    {/* Status */}
                    <td className="px-4 py-3.5 text-center"><StatusDot customer={c} /></td>
                    {/* Actions */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1.5 justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link href={`/admin/customers/${c.id}`}
                          className="w-7 h-7 flex items-center justify-center border border-[#e5e7eb] rounded-lg hover:bg-[#f3f4f6] transition-colors" title="View profile">
                          <Eye size={12} />
                        </Link>
                        <button
                          onClick={() => sendReset(c.id, c.email || '')}
                          disabled={resetRow === c.id || !c.email}
                          className="w-7 h-7 flex items-center justify-center border border-[#e5e7eb] rounded-lg hover:bg-[#f3f4f6] disabled:opacity-40 transition-colors" title="Send password reset">
                          {resetRow === c.id ? <RefreshCw size={11} className="animate-spin" /> : <RotateCcw size={11} />}
                        </button>
                        <button
                          onClick={() => setPointsRow(pointsRow === c.id ? null : c.id)}
                          className="w-7 h-7 flex items-center justify-center border border-[#c9a84c]/40 text-[#c9a84c] rounded-lg hover:bg-yellow-50 transition-colors" title="Add loyalty points">
                          <Plus size={11} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-[#e5e7eb] bg-[#f9f9f9]">
            <p className="text-xs text-[#6b7280]">
              Page {page} of {totalPages} · {total.toLocaleString('en-IN')} customers
            </p>
            <div className="flex items-center gap-1.5">
              <button onClick={() => push({ page: String(page - 1) })} disabled={page <= 1}
                className="w-7 h-7 flex items-center justify-center rounded-lg border border-[#e5e7eb] hover:bg-white disabled:opacity-40">
                <ChevronLeft size={14} />
              </button>
              <span className="text-xs text-[#6b7280] px-1">{page} / {totalPages}</span>
              <button onClick={() => push({ page: String(page + 1) })} disabled={page >= totalPages}
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
