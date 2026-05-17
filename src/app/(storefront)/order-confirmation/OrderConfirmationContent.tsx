'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import confetti from 'canvas-confetti'
import { useToast } from '@/components/admin/Toast'

interface OrderItem {
  id: string
  quantity: number
  unit_price: number
  size?: string
  product_name?: string
  image_url?: string
}

interface Order {
  id: string
  order_number: string
  invoice_number?: string
  total_amount: number
  payment_status?: string
  order_items?: OrderItem[]
}

export default function OrderConfirmationContent() {
  const searchParams = useSearchParams()
  const orderId = searchParams.get('order_id')
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [celebrationShown, setCelebrationShown] = useState(false)
  const { showToast, ToastComponent } = useToast()

  useEffect(() => {
    if (!orderId) {
      setError('Order not found.')
      setLoading(false)
      return
    }

    fetch(`/api/storefront/orders/${encodeURIComponent(orderId)}`)
      .then((response) => {
        if (!response.ok) {
          throw new Error('Failed to load order.')
        }
        return response.json()
      })
      .then((data) => {
        setOrder(data.order ?? data)
        setLoading(false)
      })
      .catch(() => {
        setError('Order not found or unable to load order details.')
        setLoading(false)
      })
  }, [orderId])

  useEffect(() => {
    if (!order || celebrationShown) return

    const timers: number[] = []
    timers.push(
      window.setTimeout(() => {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { x: 0.5, y: 0.4 },
          colors: ['#1B3A2D', '#E8E2D9', '#D4AF37', '#FAF8F5', '#ffffff'],
          zIndex: 9999,
        })

        timers.push(
          window.setTimeout(() => {
            confetti({
              particleCount: 60,
              angle: 60,
              spread: 55,
              origin: { x: 0, y: 0.6 },
              colors: ['#1B3A2D', '#D4AF37', '#E8E2D9'],
              zIndex: 9999,
            })
          }, 200)
        )

        timers.push(
          window.setTimeout(() => {
            confetti({
              particleCount: 60,
              angle: 120,
              spread: 55,
              origin: { x: 1, y: 0.6 },
              colors: ['#1B3A2D', '#D4AF37', '#E8E2D9'],
              zIndex: 9999,
            })
          }, 400)
        )

        showToast(
          `🎉 Order ${order.order_number} confirmed! Check your email.`,
          'success',
          4000
        )
        setCelebrationShown(true)
      }, 300)
    )

    return () => timers.forEach((timer) => clearTimeout(timer))
  }, [order, celebrationShown, showToast])

  if (loading) {
    return (
      <>
        {ToastComponent}
        <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center">
          <div className="animate-spin text-4xl">⏳</div>
        </div>
      </>
    )
  }

  if (error || !order) {
    return (
      <>
        {ToastComponent}
        <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center px-4">
          <div className="max-w-lg bg-white rounded-3xl border border-[#E8E2D9] p-8 text-center shadow-sm">
            <h1 className="text-2xl font-bold text-[#1A1A1A] mb-4">Order not found</h1>
            <p className="text-[#5a7060] mb-6">
              We couldn’t find the order you were looking for. Please check the link and try again.
            </p>
            <Link
              href="/account/orders"
              className="inline-flex px-6 py-3 bg-[#1B3A2D] text-white rounded-xl text-sm font-medium hover:bg-[#152e23] transition-colors"
            >
              View My Orders
            </Link>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      {ToastComponent}
      <div className="min-h-screen bg-[#FAF8F5] py-12 px-4">
        <div className="max-w-xl mx-auto">
          <div className="text-center mb-8">
            <div className="relative flex items-center justify-center mb-6">
              <div className="absolute w-24 h-24 rounded-full bg-green-100 animate-ping opacity-30" />
              <div className="relative w-20 h-20 rounded-full bg-green-50 border-2 border-green-200 flex items-center justify-center">
                <span className="text-4xl">✅</span>
              </div>
            </div>
            <h1 className="text-2xl font-bold text-[#1A1A1A] mb-2">Order Placed Successfully!</h1>
            <p className="text-[#5a7060] text-sm">
              Thank you for shopping with LabelWink. You’ll receive a confirmation email shortly.
            </p>
          </div>

          <div className="bg-white border border-[#E8E2D9] rounded-xl p-6 mb-6 shadow-sm animate-fade-up">
            <h2 className="font-semibold text-[#1A1A1A] mb-4 pb-3 border-b border-[#E8E2D9]">
              Order Summary
            </h2>
            <div className="space-y-3 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-[#5a7060]">Order Number</span>
                <span className="font-bold text-[#1B3A2D] text-base">{order.order_number}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#5a7060]">Invoice</span>
                <span className="font-medium text-[#1A1A1A]">{order.invoice_number || 'Processing...'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#5a7060]">Amount Paid</span>
                <span className="font-bold text-[#1A1A1A]">₹{order.total_amount}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#5a7060]">Payment Status</span>
                <span className="text-green-600 font-medium bg-green-50 px-2 py-0.5 rounded-full text-xs">✅ Paid</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#5a7060]">Estimated Delivery</span>
                <span className="text-[#1A1A1A]">5–7 Business Days</span>
              </div>
            </div>

            {order.order_items?.length ? (
              <div className="border-t border-[#E8E2D9] pt-4 mt-4">
                <h3 className="text-sm font-semibold text-[#1A1A1A] mb-3">Items Ordered</h3>
                <div className="space-y-3">
                  {order.order_items.map((item, i) => (
                    <div key={i} className="flex items-center gap-3">
                      {item.image_url && (
                        <img
                          src={item.image_url}
                          alt={item.product_name ?? 'Product'}
                          className="w-14 h-14 rounded-lg object-cover border border-[#E8E2D9]"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#1A1A1A] truncate">
                          {item.product_name ?? 'Product'}
                        </p>
                        <p className="text-xs text-[#5a7060]">
                          {item.size ? `Size: ${item.size} • ` : ''}Qty: {item.quantity}
                        </p>
                      </div>
                      <span className="text-sm font-semibold text-[#1A1A1A]">₹{(item.unit_price ?? 0) * item.quantity}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 animate-fade-up" style={{ animationDelay: '0.3s', opacity: 0, animationFillMode: 'forwards' }}>
            <Link href="/account/orders" className="flex-1 border border-[#1B3A2D] text-[#1B3A2D] py-3 rounded-xl text-sm font-medium text-center hover:bg-[#F0ECE6] transition-colors">
              View My Orders
            </Link>
            <Link href="/products" className="flex-1 bg-[#1B3A2D] text-white py-3 rounded-xl text-sm font-medium text-center hover:bg-[#152e23] transition-colors">
              Continue Shopping →
            </Link>
          </div>

          <p className="text-center text-xs text-[#5a7060] mt-6">
            Need help? Email us at{' '}
            <a href="mailto:Support@labelwink.co" className="underline text-[#1B3A2D]">
              Support@labelwink.co
            </a>
          </p>
        </div>
      </div>
    </>
  )
}
