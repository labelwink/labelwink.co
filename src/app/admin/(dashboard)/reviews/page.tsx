'use client'

import { useState, useEffect, useCallback, useTransition } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import {
  Star, CheckCircle2, XCircle, Clock, Trash2,
  MessageSquare, BadgeCheck, ChevronLeft, ChevronRight,
  RefreshCw, ExternalLink, Send, X as XIcon,
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
  is_verified_purchase: boolean
  admin_reply: string | null
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
  const [error,      setError]      = useState<string | null>(null)
  const [counts,     setCounts]     = useState({ pending: 0, approved: 0, rejected: 0 })
  const [actioning,  setActioning]  = useState<Set<string>>(new Set())
  // Reply state: reviewId -> { open, text, saving }
  const [replyState, setReplyState] = useState<Record<string, { open: boolean; text: string; saving: boolean }>>({})

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
    setError(null)
    try {
      const p = new URLSearchParams({ status, page: String(page) })
      const res  = await fetch(`/api/admin/reviews?${p}`)
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }))
        console.error('Reviews API error:', err)
        setError(err.error || `Failed to load reviews (${res.status})`)
        setReviews([])
        return
      }
      const data = await res.json()
      setReviews(data.reviews ?? [])
      setTotal(data.total ?? 0)
      setTotalPages(data.totalPages ?? 0)
    } catch (e) {
      console.error('Reviews fetch exception:', e)
      setError('Network error — could not reach the server')
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

  const toggleReply = (id: string, currentReply: string | null) => {
    setReplyState(prev => ({
      ...prev,
      [id]: {
        open:   !(prev[id]?.open),
        text:   prev[id]?.text ?? (currentReply || ''),
        saving: false,
      },
    }))
  }

  const saveReply = async (id: string) => {
    const text = replyState[id]?.text ?? ''
    setReplyState(prev => ({ ...prev, [id]: { ...prev[id], saving: true } }))
    try {
      const res = await fetch(`/api/admin/reviews/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ admin_reply: text || null }),
      })
      if (!res.ok) throw new Error()
      // Update local review
      setReviews(prev => prev.map(r =>
        r.id === id ? { ...r, admin_reply: text || null } : r
      ))
      setReplyState(prev => ({ ...prev, [id]: { open: false, text, saving: false } }))
      showToast(text ? 'Reply saved' : 'Reply cleared', 'success')
    } catch {
      showToast('Failed to save reply', 'error')
      setReplyState(prev => ({ ...prev, [id]: { ...prev[id], saving: false } }))
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
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
          <XCircle size={32} className="mx-auto text-red-300 mb-3" />
          <p className="text-sm font-semibold text-red-700 mb-1">Error loading reviews</p>
          <p className="text-xs text-red-500 mb-4">{error}</p>
          <button
            onClick={() => { fetchReviews(); fetchCounts() }}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-600 text-white rounded-lg text-xs font-semibold hover:bg-red-700 transition-colors"
          >
            <RefreshCw size={12} /> Retry
          </button>
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
                      {review.is_verified_purchase && (
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

                {/* Existing admin reply */}
                {review.admin_reply && !replyState[review.id]?.open && (
                  <div className="mb-3 ml-1 pl-3 border-l-2 border-[#1b3a34]/30 bg-[#1b3a34]/5 rounded-r-lg py-2 pr-3">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[#1b3a34] mb-1">Admin Reply</p>
                    <p className="text-xs text-[#374151] leading-relaxed">{review.admin_reply}</p>
                  </div>
                )}

                {/* Reply textarea (expanded) */}
                {replyState[review.id]?.open && (
                  <div className="mb-3 bg-[#f0fafa] border border-[#1b3a34]/20 rounded-xl p-3.5 space-y-2 animate-in slide-in-from-top-1">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[#1b3a34]">Write Admin Reply</p>
                    <textarea
                      value={replyState[review.id]?.text ?? ''}
                      onChange={e => setReplyState(prev => ({ ...prev, [review.id]: { ...prev[review.id], text: e.target.value } }))}
                      rows={3}
                      placeholder="Type your reply to the customer…"
                      className="w-full text-sm border border-[#1b3a34]/20 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-[#1b3a34]/30 bg-white"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => saveReply(review.id)}
                        disabled={replyState[review.id]?.saving}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1b3a34] text-white rounded-lg text-xs font-semibold hover:bg-[#16312b] disabled:opacity-50 transition-colors"
                      >
                        <Send size={11} />
                        {replyState[review.id]?.saving ? 'Saving…' : 'Save Reply'}
                      </button>
                      {review.admin_reply && (
                        <button
                          onClick={() => saveReply(review.id)}
                          disabled={replyState[review.id]?.saving || !!replyState[review.id]?.text}
                          className="flex items-center gap-1.5 px-3 py-1.5 border border-red-200 text-red-500 rounded-lg text-xs font-semibold hover:bg-red-50 disabled:opacity-40 transition-colors"
                        >
                          <XIcon size={11} /> Clear Reply
                        </button>
                      )}
                      <button
                        onClick={() => toggleReply(review.id, review.admin_reply)}
                        className="ml-auto px-3 py-1.5 text-xs text-[#6b7280] hover:text-[#1a1a1a] transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

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
                  {!review.is_verified_purchase && (
                    <button
                      onClick={() => act(review.id, { is_verified_purchase: true })}
                      disabled={isActioning}
                      className="flex items-center gap-1.5 px-3 py-1.5 border border-emerald-200 text-emerald-600 rounded-lg text-xs font-semibold hover:bg-emerald-50 disabled:opacity-50 transition-colors"
                    >
                      <BadgeCheck size={12} /> Mark Verified
                    </button>
                  )}
                  {/* Reply toggle button */}
                  <button
                    onClick={() => toggleReply(review.id, review.admin_reply)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      review.admin_reply
                        ? 'border border-[#1b3a34]/30 text-[#1b3a34] bg-[#1b3a34]/5 hover:bg-[#1b3a34]/10'
                        : 'border border-[#e5e7eb] text-[#6b7280] hover:bg-gray-50'
                    }`}
                  >
                    <MessageSquare size={12} />
                    {review.admin_reply ? 'Edit Reply' : 'Reply'}
                  </button>
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
