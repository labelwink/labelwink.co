'use client'

import { useState, useEffect } from 'react'
import { useToast } from '@/components/admin/Toast'
import { Printer, Package, MapPin, CreditCard, Truck, ChevronDown } from 'lucide-react'

const STATUSES = ['Pending', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled']
const STATUS_BADGE: Record<string, string> = {
  pending:   'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  shipped:   'bg-purple-100 text-purple-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
}

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [id, setId] = useState('')
  const [order, setOrder] = useState<any>(null)
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(true)
  const [trackingForm, setTrackingForm] = useState({ shipping_carrier: '', tracking_number: '', tracking_url: '' })
  const [savingTracking, setSavingTracking] = useState(false)
  const [srLoading, setSrLoading] = useState(false)
  const [srTracking, setSrTracking] = useState<any>(null)
  const { showToast, ToastComponent } = useToast()

  useEffect(() => {
    params.then(p => {
      setId(p.id)
      fetch(`/api/admin/orders/${p.id}`)
        .then(r => r.json())
        .then(data => {
          setOrder(data)
          setNotes(data.admin_notes || '')
          setTrackingForm({
            shipping_carrier: data.shipping_carrier || '',
            tracking_number: data.tracking_number || '',
            tracking_url: data.tracking_url || '',
          })
        })
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

  const saveTracking = async () => {
    setSavingTracking(true)
    const res = await fetch(`/api/admin/orders/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(trackingForm),
    })
    if (res.ok) {
      const data = await res.json()
      setOrder(data)
      showToast('Tracking saved', 'success')
    } else {
      showToast('Failed to save tracking', 'error')
    }
    setSavingTracking(false)
  }

  const pushToShiprocket = async () => {
    setSrLoading(true)
    const res = await fetch(`/api/admin/orders/${id}/shiprocket`, { method: 'POST' })
    const data = await res.json()
    if (data.success) {
      setOrder((prev: any) => ({ ...prev, shiprocket_order_id: data.shiprocket_order_id }))
      showToast('Pushed to Shiprocket', 'success')
    } else {
      showToast(data.error || 'Shiprocket push failed', 'error')
    }
    setSrLoading(false)
  }

  const fetchTracking = async () => {
    setSrLoading(true)
    const res = await fetch(`/api/admin/orders/${id}/shiprocket`)
    const data = await res.json()
    setSrTracking(data)
    setSrLoading(false)
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
          <nav className="text-sm text-[#6b7280] mb-1">Admin › Orders › <span className="text-[#1a1a1a]">#{order.id?.slice(0, 8).toUpperCase()}</span></nav>
          <h1 className="text-2xl font-bold text-[#1a1a1a]">Order #{order.id?.slice(0, 8).toUpperCase()}</h1>
        </div>
        <div className="flex gap-2">
          <button onClick={() => window.open(`/admin/orders/${id}/label`, '_blank')}
            className="flex items-center gap-2 px-4 py-2 border border-[#e5e7eb] rounded-xl text-sm hover:bg-gray-50">
            <Package size={16} /> Print Label
          </button>
          <button onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2 border border-[#e5e7eb] rounded-xl text-sm hover:bg-gray-50">
            <Printer size={16} /> Print Invoice
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[65%_1fr] gap-6">
        {/* Left */}
        <div className="space-y-6">
          {/* SECTION 1 — Customer Info */}
          <div className="bg-white border border-[#e5e7eb] rounded-xl p-6">
            <h2 className="font-semibold text-[#1a1a1a] mb-4 flex items-center gap-2">
              <MapPin size={16} className="text-[#1b3a34]" /> Customer Information
            </h2>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><p className="text-[#6b7280]">Name</p><p className="font-medium">{order.customer_name || addr.fullName || addr.full_name || '—'}</p></div>
              <div><p className="text-[#6b7280]">Email</p><p className="font-medium">{order.customer_email || order.guest_email || '—'}</p></div>
              <div><p className="text-[#6b7280]">Phone</p><p className="font-medium">{order.customer_phone || addr.phone || '—'}</p></div>
              <div><p className="text-[#6b7280]">Address</p>
                <p className="font-medium">{[addr.address, addr.city, addr.state, addr.pincode].filter(Boolean).join(', ') || '—'}</p>
              </div>
            </div>
          </div>

          {/* SECTION 2 — Order Items */}
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
                  <th className="text-right pb-2">Unit Price</th>
                  <th className="text-right pb-2">Line Total</th>
                </tr></thead>
                <tbody className="divide-y divide-[#e5e7eb]">
                  {items.map((item: any, i: number) => (
                    <tr key={i}>
                      <td className="py-2 font-medium">{item.name || item.product_name || '—'}</td>
                      <td className="py-2 text-center text-[#6b7280]">{item.size || '—'}</td>
                      <td className="py-2 text-center">{item.qty || item.quantity || 1}</td>
                      <td className="py-2 text-right">₹{Number(item.price).toLocaleString('en-IN')}</td>
                      <td className="py-2 text-right font-medium">₹{(Number(item.price) * (item.qty || item.quantity || 1)).toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="border-t-2 border-[#e5e7eb] text-sm">
                  <tr><td colSpan={4} className="pt-2 text-[#6b7280]">Subtotal</td><td className="pt-2 text-right">₹{Number(order.subtotal).toLocaleString('en-IN')}</td></tr>
                  <tr><td colSpan={4} className="text-[#6b7280]">Shipping</td><td className="text-right">₹{Number(order.shipping_fee || 0).toLocaleString('en-IN')}</td></tr>
                  {order.discount_amount > 0 && <tr><td colSpan={4} className="text-[#16a34a]">Discount ({order.coupon_code})</td><td className="text-right text-[#16a34a]">-₹{Number(order.discount_amount).toLocaleString('en-IN')}</td></tr>}
                  <tr className="font-bold text-base"><td colSpan={4} className="pt-2">Total</td><td className="pt-2 text-right">₹{Number(order.total || order.total_amount).toLocaleString('en-IN')}</td></tr>
                </tfoot>
              </table>
            )}
          </div>

          {/* SECTION 5 — Shipping / Tracking */}
          <div className="bg-white border border-[#e5e7eb] rounded-xl p-6 no-print">
            <h2 className="font-semibold text-[#1a1a1a] mb-4 flex items-center gap-2">
              <Truck size={16} className="text-[#1b3a34]" /> Shipping & Tracking
            </h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-[#6b7280] font-medium block mb-1">Carrier</label>
                <input value={trackingForm.shipping_carrier} onChange={e => setTrackingForm(f => ({ ...f, shipping_carrier: e.target.value }))}
                  className="w-full border border-[#e5e7eb] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1b3a34]"
                  placeholder="e.g. Delhivery, BlueDart" />
              </div>
              <div>
                <label className="text-xs text-[#6b7280] font-medium block mb-1">Tracking Number</label>
                <input value={trackingForm.tracking_number} onChange={e => setTrackingForm(f => ({ ...f, tracking_number: e.target.value }))}
                  className="w-full border border-[#e5e7eb] rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#1b3a34]"
                  placeholder="Tracking number" />
              </div>
              <div>
                <label className="text-xs text-[#6b7280] font-medium block mb-1">Tracking URL</label>
                <input value={trackingForm.tracking_url} onChange={e => setTrackingForm(f => ({ ...f, tracking_url: e.target.value }))}
                  className="w-full border border-[#e5e7eb] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1b3a34]"
                  placeholder="https://..." />
              </div>
              <button onClick={saveTracking} disabled={savingTracking}
                className="bg-[#1b3a34] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#16312b] disabled:opacity-60 transition-colors">
                {savingTracking ? 'Saving…' : 'Save Tracking'}
              </button>
            </div>

            {/* Shiprocket sub-section */}
            <div className="border border-[#e5e7eb] rounded-lg p-4 mt-6">
              <h3 className="font-medium text-[#1a1a1a] mb-3 text-sm">Shiprocket</h3>
              {order.shiprocket_order_id ? (
                <div className="space-y-3">
                  <p className="text-sm text-[#6b7280]">SR Order: <span className="font-mono font-medium text-[#1a1a1a]">{order.shiprocket_order_id}</span></p>
                  {srTracking && (
                    <pre className="text-xs bg-gray-50 p-3 rounded overflow-x-auto">
                      {JSON.stringify(srTracking, null, 2)}
                    </pre>
                  )}
                  <button onClick={fetchTracking} disabled={srLoading}
                    className="border border-[#e5e7eb] text-sm px-3 py-1.5 rounded-lg hover:bg-gray-50 disabled:opacity-60 transition-colors">
                    {srLoading ? 'Loading…' : 'Refresh Tracking'}
                  </button>
                </div>
              ) : (
                <button onClick={pushToShiprocket} disabled={srLoading}
                  className="bg-[#1a3a34] text-white px-4 py-2 rounded text-sm font-medium hover:bg-[#16312b] disabled:opacity-60 transition-colors">
                  {srLoading ? 'Pushing…' : 'Push to Shiprocket'}
                </button>
              )}
            </div>
          </div>

          {/* Admin Notes */}
          <div className="bg-white border border-[#e5e7eb] rounded-xl p-6 no-print">
            <h2 className="font-semibold text-[#1a1a1a] mb-3">Admin Notes</h2>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} onBlur={saveNotes} rows={3}
              className="w-full border border-[#e5e7eb] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1b3a34] resize-none"
              placeholder="Add internal notes about this order..." />
          </div>
        </div>

        {/* Right */}
        <div className="space-y-4 no-print">
          {/* SECTION 4 — Status Management */}
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

          {/* SECTION 6 — Payment */}
          <div className="bg-white border border-[#e5e7eb] rounded-xl p-6">
            <h2 className="font-semibold text-[#1a1a1a] mb-3 flex items-center gap-2">
              <CreditCard size={16} className="text-[#1b3a34]" /> Payment
            </h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-[#6b7280]">Method</span><span>{order.payment_method || '—'}</span></div>
              <div className="flex justify-between"><span className="text-[#6b7280]">Status</span>
                <span className={`font-semibold ${order.payment_status === 'paid' ? 'text-[#16a34a]' : 'text-yellow-600'}`}>{order.payment_status}</span>
              </div>
              {order.razorpay_order_id && <div className="flex justify-between"><span className="text-[#6b7280]">Razorpay ID</span><span className="font-mono text-xs">{order.razorpay_order_id}</span></div>}
              {order.razorpay_payment_id && <div className="flex justify-between"><span className="text-[#6b7280]">Payment ID</span><span className="font-mono text-xs">{order.razorpay_payment_id}</span></div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
