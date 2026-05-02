'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeft, ShoppingBag, Star, MapPin, Gift, Settings,
  RefreshCw, AlertTriangle, CheckCircle, ChevronRight,
} from 'lucide-react'
import Link from 'next/link'
import { formatCurrency, formatDate } from '@/lib/utils/format'
import { useToast } from '@/components/admin/Toast'

const TABS = ['Overview', 'Orders', 'Addresses', 'Loyalty', 'Account'] as const
type Tab = (typeof TABS)[number]

const STATUS_COLORS: Record<string, string> = {
  pending:    'bg-yellow-100 text-yellow-700',
  confirmed:  'bg-blue-100 text-blue-700',
  processing: 'bg-purple-100 text-purple-700',
  shipped:    'bg-indigo-100 text-indigo-700',
  delivered:  'bg-emerald-100 text-emerald-700',
  cancelled:  'bg-red-100 text-red-600',
  returned:   'bg-gray-100 text-gray-600',
}

export default function CustomerProfilePage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { showToast, ToastComponent } = useToast()

  const [data,     setData]     = useState<any>(null)
  const [loading,  setLoading]  = useState(true)
  const [tab,      setTab]      = useState<Tab>('Overview')
  const [resetting, setResetting] = useState(false)
  const [deactivating, setDeactivating] = useState(false)
  const [confirmDeact, setConfirmDeact] = useState(false)
  const [lAction,  setLAction]  = useState<'add'|'deduct'>('add')
  const [lPoints,  setLPoints]  = useState('')
  const [lReason,  setLReason]  = useState('')
  const [lLoading, setLLoading] = useState(false)
  const noteRef = useRef<HTMLTextAreaElement>(null)

  const fetch_ = async () => {
    setLoading(true)
    try {
      const res  = await fetch(`/api/admin/customers/${id}`)
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      setData(json)
    } catch (e: any) { showToast(e.message, 'error') }
    finally { setLoading(false) }
  }

  useEffect(() => { fetch_() }, [id])

  const sendReset = async () => {
    setResetting(true)
    const res = await fetch(`/api/admin/customers/${id}/reset-password`, { method: 'POST' })
    const d = await res.json()
    setResetting(false)
    if (res.ok) showToast(d.message, 'success')
    else showToast(d.error || 'Failed', 'error')
  }

  const toggleDeactivate = async (deactivate: boolean) => {
    setDeactivating(true)
    const res = await fetch(`/api/admin/customers/${id}/deactivate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deactivate }),
    })
    const d = await res.json()
    setDeactivating(false)
    setConfirmDeact(false)
    if (res.ok) { showToast(d.message, 'success'); fetch_() }
    else showToast(d.error || 'Failed', 'error')
  }

  const adjustLoyalty = async () => {
    if (!lPoints || !lReason) return
    setLLoading(true)
    const res = await fetch(`/api/admin/customers/${id}/loyalty`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: lAction, points: Number(lPoints), reason: lReason }),
    })
    const d = await res.json()
    setLLoading(false)
    if (res.ok) {
      showToast(`Points updated. New balance: ${d.new_balance}`, 'success')
      setLPoints(''); setLReason(''); fetch_()
    } else showToast(d.error || 'Failed', 'error')
  }

  const saveNote = async () => {
    const admin_note = noteRef.current?.value ?? ''
    await fetch(`/api/admin/customers/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ admin_note }),
    })
    showToast('Note saved', 'success')
  }

  if (loading) return (
    <div className="space-y-4 max-w-5xl animate-pulse">
      <div className="h-8 w-48 bg-gray-100 rounded" />
      <div className="h-32 bg-gray-100 rounded-xl" />
      <div className="h-64 bg-gray-100 rounded-xl" />
    </div>
  )

  if (!data) return (
    <div className="text-center py-20 text-[#6b7280]">Customer not found.</div>
  )

  const { profile, addresses, loyalty_points, loyalty_transactions, orders, reviews } = data

  const isDeactivated = !!profile.banned_until && new Date(profile.banned_until) > new Date()
  const avgOrderVal = orders.length ? orders.reduce((s: number, o: any) => s + Number(o.total), 0) / orders.length : 0
  const totalSpend  = orders.reduce((s: number, o: any) => s + Number(o.total), 0)
  const initials    = (profile.full_name || profile.email || 'U').slice(0, 2).toUpperCase()

  return (
    <div className="space-y-5 max-w-5xl">
      {ToastComponent}

      {/* Back + header */}
      <button onClick={() => router.back()} className="flex items-center gap-1.5 text-xs text-[#6b7280] hover:text-[#1a1a1a] transition-colors">
        <ArrowLeft size={13} /> Back to Customers
      </button>

      {/* Profile card */}
      <div className="bg-white border border-[#e5e7eb] rounded-xl p-6 flex flex-col sm:flex-row items-start sm:items-center gap-5">
        <div className="w-14 h-14 rounded-full bg-[#c9a84c]/10 text-[#c9a84c] flex items-center justify-center text-xl font-bold flex-shrink-0">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-lg font-bold text-[#1a1a1a]">{profile.full_name || 'Anonymous'}</h1>
            {isDeactivated
              ? <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-600">Deactivated</span>
              : <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">Active</span>
            }
            {profile.loyalty_tier && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">
                {profile.loyalty_tier}
              </span>
            )}
          </div>
          <p className="text-xs text-[#6b7280] mt-0.5">{profile.email} · {profile.phone || 'No phone'}</p>
          <p className="text-[10px] text-[#9ca3af] mt-1">
            Joined {formatDate(profile.created_at)}
            {profile.last_sign_in_at && ` · Last active ${formatDate(profile.last_sign_in_at)}`}
          </p>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Orders',     value: String(orders.length),            icon: ShoppingBag, color: 'text-blue-600',    bg: 'bg-blue-50' },
          { label: 'Lifetime Spend',   value: formatCurrency(totalSpend),        icon: ChevronRight, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Loyalty Points',   value: String(loyalty_points?.balance ?? profile.wink_points ?? 0), icon: Gift, color: 'text-[#c9a84c]', bg: 'bg-yellow-50' },
          { label: 'Avg Order Value',  value: formatCurrency(avgOrderVal),       icon: Star,  color: 'text-purple-600', bg: 'bg-purple-50' },
        ].map(s => (
          <div key={s.label} className="bg-white border border-[#e5e7eb] rounded-xl px-4 py-3 flex items-center gap-3">
            <div className={`w-8 h-8 ${s.bg} rounded-lg flex items-center justify-center flex-shrink-0`}>
              <s.icon size={15} className={s.color} />
            </div>
            <div>
              <p className="text-base font-bold text-[#1a1a1a] leading-none">{s.value}</p>
              <p className="text-[10px] text-[#9ca3af] mt-0.5">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="bg-white border border-[#e5e7eb] rounded-xl overflow-hidden">
        <div className="flex border-b border-[#e5e7eb] overflow-x-auto">
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-5 py-3.5 text-xs font-semibold uppercase tracking-wider whitespace-nowrap border-b-2 -mb-px transition-colors ${
                tab === t ? 'border-[#c9a84c] text-[#c9a84c]' : 'border-transparent text-[#6b7280] hover:text-[#1a1a1a]'
              }`}>
              {t}
            </button>
          ))}
        </div>

        <div className="p-6">
          {/* ── Overview ── */}
          {tab === 'Overview' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#9ca3af] mb-3">Recent Orders</h3>
                {orders.slice(0, 5).length === 0 ? (
                  <p className="text-sm text-[#9ca3af] italic">No orders yet.</p>
                ) : (
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-[10px] uppercase tracking-wider text-[#9ca3af] border-b border-[#f3f4f6]">
                        <th className="text-left py-2">Invoice</th>
                        <th className="text-left py-2">Date</th>
                        <th className="text-center py-2">Items</th>
                        <th className="text-right py-2">Total</th>
                        <th className="text-center py-2">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#f9f9f9]">
                      {orders.slice(0, 5).map((o: any) => (
                        <tr key={o.id} className="hover:bg-[#fafaf9]">
                          <td className="py-2.5">
                            <Link href={`/admin/orders/${o.id}`} className="font-mono text-[#c9a84c] hover:underline">
                              {o.invoice_number || o.id.slice(0,8).toUpperCase()}
                            </Link>
                          </td>
                          <td className="py-2.5 text-[#6b7280]">{formatDate(o.created_at)}</td>
                          <td className="py-2.5 text-center">{o.order_items?.length ?? 0}</td>
                          <td className="py-2.5 text-right font-semibold">{formatCurrency(o.total)}</td>
                          <td className="py-2.5 text-center">
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${STATUS_COLORS[o.status] || 'bg-gray-100 text-gray-600'}`}>
                              {o.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#9ca3af] mb-3">Recent Reviews</h3>
                {reviews.length === 0 ? (
                  <p className="text-sm text-[#9ca3af] italic">No reviews submitted.</p>
                ) : (
                  <div className="space-y-2">
                    {reviews.slice(0, 3).map((r: any) => (
                      <div key={r.id} className="flex items-center justify-between py-2 border-b border-[#f3f4f6]">
                        <div>
                          <p className="text-xs font-medium text-[#1a1a1a]">{r.products?.name || 'Product'}</p>
                          <div className="flex gap-0.5 mt-0.5">
                            {[1,2,3,4,5].map(i => <Star key={i} size={10} className={i <= r.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'} />)}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] text-[#9ca3af]">{formatDate(r.created_at)}</p>
                          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${r.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-yellow-100 text-yellow-700'}`}>
                            {r.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Orders ── */}
          {tab === 'Orders' && (
            orders.length === 0
              ? <p className="text-sm text-[#9ca3af] italic">No orders.</p>
              : <table className="w-full text-xs">
                  <thead>
                    <tr className="text-[10px] uppercase tracking-wider text-[#9ca3af] border-b border-[#f3f4f6]">
                      <th className="text-left py-2">Invoice</th>
                      <th className="text-left py-2">Date</th>
                      <th className="text-center py-2">Items</th>
                      <th className="text-right py-2">Total</th>
                      <th className="text-center py-2">Payment</th>
                      <th className="text-center py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f9f9f9]">
                    {orders.map((o: any) => (
                      <tr key={o.id} className="hover:bg-[#fafaf9]">
                        <td className="py-2.5">
                          <Link href={`/admin/orders/${o.id}`} className="font-mono text-[#c9a84c] hover:underline">
                            {o.invoice_number || o.id.slice(0,8).toUpperCase()}
                          </Link>
                        </td>
                        <td className="py-2.5 text-[#6b7280]">{formatDate(o.created_at)}</td>
                        <td className="py-2.5 text-center">{o.order_items?.length ?? 0}</td>
                        <td className="py-2.5 text-right font-semibold">{formatCurrency(o.total)}</td>
                        <td className="py-2.5 text-center">
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${o.payment_status === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
                            {o.payment_status || '—'}
                          </span>
                        </td>
                        <td className="py-2.5 text-center">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${STATUS_COLORS[o.status] || 'bg-gray-100 text-gray-600'}`}>
                            {o.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
          )}

          {/* ── Addresses ── */}
          {tab === 'Addresses' && (
            addresses.length === 0
              ? <p className="text-sm text-[#9ca3af] italic">No saved addresses.</p>
              : <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {addresses.map((a: any) => (
                    <div key={a.id} className="border border-[#e5e7eb] rounded-xl p-4 text-xs text-[#4b5563] space-y-0.5">
                      <p className="font-semibold text-[#1a1a1a]">{a.full_name || a.name}</p>
                      <p>{a.line1}{a.line2 ? `, ${a.line2}` : ''}</p>
                      <p>{a.city}, {a.state} — {a.pincode}</p>
                      <p className="text-[#9ca3af]">{a.phone}</p>
                      {a.is_default && <span className="text-[10px] font-bold text-[#c9a84c]">Default</span>}
                    </div>
                  ))}
                </div>
          )}

          {/* ── Loyalty ── */}
          {tab === 'Loyalty' && (
            <div className="space-y-6">
              {/* Balance display */}
              <div className="flex items-center gap-4">
                <div className="bg-yellow-50 border border-[#c9a84c]/20 rounded-xl px-6 py-4 text-center">
                  <p className="text-3xl font-bold text-[#c9a84c]">{(loyalty_points?.balance ?? profile.wink_points ?? 0).toLocaleString('en-IN')}</p>
                  <p className="text-[10px] text-[#9ca3af] mt-1 uppercase tracking-wider">Current Balance</p>
                </div>
                {loyalty_points?.lifetime_earned != null && (
                  <div className="text-xs text-[#6b7280]">
                    <p>Lifetime earned: <strong>{loyalty_points.lifetime_earned.toLocaleString('en-IN')} pts</strong></p>
                    <p className="text-[#9ca3af]">Last updated: {formatDate(loyalty_points.updated_at)}</p>
                  </div>
                )}
              </div>

              {/* Adjust form */}
              <div className="bg-[#f9f9f9] border border-[#e5e7eb] rounded-xl p-5 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#9ca3af]">Manual Adjustment</h4>
                <div className="flex gap-2">
                  {(['add', 'deduct'] as const).map(a => (
                    <button key={a} onClick={() => setLAction(a)}
                      className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                        lAction === a ? 'bg-[#1a1a1a] text-white' : 'bg-white border border-[#e5e7eb] text-[#6b7280]'
                      }`}>
                      {a === 'add' ? '+ Add' : '− Deduct'}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input type="number" min="1" value={lPoints} onChange={e => setLPoints(e.target.value)}
                    placeholder="Points" className="w-28 px-3 py-2 text-xs border border-[#e5e7eb] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#c9a84c]/30" />
                  <input value={lReason} onChange={e => setLReason(e.target.value)}
                    placeholder="Reason (required)" className="flex-1 px-3 py-2 text-xs border border-[#e5e7eb] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#c9a84c]/30" />
                  <button onClick={adjustLoyalty} disabled={lLoading || !lPoints || !lReason}
                    className="px-4 py-2 bg-[#c9a84c] text-white text-xs font-semibold rounded-lg disabled:opacity-50 hover:bg-[#b8963e] transition-colors">
                    {lLoading ? <RefreshCw size={12} className="animate-spin" /> : 'Update Points'}
                  </button>
                </div>
              </div>

              {/* Transaction history */}
              {loyalty_transactions.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#9ca3af] mb-3">Transaction History</h4>
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-[10px] uppercase tracking-wider text-[#9ca3af] border-b border-[#f3f4f6]">
                        <th className="text-left py-2">Date</th>
                        <th className="text-center py-2">Type</th>
                        <th className="text-right py-2">Points</th>
                        <th className="text-left py-2">Reason</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#f9f9f9]">
                      {loyalty_transactions.map((t: any) => (
                        <tr key={t.id}>
                          <td className="py-2 text-[#9ca3af]">{formatDate(t.created_at)}</td>
                          <td className="py-2 text-center">
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${t.type === 'add' || t.points > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>
                              {t.type || (t.points > 0 ? 'add' : 'deduct')}
                            </span>
                          </td>
                          <td className={`py-2 text-right font-bold ${t.points > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                            {t.points > 0 ? '+' : ''}{t.points}
                          </td>
                          <td className="py-2 text-[#4b5563]">{t.reason || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ── Account Actions ── */}
          {tab === 'Account' && (
            <div className="space-y-6 max-w-lg">
              {/* Password reset */}
              <div className="border border-[#e5e7eb] rounded-xl p-5 space-y-3">
                <div>
                  <h4 className="text-sm font-semibold text-[#1a1a1a]">Send Password Reset Email</h4>
                  <p className="text-xs text-[#9ca3af] mt-0.5">A branded reset link will be sent via Brevo to {profile.email}</p>
                </div>
                <button onClick={sendReset} disabled={resetting || !profile.email}
                  className="flex items-center gap-2 px-4 py-2 bg-[#1a1a1a] text-white text-xs font-semibold rounded-lg hover:bg-[#333] disabled:opacity-50 transition-colors">
                  {resetting ? <RefreshCw size={13} className="animate-spin" /> : <CheckCircle size={13} />}
                  {resetting ? 'Sending…' : 'Send Reset Email'}
                </button>
              </div>

              {/* Deactivate toggle */}
              <div className={`border rounded-xl p-5 space-y-3 ${isDeactivated ? 'border-red-200 bg-red-50' : 'border-[#e5e7eb]'}`}>
                <div>
                  <h4 className="text-sm font-semibold text-[#1a1a1a]">
                    {isDeactivated ? 'Reactivate Account' : 'Deactivate Account'}
                  </h4>
                  <p className="text-xs text-[#9ca3af] mt-0.5">
                    {isDeactivated
                      ? 'Customer is currently banned. Reactivate to restore login access.'
                      : 'Customer will not be able to log in. All data is preserved.'}
                  </p>
                </div>
                {!confirmDeact ? (
                  <button onClick={() => setConfirmDeact(true)}
                    className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-colors ${
                      isDeactivated ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-red-600 text-white hover:bg-red-700'
                    }`}>
                    <AlertTriangle size={13} />
                    {isDeactivated ? 'Reactivate Account' : 'Deactivate Account'}
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button onClick={() => toggleDeactivate(!isDeactivated)} disabled={deactivating}
                      className="px-4 py-2 bg-red-600 text-white text-xs font-bold rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors">
                      {deactivating ? 'Processing…' : 'Confirm'}
                    </button>
                    <button onClick={() => setConfirmDeact(false)} className="px-4 py-2 border border-[#e5e7eb] text-xs rounded-lg hover:bg-gray-50">
                      Cancel
                    </button>
                  </div>
                )}
              </div>

              {/* Admin note */}
              <div className="border border-[#e5e7eb] rounded-xl p-5 space-y-3">
                <h4 className="text-sm font-semibold text-[#1a1a1a]">Internal Admin Note</h4>
                <textarea
                  ref={noteRef}
                  defaultValue={profile.admin_note || ''}
                  rows={4}
                  onBlur={saveNote}
                  placeholder="Add internal notes about this customer (auto-saved on blur)…"
                  className="w-full px-3 py-2.5 text-xs border border-[#e5e7eb] rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-[#c9a84c]/30"
                />
                <p className="text-[10px] text-[#9ca3af]">Saved automatically when you click away. Not visible to customers.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
