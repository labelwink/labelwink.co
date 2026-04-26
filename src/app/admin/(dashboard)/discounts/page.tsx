'use client'

import { useState, useEffect, useCallback, useTransition } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import {
  Tag, Plus, Trash2, ToggleLeft, ToggleRight,
  RefreshCw, Copy, ChevronLeft, ChevronRight,
  Percent, IndianRupee, Clock,
} from 'lucide-react'
import { useToast } from '@/components/admin/Toast'
import { formatDate } from '@/lib/utils/format'

// ── Types ──────────────────────────────────────────────────────────────────────
interface Coupon {
  id: string
  code: string
  type: string          // 'percent' | 'percentage' | 'flat'
  value: number
  min_order: number | null
  max_uses: number | null
  used_count: number
  expires_at: string | null
  is_active: boolean
  created_at: string
}

const EMPTY_FORM = { code: '', type: 'percent', value: '', min_order: '', max_uses: '', expires_at: '' }
const PAGE_SIZE  = 25

function isExpired(expires_at: string | null) {
  return expires_at ? new Date(expires_at) < new Date() : false
}

function couponLabel(c: Coupon) {
  const isPerc = c.type === 'percent' || c.type === 'percentage'
  return isPerc ? `${c.value}% off` : `₹${c.value} off`
}

