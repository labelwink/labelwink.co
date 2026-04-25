'use client'

import { useState, useEffect } from 'react'
import { useToast } from '@/components/admin/Toast'
import { Printer, ChevronDown } from 'lucide-react'

const STATUSES = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled']
const STATUS_BADGE: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  processing: 'bg-blue-100 text-blue-800',
  shipped: 'bg-orange-100 text-orange-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
}

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [id, setId] = useState('')
  const [order, setOrder] = useState<any>(null)
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(true)
  const { showToast, ToastComponent } = useToast()

  useEffect(() => {
    params.then(p => {
      setId(p.id)
      fetch(`/api/admin/orders/${p.id}`)
        .then(r => r.json())
        .then(data => { setOrder(data); setNotes(data.admin_notes || '') })
        .finally(() => setLoading(false))
    })
  }, [params])

  const updateStatus = async (status: string) => {
    const res = await fetch(`/api/admin/orders/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: status.toLowerCase() }),
    })
    if (res.ok) {
      const data = await res.json()
      setOrder(data)
      showToast('Status updated', 'success')
    }
  }

  const saveNotes = async () => {
    await fetch(`/api/admin/orders/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ admin_notes: notes }),
    })
    showToast('Notes saved', 'success')
  }

  if (loading) return <div className="text-center py-20 text-[#6b7280]">Loading…</div>
  if (!order) return <div className="text-center py-20 text-red-500">Order not found</div>

  const addr = order.shipping_address || {}
  const items = Array.isArray(order.items) ? order.items : []

  return (
    <div className="space-y-6">
      {ToastComponent}
      <style>{`@media print { .no-print { display: none !important; } body { background: white; } }`}</style>

      <div className="no-print flex items-center justify-between">
        <div>
          <nav className="text-sm text-[#6b7280] mb-1">Admin › Orders › <span className="text-[#1a1a1a]">#{order.order_number}</span></nav>
          <h1 className="text-2xl font-bold text-[#1a1a1a]">Order #{order.order_number}</h1>
        </div>
        <button onClick={() => window.print()}
          className="flex items-center gap-2 px-4 py-2 border border-[#e5e7eb] rounded-xl text-sm hover:bg-gray-50">
          <Printer size={16} /> Print Invoice
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[65%_1fr] gap-6">
        {/* Left */}
        <div className="space-y-6">
          {/* Customer */}
          <div className="bg-white border border-[#e5e7eb] rounded-xl p-6">
            <h2 className="font-semibold text-[#1a1a1a] mb-4">Customer Information</h2>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><p className="text-[#6b7280]">Name</p><p className="font-medium">{order.customer_name || '—'}</p></div>
              <div><p className="text-[#6b7280]">Email</p><p className="font-medium">{order.customer_email || order.guest_email || '—'}</p></div>
              <div><p className="text-[#6b7280]">Phone</p><p className="font-medium">{order.customer_phone || order.guest_phone || '—'}</p></div>
              <div><p className="text-[#6b7280]">Address</p>
                <p className="font-medium">{[addr.line1, addr.city, addr.state, addr.pincode].filter(Boolean).join(', ') || '—'}</p>
              </div>
            </div>
          </div>

          {/* Items */}
          <div className="bg-white border border-[#e5e7eb] rounded-xl p-6">
            <h2 className="font-semibold text-[#1a1a1a] mb-4">Order Items</h2>
            {items.length === 0 ? (
              <p className="text-[#6b7280] text-sm">No items recorded</p>
            ) : (
              <table className="w-full text-sm">
                <thead><tr className="border-b border-[#e5e7eb] text-[#6b7280]">
                  <th className="text-left pb-2">Product</th>
                  <th className="text-center pb-2">Size</th>
                  <th className="text-center pb-2">Qty</th>
                  <th className="text-right pb-2">Price</th>
                  <th className="text-right pb-2">Subtotal</th>
                </tr></thead>
                <tbody className="divide-y divide-[#e5e7eb]">
                  {items.map((item: any, i: number) => (
                    <tr key={i}>
                      <td className="py-2 font-medium">{item.name || item.product_name || '—'}</td>
                      <td className="py-2 text-center text-[#6b7280]">{item.size || '—'}</td>
                      <td className="py-2 text-center">{item.qty || item.quantity || 1}</td>
                      <td className="py-2 text-right">₹{Number(item.price).toLocaleString('en-IN')}</td>
                      <td className="py-2 text-right font-medium">₹{(Number(item.price) * (item.qty || 1)).toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="border-t-2 border-[#e5e7eb] text-sm">
                  <tr><td colSpan={4} className="pt-2 text-[#6b7280]">Subtotal</td><td className="pt-2 text-right">₹{Number(order.subtotal).toLocaleString('en-IN')}</td></tr>
                  <tr><td colSpan={4} className="text-[#6b7280]">Shipping</td><td className="text-right">₹{Number(order.shipping_fee || 0).toLocaleString('en-IN')}</td></tr>
                  {order.discount_amount > 0 && <tr><td colSpan={4} className="text-[#16a34a]">Discount ({order.coupon_code})</td><td className="text-right text-[#16a34a]">-₹{Number(order.discount_amount).toLocaleString('en-IN')}</td></tr>}
                  <tr className="font-bold text-base"><td colSpan={4} className="pt-2">Total</td><td className="pt-2 text-right">₹{Number(order.total).toLocaleString('en-IN')}</td></tr>
                </tfoot>
              </table>
            )}
          </div>

          {/* Notes */}
          <div className="bg-white border border-[#e5e7eb] rounded-xl p-6 no-print">
            <h2 className="font-semibold text-[#1a1a1a] mb-3">Admin Notes</h2>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} onBlur={saveNotes} rows={3}
              className="w-full border border-[#e5e7eb] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1b3a34] resize-none"
              placeholder="Add internal notes about this order..." />
          </div>
        </div>

        {/* Right */}
        <div className="space-y-4 no-print">
          {/* Status update */}
          <div className="bg-white border border-[#e5e7eb] rounded-xl p-6">
            <h2 className="font-semibold text-[#1a1a1a] mb-4">Order Status</h2>
            <div className="flex items-center justify-between mb-4">
              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${STATUS_BADGE[order.status] || 'bg-gray-100'}`}>
                {order.status}
              </span>
            </div>
            <div className="space-y-2">
              {STATUSES.map(s => (
                <button key={s} onClick={() => updateStatus(s)}
                  className={`w-full text-left px-4 py-2 rounded-xl text-sm transition-colors ${
                    order.status === s.toLowerCase() ? 'bg-[#1b3a34] text-white' : 'hover:bg-gray-50 border border-[#e5e7eb]'
                  }`}
                >{s}</button>
              ))}
            </div>
          </div>

          {/* Payment */}
          <div className="bg-white border border-[#e5e7eb] rounded-xl p-6">
            <h2 className="font-semibold text-[#1a1a1a] mb-3">Payment</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-[#6b7280]">Method</span><span>{order.payment_method || '—'}</span></div>
              <div className="flex justify-between"><span className="text-[#6b7280]">Status</span>
                <span className={`font-semibold ${order.payment_status === 'paid' ? 'text-[#16a34a]' : 'text-yellow-600'}`}>{order.payment_status}</span>
              </div>
              {order.razorpay_order_id && <div className="flex justify-between"><span className="text-[#6b7280]">Razorpay ID</span><span className="font-mono text-xs">{order.razorpay_order_id}</span></div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
