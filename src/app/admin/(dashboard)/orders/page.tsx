'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Search } from 'lucide-react'

const STATUS_TABS = ['All', 'Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled']
const STATUS_BADGE: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  processing: 'bg-blue-100 text-blue-800',
  shipped: 'bg-orange-100 text-orange-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [status, setStatus] = useState('')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  const fetchOrders = async () => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page) })
    if (status) params.set('status', status)
    if (search) params.set('search', search)
    const res = await fetch(`/api/admin/orders?${params}`)
    const data = await res.json()
    setOrders(data.orders || [])
    setTotal(data.total || 0)
    setTotalPages(data.totalPages || 0)
    setLoading(false)
  }

  useEffect(() => { fetchOrders() }, [status, search, page])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1a1a1a]">Orders</h1>
        <p className="text-[#6b7280] text-sm mt-0.5">{total} total orders</p>
      </div>

      {/* Status tabs */}
      <div className="flex gap-1 overflow-x-auto">
        {STATUS_TABS.map(t => (
          <button key={t}
            onClick={() => { setStatus(t === 'All' ? '' : t.toLowerCase()); setPage(0) }}
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
              (t === 'All' && !status) || status === t.toLowerCase()
                ? 'bg-[#1b3a34] text-white'
                : 'bg-white border border-[#e5e7eb] text-[#6b7280] hover:text-[#1a1a1a]'
            }`}
          >{t}</button>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6b7280]" />
        <input value={search} onChange={e => { setSearch(e.target.value); setPage(0) }}
          placeholder="Search by order # or customer..."
          className="w-full pl-9 pr-4 py-2 border border-[#e5e7eb] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1b3a34]" />
      </div>

      <div className="bg-white border border-[#e5e7eb] rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#1b3a34] text-white text-left">
                <th className="px-4 py-3">Order #</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Items</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Payment</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="border-t border-[#e5e7eb] animate-pulse">
                    {[...Array(8)].map((_, j) => <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-200 rounded" /></td>)}
                  </tr>
                ))
              ) : orders.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-16 text-[#6b7280]">No orders yet</td></tr>
              ) : orders.map((o, i) => (
                <tr key={o.id} className={`border-t border-[#e5e7eb] hover:bg-[#f0fdf4] transition-colors ${i % 2 === 0 ? 'bg-white' : 'bg-[#f9f9f9]'}`}>
                  <td className="px-4 py-3 font-mono font-medium text-[#1b3a34]">#{o.order_number}</td>
                  <td className="px-4 py-3 text-[#6b7280]">{new Date(o.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' })}</td>
                  <td className="px-4 py-3">{o.customer_name || o.guest_email || '—'}</td>
                  <td className="px-4 py-3 text-[#6b7280]">{Array.isArray(o.items) ? o.items.length : '—'}</td>
                  <td className="px-4 py-3 font-medium">₹{Number(o.total).toLocaleString('en-IN')}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${o.payment_status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                      {o.payment_status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${STATUS_BADGE[o.status] || 'bg-gray-100 text-gray-700'}`}>
                      {o.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/admin/orders/${o.id}`} className="text-[#1b3a34] hover:underline text-sm font-medium">View →</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-[#e5e7eb] text-sm text-[#6b7280]">
            <span>Page {page + 1} of {totalPages}</span>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
                className="px-3 py-1.5 border border-[#e5e7eb] rounded-lg hover:bg-gray-50 disabled:opacity-40">← Prev</button>
              <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
                className="px-3 py-1.5 border border-[#e5e7eb] rounded-lg hover:bg-gray-50 disabled:opacity-40">Next →</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
