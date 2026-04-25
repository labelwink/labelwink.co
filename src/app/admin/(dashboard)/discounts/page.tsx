'use client'

import { useState, useEffect } from 'react'
import { useToast } from '@/components/admin/Toast'
import { Trash2, Plus, Tag } from 'lucide-react'

export default function DiscountsPage() {
  const [coupons, setCoupons] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ code: '', type: 'percent', value: '', min_order: '', max_uses: '', expires_at: '' })
  const { showToast, ToastComponent } = useToast()

  useEffect(() => {
    fetch('/api/admin/discounts').then(r => r.json()).then(d => { setCoupons(Array.isArray(d) ? d : []); setLoading(false) })
  }, [])

  const create = async () => {
    if (!form.code.trim() || !form.value) return showToast('Code and value are required', 'error')
    const res = await fetch('/api/admin/discounts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: form.code.toUpperCase().trim(),
        discount_type: form.type,
        discount_value: Number(form.value),
        min_order_amount: form.min_order ? Number(form.min_order) : null,
        max_uses: form.max_uses ? Number(form.max_uses) : null,
        expires_at: form.expires_at || null,
        is_active: true,
        used_count: 0,
      }),
    })
    if (res.ok) {
      const c = await res.json()
      setCoupons(prev => [c, ...prev])
      setShowForm(false)
      setForm({ code: '', type: 'percent', value: '', min_order: '', max_uses: '', expires_at: '' })
      showToast('Coupon created ✓', 'success')
    } else {
      showToast('Failed to create coupon', 'error')
    }
  }

  const remove = async (id: string) => {
    await fetch('/api/admin/discounts', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    setCoupons(prev => prev.filter(c => c.id !== id))
    showToast('Coupon deleted', 'success')
  }

  return (
    <div className="space-y-6">
      {ToastComponent}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#1a1a1a]">Discounts & Coupons</h1>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 px-4 py-2 bg-[#1b3a34] text-white rounded-xl text-sm hover:bg-[#234d44]">
          <Plus size={16} /> Add Coupon
        </button>
      </div>

      {showForm && (
        <div className="bg-white border border-[#e5e7eb] rounded-xl p-6 space-y-4">
          <h2 className="font-semibold text-[#1a1a1a]">New Coupon</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium mb-1">Coupon Code</label>
              <input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} placeholder="e.g. WINK20"
                className="w-full border border-[#e5e7eb] rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1b3a34] uppercase" /></div>
            <div><label className="block text-sm font-medium mb-1">Type</label>
              <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                className="w-full border border-[#e5e7eb] rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1b3a34] bg-white">
                <option value="percent">Percentage (%)</option>
                <option value="flat">Flat Amount (₹)</option>
              </select></div>
            <div><label className="block text-sm font-medium mb-1">Value</label>
              <input type="number" value={form.value} onChange={e => setForm(f => ({ ...f, value: e.target.value }))} placeholder={form.type === 'percent' ? '20' : '200'}
                className="w-full border border-[#e5e7eb] rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1b3a34]" /></div>
            <div><label className="block text-sm font-medium mb-1">Min Order (₹)</label>
              <input type="number" value={form.min_order} onChange={e => setForm(f => ({ ...f, min_order: e.target.value }))}
                className="w-full border border-[#e5e7eb] rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1b3a34]" /></div>
            <div><label className="block text-sm font-medium mb-1">Max Uses</label>
              <input type="number" value={form.max_uses} onChange={e => setForm(f => ({ ...f, max_uses: e.target.value }))} placeholder="Unlimited"
                className="w-full border border-[#e5e7eb] rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1b3a34]" /></div>
            <div><label className="block text-sm font-medium mb-1">Expiry Date</label>
              <input type="date" value={form.expires_at} onChange={e => setForm(f => ({ ...f, expires_at: e.target.value }))}
                className="w-full border border-[#e5e7eb] rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1b3a34]" /></div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setShowForm(false)} className="px-5 py-2 border border-[#e5e7eb] rounded-xl text-sm hover:bg-gray-50">Cancel</button>
            <button onClick={create} className="px-5 py-2 bg-[#1b3a34] text-white rounded-xl text-sm hover:bg-[#234d44]">Create Coupon</button>
          </div>
        </div>
      )}

      <div className="bg-white border border-[#e5e7eb] rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#1b3a34] text-white text-left">
              <th className="px-4 py-3">Code</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Value</th>
              <th className="px-4 py-3">Min Order</th>
              <th className="px-4 py-3">Uses</th>
              <th className="px-4 py-3">Expires</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="text-center py-12 text-[#6b7280] animate-pulse">Loading…</td></tr>
            ) : coupons.length === 0 ? (
              <tr><td colSpan={8} className="text-center py-12 text-[#6b7280]">No coupons yet</td></tr>
            ) : coupons.map((c, i) => (
              <tr key={c.id} className={`border-t border-[#e5e7eb] hover:bg-gray-50 ${i % 2 === 0 ? 'bg-white' : 'bg-[#f9f9f9]'}`}>
                <td className="px-4 py-3 font-mono font-bold text-[#1b3a34]">{c.code}</td>
                <td className="px-4 py-3">{c.discount_type === 'percent' ? '%' : '₹'}</td>
                <td className="px-4 py-3">{c.discount_type === 'percent' ? `${c.discount_value}%` : `₹${c.discount_value}`}</td>
                <td className="px-4 py-3">{c.min_order_amount ? `₹${c.min_order_amount}` : '—'}</td>
                <td className="px-4 py-3">{c.used_count || 0}{c.max_uses ? ` / ${c.max_uses}` : ''}</td>
                <td className="px-4 py-3">{c.expires_at ? new Date(c.expires_at).toLocaleDateString('en-IN') : 'No expiry'}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${c.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {c.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button onClick={() => remove(c.id)} className="text-red-400 hover:text-red-600 transition-colors p-1">
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
