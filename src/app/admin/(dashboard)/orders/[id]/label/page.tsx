'use client'

import { useState, useEffect } from 'react'
import { Printer } from 'lucide-react'

export default function OrderLabelPage({ params }: { params: Promise<{ id: string }> }) {
  const [order, setOrder] = useState<any>(null)
  const [settings, setSettings] = useState<any>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    params.then(async p => {
      const [orderRes, settingsRes] = await Promise.all([
        fetch(`/api/admin/orders/${p.id}`),
        fetch('/api/admin/settings'),
      ])
      const orderData = await orderRes.json()
      const settingsData = settingsRes.ok ? await settingsRes.json() : {}
      setOrder(orderData)
      setSettings(settingsData)
      setLoading(false)
    })
  }, [params])

  if (loading) return <div className="p-8 text-gray-500">Loading label…</div>
  if (!order) return <div className="p-8 text-red-500">Order not found</div>

  const addr = order.shipping_address || {}
  const storeName = settings.store_name || 'Label Wink'
  const storeAddress = settings.store_address || ''
  const storePhone = settings.store_phone || ''
  const items = Array.isArray(order.items) ? order.items : []

  return (
    <div className="min-h-screen bg-white p-8 font-sans print:p-4">
      {/* Print button — hidden when printing */}
      <div className="print:hidden mb-6 flex gap-3">
        <button onClick={() => window.print()}
          className="flex items-center gap-2 bg-[#1b3a34] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#16312b] transition-colors">
          <Printer size={16} /> Print Label
        </button>
        <button onClick={() => window.close()}
          className="border border-gray-200 px-4 py-2 rounded-lg text-sm hover:bg-gray-50 transition-colors">
          Close
        </button>
      </div>

      {/* Label content */}
      <div className="max-w-md mx-auto border-2 border-black p-6 space-y-5">
        {/* Store header */}
        <div className="text-center border-b-2 border-black pb-4">
          <p className="text-xl font-bold uppercase tracking-widest">{storeName}</p>
          {storeAddress && <p className="text-xs mt-1 text-gray-600">{storeAddress}</p>}
          {storePhone && <p className="text-xs text-gray-600">{storePhone}</p>}
        </div>

        {/* TO */}
        <div>
          <p className="text-[10px] uppercase tracking-widest font-bold text-gray-500 mb-1">Ship To:</p>
          <p className="font-bold text-lg">{order.customer_name || addr.fullName || addr.full_name || '—'}</p>
          {addr.address && <p className="text-sm">{addr.address}</p>}
          <p className="text-sm">{[addr.city, addr.state, addr.pincode].filter(Boolean).join(', ')}</p>
          <p className="text-sm font-medium mt-1">📞 {order.customer_phone || addr.phone || '—'}</p>
        </div>

        {/* Order info */}
        <div className="border-t border-gray-200 pt-3 space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500 font-medium">Order ID:</span>
            <span className="font-mono font-bold">{order.id?.slice(0, 8).toUpperCase()}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500 font-medium">Date:</span>
            <span>{new Date(order.created_at).toLocaleDateString('en-IN')}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500 font-medium">Payment:</span>
            <span className="font-semibold capitalize">{order.payment_method} — {order.payment_status}</span>
          </div>
        </div>

        {/* Items summary */}
        {items.length > 0 && (
          <div className="border-t border-gray-200 pt-3">
            <p className="text-[10px] uppercase tracking-widest font-bold text-gray-500 mb-2">Items:</p>
            {items.map((item: any, i: number) => (
              <div key={i} className="flex justify-between text-sm">
                <span>{item.name || item.product_name}</span>
                <span className="font-medium">x{item.qty || item.quantity || 1}</span>
              </div>
            ))}
          </div>
        )}

        {/* Total */}
        <div className="border-t-2 border-black pt-3 flex justify-between font-bold">
          <span>Total:</span>
          <span>₹{Number(order.total || order.total_amount || 0).toLocaleString('en-IN')}</span>
        </div>

        {/* Order ID as barcode text */}
        <div className="text-center border-t border-gray-200 pt-3">
          <p className="font-mono text-sm tracking-[0.4em] text-gray-700">{order.id?.toUpperCase()}</p>
        </div>
      </div>
    </div>
  )
}
