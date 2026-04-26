'use client'

import { useState, useEffect, useCallback, useTransition } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import {
  Star, CheckCircle2, XCircle, Clock, Trash2,
  MessageSquare, BadgeCheck, ChevronLeft, ChevronRight,
  RefreshCw, ExternalLink,
} from 'lucide-react'
import { useToast } from '@/components/admin/Toast'
import { formatDate } from '@/lib/utils/format'

// ── Types ──────────────────────────────────────────────────────────────────────
interface Review {
  id: string
  rating: number
  title: string | null
  body: string | null
  status: 'pending' | 'approved' | 'rejected'
  is_verified: boolean
  created_at: string
  products: { id: string; name: string; slug: string } | null
  profiles: { id: string; full_name: string | null; email: string | null } | null
}

const STATUS_TABS = [
  { label: 'Pending',  value: 'pending',  color: 'text-amber-600',  bg: 'bg-amber-50 border-amber-200'  },
  { label: 'Approved', value: 'approved', color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200' },
  { label: 'Rejected', value: 'rejected', color: 'text-red-600',    bg: 'bg-red-50 border-red-200'      },
]

const PAGE_SIZE = 25

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star
          key={i}
          size={13}
          className={i <= rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}
        />
      ))}
      <span className="text-xs text-[#6b7280] ml-1">{rating}/5</span>
    </div>
  )
}

