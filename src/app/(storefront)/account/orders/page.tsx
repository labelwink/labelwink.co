'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function MyOrdersPage() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch('/api/storefront/orders')
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })
      .then(data => {
        if (cancelled) return
        // Defensively normalise: handle { orders: [] }, [], and unexpected shapes
        const normalised = Array.isArray(data)
          ? data
          : Array.isArray(data?.orders)
          ? data.orders
          : []
        setOrders(normalised)
      })
      .catch(err => {
        console.error('[storefront] fetch orders error', err)
        if (!cancelled) setError('Could not load orders. Please try again later.')
      })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  if (loading) return (
    <div className="py-12 text-center text-[#5a7060]">
      Loading your orders...
    </div>
  )

  if (error) return (
    <div className="py-12 text-center">
      <div className="text-4xl mb-4">⚠️</div>
      <p className="text-[#5a7060] text-sm mb-4">{error}</p>
      <button
        onClick={() => window.location.reload()}
        className="bg-[#1B3A2D] text-white px-6 py-2 rounded-xl text-sm font-medium hover:bg-[#152e23]">
        Try Again
      </button>
    </div>
  )

  if (!Array.isArray(orders) || orders.length === 0) return (
    <div className="py-12 text-center">
      <div className="text-5xl mb-4">📦</div>
      <h2 className="text-lg font-semibold text-[#1A1A1A] mb-2">
        No orders yet
      </h2>
      <p className="text-[#5a7060] text-sm mb-6">
        Your orders will appear here after purchase.
      </p>
      <Link href="/products"
            className="bg-[#1B3A2D] text-white px-6 py-3 
                       rounded-xl text-sm font-medium
                       hover:bg-[#152e23]">
        Start Shopping
      </Link>
    </div>
  )

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-[#1A1A1A] mb-6">
        My Orders ({orders.length})
      </h1>
      {orders.map((order: any) => (
        <div key={order.id}
             className="bg-white border border-[#E8E2D9] 
                        rounded-xl p-5 shadow-sm">
          
          {/* Order Header */}
          <div className="flex items-start justify-between 
                          flex-wrap gap-3 mb-4 pb-4 
                          border-b border-[#E8E2D9]">
            <div>
              <p className="font-bold text-[#1B3A2D] text-base">
                {order.order_number}
              </p>
              {order.invoices?.[0]?.invoice_number && (
                <p className="text-xs text-[#5a7060] mt-0.5">
                  Invoice: {order.invoices[0].invoice_number}
                </p>
              )}
              <p className="text-xs text-[#5a7060] mt-0.5">
                {new Date(order.created_at).toLocaleDateString('en-IN', {
                  day: 'numeric', month: 'long', year: 'numeric'
                })}
              </p>
            </div>
            <div className="text-right">
              <p className="font-bold text-[#1A1A1A]">
                ₹{order.total_amount}
              </p>
              <span className={`text-xs px-2.5 py-1 rounded-full 
                                font-medium mt-1 inline-block
                ${order.status === 'delivered' 
                  ? 'bg-green-100 text-green-700'
                  : order.status === 'cancelled'
                  ? 'bg-red-100 text-red-600'
                  : 'bg-[#F0F7F4] text-[#1B3A2D]'
                }`}>
                {order.status?.charAt(0).toUpperCase() + 
                 order.status?.slice(1)}
              </span>
            </div>
          </div>

          {/* Order Items */}
          {order.order_items?.map((item: any, i: number) => (
            <div key={i} 
                 className="flex items-center gap-3 py-2">
              {item.image_url && (
                <img src={item.image_url}
                     alt={item.product_name}
                     className="w-12 h-12 rounded-lg object-cover
                                border border-[#E8E2D9]" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#1A1A1A] 
                              truncate">
                  {item.product_name}
                </p>
                <p className="text-xs text-[#5a7060]">
                  Size: {item.size} • Qty: {item.quantity} • 
                  ₹{item.price}
                </p>
              </div>
            </div>
          ))}

          {/* View Details Link */}
          <div className="mt-3 pt-3 border-t border-[#E8E2D9]">
            <Link href={`/account/orders/${order.id}`}
                  className="text-sm text-[#1B3A2D] font-medium 
                             hover:underline">
              View Order Details →
            </Link>
          </div>
        </div>
      ))}
    </div>
  )
}
