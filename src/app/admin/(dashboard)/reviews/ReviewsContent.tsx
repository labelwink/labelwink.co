'use client'

import { useState, useEffect, useCallback, useTransition } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import {
  Star, CheckCircle2, XCircle, Clock, Trash2,
  MessageSquare, BadgeCheck, ChevronLeft, ChevronRight,
  RefreshCw, ExternalLink, Send, X as XIcon, Image as ImgIcon,
} from 'lucide-react'
import { useToast } from '@/components/admin/Toast'
import { formatDate } from '@/lib/utils/format'

interface Review {
  id: string
  rating: number
  title: string | null
  body: string | null
  photos: string[] | null
  status: 'pending' | 'approved' | 'rejected'
  is_verified_purchase: boolean
  admin_reply: string | null
  admin_replied_at: string | null
  rejection_reason: string | null
  created_at: string
  products: { id: string; name: string; slug: string } | null
  profiles: { id: string; full_name: string | null; email: string | null } | null
}

const STATUS_TABS = [
  { label: 'Pending',  value: 'pending',  dot: 'bg-amber-400' },
  { label: 'Approved', value: 'approved', dot: 'bg-emerald-500' },
  { label: 'Rejected', value: 'rejected', dot: 'bg-red-500' },
  { label: 'All',      value: 'all',      dot: 'bg-gray-400' },
] as const

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1,2,3,4,5].map(i => (
        <Star key={i} size={12} className={i <= rating ? 'fill-[#c9a84c] text-[#c9a84c]' : 'text-[#1a2e1e]'} />
      ))}
      <span className="text-[10px] text-[#9ca3af] ml-1">{rating}/5</span>
    </div>
  )
}