export default function DiscountsPage() {
  const router       = useRouter()
  const pathname     = usePathname()
  const searchParams = useSearchParams()
  const { showToast, ToastComponent } = useToast()
  const [, startTransition] = useTransition()

  const [coupons,    setCoupons]    = useState<Coupon[]>([])
  const [total,      setTotal]      = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [loading,    setLoading]    = useState(true)
  const [showForm,   setShowForm]   = useState(false)
  const [form,       setForm]       = useState(EMPTY_FORM)
  const [saving,     setSaving]     = useState(false)
  const [toggling,   setToggling]   = useState<Set<string>>(new Set())

  const page = Number(searchParams.get('page') ?? '0')

  const updateUrl = (updates: Record<string, string>) => {
    const p = new URLSearchParams(searchParams.toString())
    for (const [k, v] of Object.entries(updates)) {
      if (v) p.set(k, v); else p.delete(k)
    }
    startTransition(() => router.push(`${pathname}?${p}`))
  }

  const fetchCoupons = useCallback(async () => {
    setLoading(true)
    try {
      const res  = await fetch(`/api/admin/discounts?page=${page}`)
      const data = await res.json()
      setCoupons(data.coupons ?? [])
      setTotal(data.total ?? 0)
      setTotalPages(data.totalPages ?? Math.ceil((data.total ?? 0) / PAGE_SIZE))
    } catch {
      setCoupons([])
    } finally {
      setLoading(false)
    }
  }, [page])

  useEffect(() => { fetchCoupons() }, [fetchCoupons])

  const create = async () => {
    if (!form.code.trim() || !form.value) return showToast('Code and value are required', 'error')
    setSaving(true)
    const res = await fetch('/api/admin/discounts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code:       form.code.toUpperCase().trim(),
        type:       form.type,
        value:      Number(form.value),
        min_order:  form.min_order  ? Number(form.min_order)  : null,
        max_uses:   form.max_uses   ? Number(form.max_uses)   : null,
        expires_at: form.expires_at || null,
        is_active:  true,
      }),
    })
    setSaving(false)
    if (res.ok) {
      const c = await res.json()
      setCoupons(prev => [c, ...prev])
      setForm(EMPTY_FORM)
      setShowForm(false)
      showToast('Coupon created ✓', 'success')
    } else {
      const err = await res.json()
      showToast(err.error || 'Failed to create coupon', 'error')
    }
  }

  const toggle = async (c: Coupon) => {
    setToggling(prev => new Set(prev).add(c.id))
    const res = await fetch('/api/admin/discounts', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: c.id, is_active: !c.is_active }),
    })
    setToggling(prev => { const n = new Set(prev); n.delete(c.id); return n })
    if (res.ok) {
      setCoupons(prev => prev.map(x => x.id === c.id ? { ...x, is_active: !x.is_active } : x))
      showToast(c.is_active ? 'Coupon deactivated' : 'Coupon activated', 'success')
    }
  }

  const remove = async (id: string) => {
    await fetch('/api/admin/discounts', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    setCoupons(prev => prev.filter(c => c.id !== id))
    showToast('Coupon deleted', 'success')
  }

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    showToast(`Copied "${code}"`, 'success')
  }

  return (
    <div className="space-y-5 max-w-[1000px]">
      {ToastComponent}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#1a1a1a]">Discounts & Coupons</h1>
          <p className="text-xs text-[#6b7280] mt-0.5">{total} coupon{total !== 1 ? 's' : ''} total</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchCoupons} disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-[#e5e7eb] rounded-lg text-xs text-[#6b7280] hover:bg-gray-50 disabled:opacity-50 transition-colors">
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
          <button
            onClick={() => { setShowForm(s => !s); setForm(EMPTY_FORM) }}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-[#1b3a34] text-white rounded-lg text-xs font-semibold hover:bg-[#16312b] transition-colors"
          >
            <Plus size={13} /> New Coupon
          </button>
        </div>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="bg-white border border-[#e5e7eb] rounded-xl p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-[#1a1a1a] mb-4">New Coupon</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-4">
            {/* Code */}
            <div>
              <label className="block text-xs font-medium text-[#1a1a1a] mb-1">Coupon Code *</label>
              <input
                value={form.code}
                onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                placeholder="e.g. WINK20"
                className="w-full border border-[#e5e7eb] rounded-lg px-3 py-2 text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-[#1b3a34]/20"
              />
            </div>
            {/* Type */}
            <div>
              <label className="block text-xs font-medium text-[#1a1a1a] mb-1">Discount Type *</label>
              <select
                value={form.type}
                onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                className="w-full border border-[#e5e7eb] rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#1b3a34]/20"
              >
                <option value="percent">Percentage (%)</option>
                <option value="flat">Flat Amount (₹)</option>
              </select>
            </div>
            {/* Value */}
            <div>
              <label className="block text-xs font-medium text-[#1a1a1a] mb-1">
                Value {form.type === 'percent' ? '(%)' : '(₹)'} *
              </label>
              <div className="relative">
                {form.type === 'flat'
                  ? <IndianRupee size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af]" />
                  : <Percent size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af]" />
                }
                <input
                  type="number" min="0"
                  value={form.value}
                  onChange={e => setForm(f => ({ ...f, value: e.target.value }))}
                  placeholder={form.type === 'percent' ? '20' : '200'}
                  className="w-full pl-8 border border-[#e5e7eb] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1b3a34]/20"
                />
              </div>
            </div>
            {/* Min Order */}
            <div>
              <label className="block text-xs font-medium text-[#1a1a1a] mb-1">Min Order (₹)</label>
              <input
                type="number" min="0"
                value={form.min_order}
                onChange={e => setForm(f => ({ ...f, min_order: e.target.value }))}
                placeholder="No minimum"
                className="w-full border border-[#e5e7eb] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1b3a34]/20"
              />
            </div>
            {/* Max Uses */}
            <div>
              <label className="block text-xs font-medium text-[#1a1a1a] mb-1">Max Uses</label>
              <input
                type="number" min="1"
                value={form.max_uses}
                onChange={e => setForm(f => ({ ...f, max_uses: e.target.value }))}
                placeholder="Unlimited"
                className="w-full border border-[#e5e7eb] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1b3a34]/20"
              />
            </div>
            {/* Expiry */}
            <div>
              <label className="block text-xs font-medium text-[#1a1a1a] mb-1">Expiry Date</label>
              <input
                type="date"
                value={form.expires_at}
                onChange={e => setForm(f => ({ ...f, expires_at: e.target.value }))}
                className="w-full border border-[#e5e7eb] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1b3a34]/20"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowForm(false)}
              className="px-4 py-2 border border-[#e5e7eb] rounded-lg text-xs font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={create}
              disabled={saving}
              className="px-5 py-2 bg-[#1b3a34] text-white rounded-lg text-xs font-semibold hover:bg-[#16312b] disabled:opacity-50 transition-colors"
            >
              {saving ? 'Creating…' : 'Create Coupon'}
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white border border-[#e5e7eb] rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] font-semibold uppercase tracking-wider text-[#9ca3af] border-b border-[#e5e7eb] bg-[#f9f9f9]">
                <th className="text-left px-4 py-3">Code</th>
                <th className="text-left px-4 py-3">Discount</th>
                <th className="text-left px-4 py-3">Min Order</th>
                <th className="text-center px-4 py-3">Uses</th>
                <th className="text-left px-4 py-3">Expires</th>
                <th className="text-center px-4 py-3">Status</th>
                <th className="text-right px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f3f4f6]">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {[...Array(7)].map((_, j) => (
                      <td key={j} className="px-4 py-3.5"><div className="h-3.5 bg-gray-100 rounded" /></td>
                    ))}
                  </tr>
                ))
              ) : coupons.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-16">
                    <Tag size={28} className="mx-auto text-gray-200 mb-3" />
                    <p className="text-sm text-[#6b7280]">No coupons yet</p>
                  </td>
                </tr>
              ) : coupons.map(c => {
                const expired    = isExpired(c.expires_at)
                const exhausted  = c.max_uses !== null && c.used_count >= c.max_uses
                const isToggling = toggling.has(c.id)

                return (
                  <tr key={c.id} className="hover:bg-[#f9fafb] transition-colors">
                    {/* Code */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-[#1b3a34] text-xs bg-[#1b3a34]/5 px-2 py-1 rounded-lg">
                          {c.code}
                        </span>
                        <button onClick={() => copyCode(c.code)} className="text-[#9ca3af] hover:text-[#1b3a34]">
                          <Copy size={11} />
                        </button>
                      </div>
                    </td>
                    {/* Discount */}
                    <td className="px-4 py-3.5 text-xs font-semibold text-[#1a1a1a]">{couponLabel(c)}</td>
                    {/* Min Order */}
                    <td className="px-4 py-3.5 text-xs text-[#6b7280]">
                      {c.min_order ? `₹${c.min_order.toLocaleString('en-IN')}` : '—'}
                    </td>
                    {/* Uses */}
                    <td className="px-4 py-3.5 text-center text-xs">
                      <span className={exhausted ? 'text-red-500 font-semibold' : 'text-[#6b7280]'}>
                        {c.used_count}{c.max_uses !== null ? ` / ${c.max_uses}` : ''}
                      </span>
                    </td>
                    {/* Expires */}
                    <td className="px-4 py-3.5 text-xs">
                      {c.expires_at ? (
                        <span className={`flex items-center gap-1 ${expired ? 'text-red-500' : 'text-[#6b7280]'}`}>
                          <Clock size={10} />
                          {expired ? 'Expired ' : ''}{formatDate(c.expires_at)}
                        </span>
                      ) : (
                        <span className="text-[#9ca3af]">No expiry</span>
                      )}
                    </td>
                    {/* Status */}
                    <td className="px-4 py-3.5 text-center">
                      <button
                        onClick={() => toggle(c)}
                        disabled={isToggling}
                        className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border transition-all disabled:opacity-50 ${
                          c.is_active
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                            : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        {c.is_active
                          ? <><ToggleRight size={10} /> Active</>
                          : <><ToggleLeft size={10} /> Inactive</>
                        }
                      </button>
                    </td>
                    {/* Actions */}
                    <td className="px-4 py-3.5 text-right">
                      <button
                        onClick={() => remove(c.id)}
                        className="w-7 h-7 inline-flex items-center justify-center rounded-lg text-[#9ca3af] hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={13} />
                      </button>
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
            <p className="text-xs text-[#6b7280]">Page {page + 1} of {totalPages}</p>
            <div className="flex items-center gap-1.5">
              <button onClick={() => updateUrl({ page: String(Math.max(0, page - 1)) })} disabled={page === 0}
                className="w-7 h-7 flex items-center justify-center rounded-lg border border-[#e5e7eb] disabled:opacity-40">
                <ChevronLeft size={14} />
              </button>
              <button onClick={() => updateUrl({ page: String(Math.min(totalPages - 1, page + 1)) })} disabled={page >= totalPages - 1}
                className="w-7 h-7 flex items-center justify-center rounded-lg border border-[#e5e7eb] disabled:opacity-40">
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
