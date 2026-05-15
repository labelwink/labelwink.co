'use client'

import { useState, useEffect, useCallback, useTransition } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  RotateCcw, CheckCircle2, XCircle, Clock, Truck,
  RefreshCw, ChevronLeft, ChevronRight, IndianRupee,
  Package, ChevronDown, ChevronUp,
} from 'lucide-react'
import { useToast } from '@/components/admin/Toast'
import { formatCurrency, formatDateTime } from '@/lib/utils/format'
import { RETURN_STATUSES, RETURN_STATUS_LABELS } from '@/lib/utils/constants'
import type { ReturnStatus } from '@/lib/utils/constants'

// ── Types ──────────────────────────────────────────────────────────────────────
interface ReturnRequest {
  id: string
  reason: string | null
  status: ReturnStatus
  admin_note: string | null
  refund_amount: number | null
  created_at: string
  orders: {
    id: string
    total: number
    customer_name: string | null
    customer_email: string | null
    customer_phone: string | null
  } | null
  profiles: { id: string; full_name: string | null; email: string | null } | null
}

const STATUS_CONFIG: Record<ReturnStatus, { label: string; color: string; icon: React.ElementType }> = {
  pending:   { label: 'Pending',   color: 'bg-amber-50 text-amber-700 border-amber-200',   icon: Clock        },
  approved:  { label: 'Approved',  color: 'bg-blue-50 text-blue-700 border-blue-200',      icon: CheckCircle2 },
  picked_up: { label: 'Picked Up', color: 'bg-violet-50 text-violet-700 border-violet-200', icon: Truck       },
  refunded:  { label: 'Refunded',  color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle2 },
  rejected:  { label: 'Rejected',  color: 'bg-red-50 text-red-700 border-red-200',         icon: XCircle      },
}

const PAGE_SIZE = 25