export default function ReviewsPage() {
  const router       = useRouter()
  const pathname     = usePathname()
  const searchParams = useSearchParams()
  const { showToast, ToastComponent } = useToast()
  const [, startTransition] = useTransition()

  const [reviews,    setReviews]    = useState<Review[]>([])
  const [total,      setTotal]      = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [loading,    setLoading]    = useState(true)
  const [counts,     setCounts]     = useState({ pending: 0, approved: 0, rejected: 0 })
  const [actioning,  setActioning]  = useState<Set<string>>(new Set())

  const status = (searchParams.get('status') ?? 'pending') as 'pending' | 'approved' | 'rejected'
  const page   = Number(searchParams.get('page') ?? '0')

  const updateUrl = (updates: Record<string, string>) => {
    const p = new URLSearchParams(searchParams.toString())
    for (const [k, v] of Object.entries(updates)) {
      if (v) p.set(k, v); else p.delete(k)
    }
    startTransition(() => router.push(`${pathname}?${p}`))
  }

  const fetchReviews = useCallback(async () => {
    setLoading(true)
    try {
      const p = new URLSearchParams({ status, page: String(page) })
      const res  = await fetch(`/api/admin/reviews?${p}`)
      const data = await res.json()
      setReviews(data.reviews ?? [])
      setTotal(data.total ?? 0)
      setTotalPages(data.totalPages ?? 0)
    } catch {
      setReviews([])
    } finally {
      setLoading(false)
    }
  }, [status, page])

  // Fetch counts for all tabs simultaneously
  const fetchCounts = useCallback(async () => {
    const [pending, approved, rejected] = await Promise.all([
      fetch('/api/admin/reviews?status=pending&page=0').then(r => r.json()),
      fetch('/api/admin/reviews?status=approved&page=0').then(r => r.json()),
      fetch('/api/admin/reviews?status=rejected&page=0').then(r => r.json()),
    ])
    setCounts({
      pending:  pending.total  ?? 0,
      approved: approved.total ?? 0,
      rejected: rejected.total ?? 0,
    })
  }, [])

  useEffect(() => { fetchReviews() }, [fetchReviews])
  useEffect(() => { fetchCounts() }, [fetchCounts])

  const act = async (id: string, updates: Record<string, unknown>) => {
    setActioning(prev => new Set(prev).add(id))
    try {
      const res = await fetch(`/api/admin/reviews/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      if (!res.ok) throw new Error()
      setReviews(prev => prev.filter(r => r.id !== id))
      showToast('Review updated', 'success')
      fetchCounts()
    } catch {
      showToast('Action failed', 'error')
    } finally {
      setActioning(prev => { const n = new Set(prev); n.delete(id); return n })
    }
  }

  const deleteReview = async (id: string) => {
    setActioning(prev => new Set(prev).add(id))
    try {
      await fetch(`/api/admin/reviews/${id}`, { method: 'DELETE' })
      setReviews(prev => prev.filter(r => r.id !== id))
      showToast('Review deleted', 'success')
      fetchCounts()
    } catch {
      showToast('Delete failed', 'error')
    } finally {
      setActioning(prev => { const n = new Set(prev); n.delete(id); return n })
    }
  }

  return (
    <div className="space-y-5 max-w-[900px]">
      {ToastComponent}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#1a1a1a]">Reviews</h1>
          <p className="text-xs text-[#6b7280] mt-0.5">Moderate and manage customer reviews</p>
        </div>
        <button
          onClick={() => { fetchReviews(); fetchCounts() }}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 border border-[#e5e7eb] rounded-lg text-xs text-[#6b7280] hover:bg-gray-50 disabled:opacity-50 transition-colors"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {/* Status Tabs */}
      <div className="flex gap-1.5">
        {STATUS_TABS.map(tab => (
          <button
            key={tab.value}
            onClick={() => updateUrl({ status: tab.value, page: '' })}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all border ${
              status === tab.value
                ? `${tab.bg} ${tab.color}`
                : 'bg-white border-[#e5e7eb] text-[#6b7280] hover:bg-gray-50'
            }`}
          >
            {tab.label}
            {counts[tab.value as keyof typeof counts] > 0 && (
              <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${
                status === tab.value ? 'bg-white/60' : 'bg-gray-100'
              }`}>
                {counts[tab.value as keyof typeof counts]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Review List */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white border border-[#e5e7eb] rounded-xl p-5 animate-pulse">
              <div className="h-4 bg-gray-100 rounded w-40 mb-3" />
              <div className="h-3 bg-gray-100 rounded w-full mb-2" />
              <div className="h-3 bg-gray-100 rounded w-3/4" />
            </div>
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <div className="bg-white border border-[#e5e7eb] rounded-xl p-16 text-center">
          <MessageSquare size={32} className="mx-auto text-gray-200 mb-3" />
          <p className="text-sm text-[#6b7280]">No {status} reviews</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map(review => {
            const isActioning = actioning.has(review.id)
            return (
              <div
                key={review.id}
                className="bg-white border border-[#e5e7eb] rounded-xl p-5 hover:shadow-sm transition-shadow"
              >
                {/* Top row */}
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-semibold text-sm text-[#1a1a1a] truncate">
                        {review.profiles?.full_name || 'Anonymous'}
                      </span>
                      {review.is_verified && (
                        <span className="flex items-center gap-0.5 text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded-full">
                          <BadgeCheck size={10} /> Verified
                        </span>
                      )}
                      {review.profiles?.email && (
                        <span className="text-[10px] text-[#9ca3af]">{review.profiles.email}</span>
                      )}
                    </div>
                    <StarRow rating={review.rating} />
                  </div>
                  <div className="text-right flex-shrink-0">
                    {review.products && (
                      <a
                        href={`/products/${review.products.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-[#1b3a34] font-medium hover:underline flex items-center gap-1 justify-end"
                      >
                        {review.products.name} <ExternalLink size={10} />
                      </a>
                    )}
                    <p className="text-[10px] text-[#9ca3af] mt-0.5">{formatDate(review.created_at)}</p>
                  </div>
                </div>

                {/* Review body */}
                <div className="bg-[#f9f9f9] rounded-lg p-3.5 mb-3">
                  {review.title && (
                    <p className="font-semibold text-sm text-[#1a1a1a] mb-1">{review.title}</p>
                  )}
                  <p className="text-sm text-[#4b5563] leading-relaxed">
                    {review.body || <span className="text-[#9ca3af] italic">No body text</span>}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-wrap">
                  {status !== 'approved' && (
                    <button
                      onClick={() => act(review.id, { status: 'approved' })}
                      disabled={isActioning}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                    >
                      <CheckCircle2 size={12} /> Approve
                    </button>
                  )}
                  {status !== 'rejected' && (
                    <button
                      onClick={() => act(review.id, { status: 'rejected' })}
                      disabled={isActioning}
                      className="flex items-center gap-1.5 px-3 py-1.5 border border-red-200 text-red-600 rounded-lg text-xs font-semibold hover:bg-red-50 disabled:opacity-50 transition-colors"
                    >
                      <XCircle size={12} /> Reject
                    </button>
                  )}
                  {status !== 'pending' && (
                    <button
                      onClick={() => act(review.id, { status: 'pending' })}
                      disabled={isActioning}
                      className="flex items-center gap-1.5 px-3 py-1.5 border border-[#e5e7eb] text-[#6b7280] rounded-lg text-xs font-semibold hover:bg-gray-50 disabled:opacity-50 transition-colors"
                    >
                      <Clock size={12} /> Move to Pending
                    </button>
                  )}
                  {!review.is_verified && (
                    <button
                      onClick={() => act(review.id, { is_verified: true })}
                      disabled={isActioning}
                      className="flex items-center gap-1.5 px-3 py-1.5 border border-emerald-200 text-emerald-600 rounded-lg text-xs font-semibold hover:bg-emerald-50 disabled:opacity-50 transition-colors"
                    >
                      <BadgeCheck size={12} /> Mark Verified
                    </button>
                  )}
                  <button
                    onClick={() => deleteReview(review.id)}
                    disabled={isActioning}
                    className="ml-auto flex items-center gap-1.5 px-3 py-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg text-xs transition-colors disabled:opacity-50"
                  >
                    <Trash2 size={12} /> Delete
                  </button>
                </div>
              </div>
            )
          })}
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