export default function ReviewsContent() {
  const router       = useRouter()
  const pathname     = usePathname()
  const searchParams = useSearchParams()
  const { showToast, ToastComponent } = useToast()
  const [, startTransition] = useTransition()

  const [reviews,   setReviews]   = useState<Review[]>([])
  const [total,     setTotal]     = useState(0)
  const [totalPages,setTotalPages]= useState(1)
  const [loading,   setLoading]   = useState(true)
  const [err,       setErr]       = useState<string|null>(null)
  const [counts,    setCounts]    = useState({ pending: 0, approved: 0, rejected: 0, all: 0 })
  const [actioning, setActioning] = useState<Set<string>>(new Set())
  const [lightbox,  setLightbox]  = useState<string|null>(null)

  // Per-review state: reply open/text/saving + rejection reason
  const [rs, setRs] = useState<Record<string, {
    open: boolean; text: string; saving: boolean
    rejectOpen: boolean; rejectReason: string
  }>>({})

  const status = (searchParams.get('status') ?? 'pending') as string
  const page   = Math.max(1, Number(searchParams.get('page') ?? '1'))

  const push = (updates: Record<string, string>) => {
    const p = new URLSearchParams(searchParams.toString())
    for (const [k, v] of Object.entries(updates)) { if (v) p.set(k, v); else p.delete(k) }
    startTransition(() => router.push(`${pathname}?${p}`, { scroll: false }))
  }

  const fetchReviews = useCallback(async () => {
    setLoading(true); setErr(null)
    try {
      const p = new URLSearchParams({ status, page: String(page) })
      const res  = await fetch(`/api/admin/reviews?${p}`)
      if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error || `HTTP ${res.status}`) }
      const data = await res.json()
      setReviews(data.reviews ?? [])
      setTotal(data.total ?? 0)
      setTotalPages(data.total_pages ?? 1)
    } catch (e: any) { setErr(e.message); setReviews([]) }
    finally { setLoading(false) }
  }, [status, page])

  const fetchCounts = useCallback(async () => {
    try {
      const [p, a, r, all] = await Promise.all([
        fetch('/api/admin/reviews?status=pending&page=1').then(x => x.json()),
        fetch('/api/admin/reviews?status=approved&page=1').then(x => x.json()),
        fetch('/api/admin/reviews?status=rejected&page=1').then(x => x.json()),
        fetch('/api/admin/reviews?status=all&page=1').then(x => x.json()),
      ])
      setCounts({ pending: p.total ?? 0, approved: a.total ?? 0, rejected: r.total ?? 0, all: all.total ?? 0 })
    } catch { /* ignore */ }
  }, [])

  useEffect(() => { fetchReviews() }, [fetchReviews])
  useEffect(() => { fetchCounts() }, [fetchCounts])

  // Optimistic status change
  const act = async (id: string, updates: Record<string, unknown>, optimisticStatus?: string) => {
    const prev = reviews.find(r => r.id === id)
    if (!prev) return
    setActioning(s => new Set(s).add(id))

    // Optimistic: remove from current filtered list if status changes
    if (optimisticStatus && optimisticStatus !== status && status !== 'all') {
      setReviews(cur => cur.filter(r => r.id !== id))
    } else if (optimisticStatus) {
      setReviews(cur => cur.map(r => r.id === id ? { ...r, ...updates as Partial<Review>, status: optimisticStatus as Review['status'] } : r))
    } else {
      setReviews(cur => cur.map(r => r.id === id ? { ...r, ...updates as Partial<Review> } : r))
    }

    try {
      const res = await fetch(`/api/admin/reviews/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      if (!res.ok) throw new Error((await res.json()).error || 'Failed')
      showToast('Review updated', 'success')
      fetchCounts()
    } catch (e: any) {
      // Revert optimistic update
      setReviews(cur => {
        if (cur.find(r => r.id === id)) return cur.map(r => r.id === id ? prev : r)
        return [...cur, prev]
      })
      showToast(e.message || 'Action failed', 'error')
    } finally {
      setActioning(s => { const n = new Set(s); n.delete(id); return n })
    }
  }

  const deleteReview = async (id: string) => {
    if (!confirm('Delete this review permanently?')) return
    setActioning(s => new Set(s).add(id))
    setReviews(cur => cur.filter(r => r.id !== id))
    try {
      const res = await fetch(`/api/admin/reviews/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      showToast('Review deleted', 'success')
      fetchCounts()
    } catch { showToast('Delete failed', 'error'); fetchReviews() }
    finally { setActioning(s => { const n = new Set(s); n.delete(id); return n }) }
  }

  const rState = (id: string) => rs[id] ?? { open: false, text: '', saving: false, rejectOpen: false, rejectReason: '' }
  const setR = (id: string, patch: Partial<ReturnType<typeof rState>>) =>
    setRs(p => ({ ...p, [id]: { ...rState(id), ...patch } }))

  const saveReply = async (id: string, approveWithReply = false) => {
    const text = rState(id).text
    setR(id, { saving: true })
    const updates: Record<string, unknown> = { admin_reply: text || null }
    if (approveWithReply) updates.status = 'approved'
    await act(id, updates, approveWithReply ? 'approved' : undefined)
    setR(id, { saving: false, open: false })
  }

  const submitReject = async (id: string) => {
    const reason = rState(id).rejectReason
    setR(id, { saving: true })
    await act(id, { status: 'rejected', rejection_reason: reason || null }, 'rejected')
    setR(id, { saving: false, rejectOpen: false, rejectReason: '' })
  }

  return (
    <div className="space-y-5 max-w-[900px]">
      {ToastComponent}

      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setLightbox(null)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={lightbox} alt="Review photo" className="max-h-[80vh] max-w-[80vw] rounded-lg object-contain" />
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#1b3a34]">Reviews</h1>
          <p className="text-xs text-[#6b7280] mt-0.5">Moderate and manage customer reviews</p>
        </div>
        <button onClick={() => { fetchReviews(); fetchCounts() }} disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 border border-[#e5e7eb] rounded-lg text-xs text-[#6b7280] hover:bg-gray-50 disabled:opacity-50 transition-colors">
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Pending',  value: counts.pending,  color: 'text-amber-600',  bg: 'bg-amber-50',   border: 'border-amber-200' },
          { label: 'Approved', value: counts.approved, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
          { label: 'Rejected', value: counts.rejected, color: 'text-red-600',    bg: 'bg-red-50',     border: 'border-red-200' },
          { label: 'Total',    value: counts.all,      color: 'text-[#1b3a34]',  bg: 'bg-white',      border: 'border-[#e5e7eb]' },
        ].map(s => (
          <div key={s.label} className={`border ${s.border} ${s.bg} rounded-xl px-4 py-3 text-center`}>
            <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-[10px] text-[#9ca3af] mt-0.5 uppercase tracking-wider">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5">
        {STATUS_TABS.map(tab => (
          <button key={tab.value}
            onClick={() => push({ status: tab.value, page: '' })}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all border ${
              status === tab.value
                ? 'bg-white text-[#1b3a34] border-[#e5e7eb]'
                : 'bg-white border-[#e5e7eb] text-[#6b7280] hover:bg-gray-50'
            }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${tab.dot}`} />
            {tab.label}
            {counts[tab.value as keyof typeof counts] > 0 && (
              <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${
                status === tab.value ? 'bg-gray-100' : 'bg-gray-100'
              }`}>
                {counts[tab.value as keyof typeof counts]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white border border-[#e5e7eb] rounded-xl p-5 animate-pulse space-y-3">
              <div className="h-4 bg-gray-100 rounded w-48" />
              <div className="h-3 bg-gray-100 rounded w-full" />
              <div className="h-3 bg-gray-100 rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : err ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
          <XCircle size={28} className="mx-auto text-red-300 mb-2" />
          <p className="text-sm text-red-600">{err}</p>
          <button onClick={fetchReviews} className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg text-xs font-semibold">Retry</button>
        </div>
      ) : reviews.length === 0 ? (
        <div className="bg-white border border-[#e5e7eb] rounded-xl p-16 text-center">
          <MessageSquare size={32} className="mx-auto text-[#1a2e1e] mb-3" />
          <p className="text-sm text-[#6b7280]">No {status} reviews</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map(review => {
            const busy  = actioning.has(review.id)
            const state = rState(review.id)
            const photos = review.photos?.filter(Boolean) ?? []

            return (
              <div key={review.id} className={`bg-white border rounded-xl p-5 transition-all ${
                busy ? 'opacity-60 pointer-events-none' : 'border-[#e5e7eb] hover:shadow-sm'
              }`}>
                {/* Top row */}
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-semibold text-sm text-[#1b3a34]">
                        {review.profiles?.full_name || 'Anonymous'}
                      </span>
                      {review.is_verified_purchase && (
                        <span className="flex items-center gap-0.5 text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded-full border border-emerald-200">
                          <BadgeCheck size={10} /> Verified Purchase
                        </span>
                      )}
                      {review.profiles?.email && (
                        <span className="text-[10px] text-[#9ca3af]">{review.profiles.email}</span>
                      )}
                    </div>
                    <Stars rating={review.rating} />
                  </div>
                  <div className="text-right flex-shrink-0 space-y-0.5">
                    {review.products && (
                      <a href={`/products/${review.products.slug}`} target="_blank" rel="noopener noreferrer"
                        className="text-xs text-[#c9a84c] font-medium hover:underline flex items-center gap-1 justify-end">
                        {review.products.name} <ExternalLink size={10} />
                      </a>
                    )}
                    <p className="text-[10px] text-[#9ca3af]">{formatDate(review.created_at)}</p>
                    {/* Status badge */}
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                      review.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                      review.status === 'rejected' ? 'bg-red-100 text-red-600' :
                      'bg-amber-100 text-amber-700'
                    }`}>{review.status}</span>
                  </div>
                </div>

                {/* Body */}
                <div className="bg-[#f9f9f9] rounded-lg p-3.5 mb-3">
                  {review.title && <p className="font-semibold text-sm text-[#1b3a34] mb-1">{review.title}</p>}
                  <p className="text-sm text-[#4b5563] leading-relaxed">
                    {review.body || <span className="text-[#9ca3af] italic">No body text</span>}
                  </p>
                </div>

                {/* Photos */}
                {photos.length > 0 && (
                  <div className="flex gap-2 mb-3">
                    {photos.slice(0, 4).map((url, i) => (
                      <button key={i} onClick={() => setLightbox(url)}
                        className="w-14 h-14 rounded-lg overflow-hidden border border-[#e5e7eb] flex-shrink-0 hover:opacity-80 transition-opacity">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={url} alt={`Photo ${i+1}`} className="w-full h-full object-cover" />
                      </button>
                    ))}
                    {photos.length > 4 && (
                      <div className="w-14 h-14 rounded-lg bg-gray-100 flex items-center justify-center text-xs text-[#6b7280]">
                        <div className="text-center"><ImgIcon size={12} className="mx-auto mb-0.5"/><span>+{photos.length-4}</span></div>
                      </div>
                    )}
                  </div>
                )}

                {/* Existing admin reply block */}
                {review.admin_reply && !state.open && (
                  <div className="mb-3 ml-1 pl-3 border-l-2 border-[#c9a84c]/50 bg-[#c9a84c]/5 rounded-r-lg py-2 pr-3">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[#c9a84c] mb-1">Label Wink Reply</p>
                    <p className="text-xs text-[#374151] leading-relaxed">{review.admin_reply}</p>
                    {review.admin_replied_at && (
                      <p className="text-[10px] text-[#9ca3af] mt-1">{formatDate(review.admin_replied_at)}</p>
                    )}
                  </div>
                )}

                {/* Rejection reason */}
                {review.status === 'rejected' && review.rejection_reason && !state.rejectOpen && (
                  <div className="mb-3 ml-1 pl-3 border-l-2 border-red-300 bg-red-50 rounded-r-lg py-2 pr-3">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-red-500 mb-1">Rejection Reason</p>
                    <p className="text-xs text-red-600">{review.rejection_reason}</p>
                  </div>
                )}

                {/* Reply textarea */}
                {state.open && (
                  <div className="mb-3 bg-[#fdfbf5] border border-[#c9a84c]/20 rounded-xl p-3.5 space-y-2">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[#c9a84c]">Admin Reply</p>
                    <textarea
                      value={state.text}
                      onChange={e => setR(review.id, { text: e.target.value })}
                      rows={3}
                      placeholder="Type your reply to the customer…"
                      className="w-full text-sm border border-[#e5e7eb] rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-[#c9a84c]/30 bg-white"
                    />
                    <div className="flex gap-2 flex-wrap">
                      <button onClick={() => saveReply(review.id)} disabled={state.saving}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1b3a34] text-white rounded-lg text-xs font-semibold hover:bg-[#16312b] disabled:opacity-50 transition-colors">
                        <Send size={11} /> {state.saving ? 'Saving…' : 'Save Reply'}
                      </button>
                      {review.status === 'pending' && state.text && (
                        <button onClick={() => saveReply(review.id, true)} disabled={state.saving}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 disabled:opacity-50 transition-colors">
                          <CheckCircle2 size={11} /> Approve with Reply
                        </button>
                      )}
                      {review.admin_reply && (
                        <button onClick={() => act(review.id, { admin_reply: null })} disabled={state.saving}
                          className="flex items-center gap-1.5 px-3 py-1.5 border border-red-200 text-red-500 rounded-lg text-xs font-semibold hover:bg-red-50 disabled:opacity-40 transition-colors">
                          <XIcon size={11} /> Clear Reply
                        </button>
                      )}
                      <button onClick={() => setR(review.id, { open: false })}
                        className="ml-auto px-3 py-1.5 text-xs text-[#6b7280] hover:text-[#1b3a34] transition-colors">
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* Reject with reason textarea */}
                {state.rejectOpen && (
                  <div className="mb-3 bg-red-50 border border-red-200 rounded-xl p-3.5 space-y-2">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-red-500">Rejection Reason (optional)</p>
                    <input
                      value={state.rejectReason}
                      onChange={e => setR(review.id, { rejectReason: e.target.value })}
                      placeholder="e.g. Contains inappropriate content"
                      className="w-full text-sm border border-red-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-300 bg-white"
                    />
                    <div className="flex gap-2">
                      <button onClick={() => submitReject(review.id)} disabled={state.saving}
                        className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-semibold hover:bg-red-700 disabled:opacity-50 transition-colors">
                        {state.saving ? 'Rejecting…' : 'Confirm Reject'}
                      </button>
                      <button onClick={() => setR(review.id, { rejectOpen: false })}
                        className="px-3 py-1.5 text-xs text-[#6b7280] hover:text-[#1b3a34] transition-colors">Cancel</button>
                    </div>
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex items-center gap-2 flex-wrap pt-1">
                  {review.status !== 'approved' && (
                    <button onClick={() => act(review.id, { status: 'approved' }, 'approved')} disabled={busy}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 disabled:opacity-50 transition-colors">
                      <CheckCircle2 size={12} /> Approve
                    </button>
                  )}
                  {review.status !== 'rejected' && !state.rejectOpen && (
                    <button onClick={() => setR(review.id, { rejectOpen: true })} disabled={busy}
                      className="flex items-center gap-1.5 px-3 py-1.5 border border-red-200 text-red-600 rounded-lg text-xs font-semibold hover:bg-red-50 disabled:opacity-50 transition-colors">
                      <XCircle size={12} /> Reject
                    </button>
                  )}
                  {review.status !== 'pending' && (
                    <button onClick={() => act(review.id, { status: 'pending' }, 'pending')} disabled={busy}
                      className="flex items-center gap-1.5 px-3 py-1.5 border border-[#e5e7eb] text-[#6b7280] rounded-lg text-xs font-semibold hover:bg-gray-50 disabled:opacity-50 transition-colors">
                      <Clock size={12} /> Move to Pending
                    </button>
                  )}
                  {!review.is_verified_purchase && (
                    <button onClick={() => act(review.id, { is_verified_purchase: true })} disabled={busy}
                      className="flex items-center gap-1.5 px-3 py-1.5 border border-emerald-200 text-emerald-600 rounded-lg text-xs font-semibold hover:bg-emerald-50 disabled:opacity-50 transition-colors">
                      <BadgeCheck size={12} /> Mark Verified
                    </button>
                  )}
                  <button onClick={() => setR(review.id, { open: !state.open, text: state.text || review.admin_reply || '' })}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      review.admin_reply
                        ? 'border border-[#c9a84c]/40 text-[#c9a84c] bg-[#c9a84c]/5 hover:bg-[#c9a84c]/10'
                        : 'border border-[#e5e7eb] text-[#6b7280] hover:bg-gray-50'
                    }`}>
                    <MessageSquare size={12} />
                    {review.admin_reply ? 'Edit Reply' : 'Reply'}
                  </button>
                  <button onClick={() => deleteReview(review.id)} disabled={busy}
                    className="ml-auto flex items-center gap-1.5 px-3 py-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg text-xs transition-colors disabled:opacity-50">
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
          <p className="text-xs text-[#6b7280]">Page {page} of {totalPages} · {total} reviews</p>
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
  )
}