// ── Return Card ────────────────────────────────────────────────────────────────
function ReturnCard({
  ret,
  onUpdate,
}: {
  ret: ReturnRequest
  onUpdate: (id: string, updates: Record<string, unknown>) => Promise<void>
}) {
  const [expanded,  setExpanded]  = useState(false)
  const [actioning, setActioning] = useState(false)
  const [note,      setNote]      = useState(ret.admin_note ?? '')
  const [refund,    setRefund]    = useState(ret.refund_amount?.toString() ?? '')

  const cfg      = STATUS_CONFIG[ret.status] ?? STATUS_CONFIG.pending
  const StatusIcon = cfg.icon
  const orderTotal = ret.orders?.total ?? 0

  const act = async (updates: Record<string, unknown>) => {
    setActioning(true)
    try {
      await onUpdate(ret.id, updates)
    } finally {
      setActioning(false)
    }
  }

  return (
    <div className="bg-white border border-[#e5e7eb] rounded-xl overflow-hidden hover:shadow-sm transition-shadow">
      {/* Header */}
      <div
        className="flex items-center justify-between px-5 py-4 cursor-pointer"
        onClick={() => setExpanded(e => !e)}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#1b3a34]/10 rounded-full flex items-center justify-center flex-shrink-0">
            <RotateCcw size={14} className="text-[#1b3a34]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-[#1b3a34]">
                #{ret.orders?.id?.slice(0, 8).toUpperCase() ?? 'UNKNOWN'}
              </span>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${cfg.color}`}>
                {cfg.label}
              </span>
            </div>
            <p className="text-xs text-[#6b7280] mt-0.5">
              {ret.orders?.customer_name ?? ret.profiles?.full_name ?? '—'}
              {ret.orders?.customer_email && <span className="ml-1 text-[#9ca3af]">· {ret.orders.customer_email}</span>}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-xs font-semibold text-[#1b3a34]">{formatCurrency(orderTotal)}</p>
            <p className="text-[10px] text-[#9ca3af]">{formatDateTime(ret.created_at)}</p>
          </div>
          {expanded ? <ChevronUp size={15} className="text-[#9ca3af]" /> : <ChevronDown size={15} className="text-[#9ca3af]" />}
        </div>
      </div>

      {/* Expanded */}
      {expanded && (
        <div className="border-t border-[#e5e7eb] px-5 py-4 space-y-4">
          {/* Reason */}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-[#9ca3af] mb-1">Return Reason</p>
            <p className="text-sm text-[#4b5563]">{ret.reason || <span className="italic text-[#9ca3af]">No reason provided</span>}</p>
          </div>

          {/* Order link */}
          {ret.orders?.id && (
            <Link
              href={`/admin/orders/${ret.orders.id}`}
              className="inline-flex items-center gap-1.5 text-xs text-[#1b3a34] font-medium hover:underline"
            >
              <Package size={12} /> View original order →
            </Link>
          )}

          {/* Status Actions */}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-[#9ca3af] mb-2">Update Status</p>
            <div className="flex flex-wrap gap-2">
              {RETURN_STATUSES.filter(s => s !== ret.status).map(s => {
                const c = STATUS_CONFIG[s]
                const Icon = c.icon
                return (
                  <button
                    key={s}
                    onClick={() => act({ status: s })}
                    disabled={actioning}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border disabled:opacity-50 transition-colors ${c.color} hover:opacity-80`}
                  >
                    <Icon size={11} /> {c.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Refund Amount */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-wide text-[#9ca3af] block mb-1">
                Refund Amount (₹)
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <IndianRupee size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af]" />
                  <input
                    type="number"
                    min="0"
                    value={refund}
                    onChange={e => setRefund(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 border border-[#e5e7eb] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1b3a34]/20"
                    placeholder={String(orderTotal)}
                  />
                </div>
                <button
                  onClick={() => act({ refund_amount: refund ? Number(refund) : null })}
                  disabled={actioning}
                  className="px-3 py-2 bg-[#1b3a34] text-white rounded-lg text-xs font-semibold hover:bg-[#16312b] disabled:opacity-50 transition-colors"
                >
                  Set
                </button>
              </div>
              {ret.refund_amount && (
                <p className="text-[10px] text-emerald-600 mt-1">
                  Current: {formatCurrency(ret.refund_amount)}
                </p>
              )}
            </div>

            {/* Admin Note */}
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-wide text-[#9ca3af] block mb-1">
                Admin Note
              </label>
              <div className="flex gap-2">
                <input
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  className="flex-1 border border-[#e5e7eb] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1b3a34]/20"
                  placeholder="Internal note…"
                />
                <button
                  onClick={() => act({ admin_note: note })}
                  disabled={actioning}
                  className="px-3 py-2 bg-[#1b3a34] text-white rounded-lg text-xs font-semibold hover:bg-[#16312b] disabled:opacity-50 transition-colors"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function ReturnsContent() {
  const router       = useRouter()
  const pathname     = usePathname()
  const searchParams = useSearchParams()
  const { showToast, ToastComponent } = useToast()
  const [, startTransition] = useTransition()

  const [returns,    setReturns]    = useState<ReturnRequest[]>([])
  const [total,      setTotal]      = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [loading,    setLoading]    = useState(true)
  const [counts,     setCounts]     = useState<Record<string, number>>({})

  const status = (searchParams.get('status') ?? 'pending') as ReturnStatus
  const page   = Number(searchParams.get('page') ?? '0')

  const updateUrl = (updates: Record<string, string>) => {
    const p = new URLSearchParams(searchParams.toString())
    for (const [k, v] of Object.entries(updates)) {
      if (v) p.set(k, v); else p.delete(k)
    }
    startTransition(() => router.push(`${pathname}?${p}`))
  }

  const fetchReturns = useCallback(async () => {
    setLoading(true)
    try {
      const p   = new URLSearchParams({ status, page: String(page) })
      const res = await fetch(`/api/admin/returns?${p}`)
      const d   = await res.json()
      setReturns(d.returns ?? [])
      setTotal(d.total ?? 0)
      setTotalPages(d.totalPages ?? 0)
    } catch {
      setReturns([])
    } finally {
      setLoading(false)
    }
  }, [status, page])

  const fetchCounts = useCallback(async () => {
    const results = await Promise.all(
      RETURN_STATUSES.map(s =>
        fetch(`/api/admin/returns?status=${s}&page=0`).then(r => r.json()).then(d => [s, d.total ?? 0])
      )
    )
    setCounts(Object.fromEntries(results))
  }, [])

  useEffect(() => { fetchReturns() }, [fetchReturns])
  useEffect(() => { fetchCounts() }, [fetchCounts])

  const handleUpdate = async (id: string, updates: Record<string, unknown>) => {
    const res = await fetch(`/api/admin/returns/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })
    if (!res.ok) {
      showToast('Update failed', 'error')
      throw new Error()
    }
    showToast('Return updated', 'success')
    // Refresh optimistically
    if ('status' in updates) {
      setReturns(prev => prev.filter(r => r.id !== id))
      fetchCounts()
    } else {
      // Just update in-place
      const updated = await res.json()
      setReturns(prev => prev.map(r => r.id === id ? { ...r, ...updated } : r))
    }
  }

  return (
    <div className="space-y-5 max-w-[900px]">
      {ToastComponent}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#1b3a34]">Returns</h1>
          <p className="text-xs text-[#6b7280] mt-0.5">Manage return requests and refunds</p>
        </div>
        <button
          onClick={() => { fetchReturns(); fetchCounts() }}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 border border-[#e5e7eb] rounded-lg text-xs text-[#6b7280] hover:bg-gray-50 disabled:opacity-50 transition-colors"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {/* Status Tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {RETURN_STATUSES.map(s => {
          const cfg = STATUS_CONFIG[s]
          const cnt = counts[s] ?? 0
          const isActive = status === s
          return (
            <button
              key={s}
              onClick={() => updateUrl({ status: s, page: '' })}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap border transition-all ${
                isActive ? cfg.color : 'bg-white border-[#e5e7eb] text-[#6b7280] hover:bg-gray-50'
              }`}
            >
              {RETURN_STATUS_LABELS[s]}
              {cnt > 0 && (
                <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${
                  isActive ? 'bg-white/50' : 'bg-gray-100'
                }`}>
                  {cnt}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Return Cards */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white border border-[#e5e7eb] rounded-xl p-5 animate-pulse">
              <div className="h-4 bg-gray-100 rounded w-48 mb-2" />
              <div className="h-3 bg-gray-100 rounded w-64" />
            </div>
          ))}
        </div>
      ) : returns.length === 0 ? (
        <div className="bg-white border border-[#e5e7eb] rounded-xl p-16 text-center">
          <RotateCcw size={32} className="mx-auto text-[#1a2e1e] mb-3" />
          <p className="text-sm text-[#6b7280]">No {RETURN_STATUS_LABELS[status].toLowerCase()} returns</p>
        </div>
      ) : (
        <div className="space-y-3">
          {returns.map(r => (
            <ReturnCard key={r.id} ret={r} onUpdate={handleUpdate} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-1 py-2">
          <p className="text-xs text-[#6b7280]">
            {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} of {total}
          </p>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => updateUrl({ page: String(Math.max(0, page - 1)) })}
              disabled={page === 0}
              className="w-7 h-7 flex items-center justify-center rounded-lg border border-[#e5e7eb] hover:bg-white disabled:opacity-40"
            >
              <ChevronLeft size={14} />
            </button>
            <span className="text-xs text-[#6b7280] px-1">{page + 1} / {totalPages}</span>
            <button
              onClick={() => updateUrl({ page: String(Math.min(totalPages - 1, page + 1)) })}
              disabled={page >= totalPages - 1}
              className="w-7 h-7 flex items-center justify-center rounded-lg border border-[#e5e7eb] hover:bg-white disabled:opacity-40"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
