'use client'

import { useState } from 'react'
import Link from 'next/link'

const STEPS = ['pending', 'confirmed', 'packed', 'dispatched', 'delivered'] as const
const STEP_LABELS: Record<string, string> = {
  pending: 'Placed',
  confirmed: 'Confirmed',
  packed: 'Packed',
  dispatched: 'Dispatched',
  shipped: 'Dispatched',
  delivered: 'Delivered',
}

interface OrderResult {
  order_id: string
  invoice_number: string | null
  status: string
  created_at: string
  customer_name: string
  items: { product_name: string; size: string; quantity: number }[]
  total: number
  shipping_method: string
  tracking_number: string | null
  tracking_url: string | null
  shipping_carrier: string | null
  estimated_delivery: string | null
  status_history: { status: string; created_at: string }[]
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n)
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function TrackOrderPage() {
  const [identifier, setIdentifier] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [order, setOrder] = useState<OrderResult | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setOrder(null)

    if (!identifier.trim() || !phone.trim()) {
      setError('Please fill in both fields.')
      return
    }
    if (phone.trim().length !== 4) {
      setError('Enter exactly the last 4 digits of your phone number.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/storefront/track-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: identifier.trim(), phone_last4: phone.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Order not found')
      setOrder(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Determine current step index for timeline
  const currentStepIndex = order
    ? STEPS.indexOf(
        order.status === 'shipped' ? 'dispatched' : (order.status as any)
      )
    : -1

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#faf8f4' }}>
      <div style={{ maxWidth: '480px', margin: '0 auto', padding: '80px 16px 64px' }}>

        {/* Icon */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{
            width: '64px', height: '64px',
            background: '#ffffff',
            borderRadius: '50%',
            border: '1px solid #e8e2d6',
            boxShadow: '0 1px 4px rgba(26,46,30,0.08)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 24px',
          }}>
            <span style={{ fontSize: '32px' }}>📦</span>
          </div>

          {/* Title — MUST be dark #1a2e1e */}
          <h1 style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: '28px',
            fontWeight: 700,
            color: '#1a2e1e',
            textAlign: 'center',
            marginBottom: '8px',
            margin: '0 0 8px',
          }}>
            Track Your Order
          </h1>
          <p style={{
            fontSize: '15px',
            color: '#5a7060',
            textAlign: 'center',
            margin: '0 0 32px',
          }}>
            Enter your order details to see its current status
          </p>
        </div>

        {/* Form card */}
        <form
          onSubmit={handleSubmit}
          style={{
            background: '#ffffff',
            border: '1px solid #e8e2d6',
            borderRadius: '12px',
            padding: '32px',
            boxShadow: '0 2px 12px rgba(26,46,30,0.06)',
          }}
        >
          {/* Order ID field */}
          <div style={{ marginBottom: '16px' }}>
            <label
              htmlFor="identifier"
              style={{
                display: 'block',
                fontSize: '11px',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: '#9aab9e',
                marginBottom: '8px',
              }}
            >
              Order ID or Invoice Number
            </label>
            <input
              id="identifier"
              type="text"
              value={identifier}
              onChange={e => setIdentifier(e.target.value)}
              placeholder="e.g. LW-2026-0042 or 3f8a…"
              style={{
                width: '100%',
                height: '48px',
                background: '#ffffff',
                border: '1px solid #e8e2d6',
                borderRadius: '8px',
                padding: '0 16px',
                fontSize: '15px',
                color: '#1a2e1e',
                outline: 'none',
                boxSizing: 'border-box',
                fontFamily: 'Inter, sans-serif',
              }}
              onFocus={e => {
                e.target.style.borderColor = '#2d5a3d'
                e.target.style.boxShadow = '0 0 0 3px rgba(45,90,61,0.1)'
              }}
              onBlur={e => {
                e.target.style.borderColor = '#e8e2d6'
                e.target.style.boxShadow = 'none'
              }}
            />
          </div>

          {/* Phone field */}
          <div style={{ marginBottom: '16px' }}>
            <label
              htmlFor="phone"
              style={{
                display: 'block',
                fontSize: '11px',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: '#9aab9e',
                marginBottom: '8px',
              }}
            >
              Phone (last 4 digits)
            </label>
            <input
              id="phone"
              type="text"
              inputMode="numeric"
              maxLength={4}
              value={phone}
              onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 4))}
              placeholder="e.g. 7890"
              style={{
                width: '100%',
                height: '48px',
                background: '#ffffff',
                border: '1px solid #e8e2d6',
                borderRadius: '8px',
                padding: '0 16px',
                fontSize: '15px',
                color: '#1a2e1e',
                outline: 'none',
                boxSizing: 'border-box',
                fontFamily: 'monospace',
                letterSpacing: '0.2em',
              }}
              onFocus={e => {
                e.target.style.borderColor = '#2d5a3d'
                e.target.style.boxShadow = '0 0 0 3px rgba(45,90,61,0.1)'
              }}
              onBlur={e => {
                e.target.style.borderColor = '#e8e2d6'
                e.target.style.boxShadow = 'none'
              }}
            />
          </div>

          {error && (
            <p style={{
              color: '#c0392b',
              fontSize: '14px',
              background: '#fdf0ef',
              border: '1px solid #f5c6c2',
              borderRadius: '8px',
              padding: '10px 14px',
              marginBottom: '16px',
            }}>
              {error}
            </p>
          )}

          {/* TRACK ORDER button — green background, white text */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              height: '48px',
              background: loading ? '#9aab9e' : '#2d5a3d',
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              borderRadius: '8px',
              border: 'none',
              marginTop: '8px',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background 150ms',
            }}
            onMouseEnter={e => { if (!loading) (e.currentTarget as HTMLButtonElement).style.background = '#3d7a53' }}
            onMouseLeave={e => { if (!loading) (e.currentTarget as HTMLButtonElement).style.background = '#2d5a3d' }}
          >
            {loading ? 'Searching…' : 'Track Order'}
          </button>
        </form>

        {/* Results */}
        {order && (
          <div style={{ marginTop: '40px', display: 'flex', flexDirection: 'column', gap: '24px' }}>

            {/* Status Timeline */}
            <div style={{
              background: '#ffffff',
              border: '1px solid #e8e2d6',
              borderRadius: '12px',
              padding: '32px',
              boxShadow: '0 2px 12px rgba(26,46,30,0.06)',
            }}>
              <h2 style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9aab9e', marginBottom: '24px' }}>
                Order Status
              </h2>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', position: 'relative' }}>
                <div style={{ position: 'absolute', top: '16px', left: 0, right: 0, height: '2px', background: '#e8e2d6', zIndex: 0 }} />
                <div style={{
                  position: 'absolute', top: '16px', left: 0, height: '2px',
                  background: '#c9a84c', zIndex: 0,
                  width: `${Math.max(0, (currentStepIndex / (STEPS.length - 1)) * 100)}%`,
                  transition: 'width 500ms',
                }} />
                {STEPS.map((step, i) => {
                  const isCompleted = i <= currentStepIndex
                  const isCurrent = i === currentStepIndex
                  return (
                    <div key={step} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 1, position: 'relative' }}>
                      <div style={{
                        width: '32px', height: '32px', borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '12px', fontWeight: 700,
                        border: `2px solid ${isCompleted ? '#c9a84c' : '#e8e2d6'}`,
                        background: isCompleted ? '#c9a84c' : '#ffffff',
                        color: isCompleted ? '#ffffff' : '#9aab9e',
                        transform: isCurrent ? 'scale(1.15)' : 'scale(1)',
                        transition: 'all 200ms',
                        boxShadow: isCurrent ? '0 0 0 4px rgba(201,168,76,0.2)' : 'none',
                      }}>
                        {isCompleted ? '✓' : i + 1}
                      </div>
                      <span style={{
                        fontSize: '10px', marginTop: '8px', fontWeight: isCurrent ? 700 : 500,
                        textTransform: 'uppercase', letterSpacing: '0.05em',
                        color: isCurrent ? '#c9a84c' : isCompleted ? '#2d5a3d' : '#9aab9e',
                      }}>
                        {STEP_LABELS[step]}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Delivered banner */}
            {order.status === 'delivered' && (
              <div style={{ background: '#eef5f1', border: '1px solid #c4dccb', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
                <p style={{ color: '#2d5a3d', fontWeight: 700, fontSize: '16px', margin: '0 0 4px' }}>Delivered ✅</p>
                <Link href="/account/orders" style={{ fontSize: '14px', color: '#2d5a3d', textDecorationLine: 'underline' }}>
                  How was your experience? Leave a review →
                </Link>
              </div>
            )}

            {/* Order Info Box */}
            <div style={{
              background: '#ffffff', border: '1px solid #e8e2d6',
              borderRadius: '12px', padding: '32px',
              boxShadow: '0 2px 12px rgba(26,46,30,0.06)',
            }}>
              <h2 style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9aab9e', marginBottom: '16px' }}>
                Order Details
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontSize: '14px' }}>
                {order.invoice_number && (
                  <div>
                    <span style={{ fontSize: '11px', color: '#9aab9e', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Invoice</span>
                    <p style={{ fontWeight: 700, color: '#1a2e1e', margin: '2px 0 0' }}>#{order.invoice_number}</p>
                  </div>
                )}
                <div>
                  <span style={{ fontSize: '11px', color: '#9aab9e', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Order ID</span>
                  <p style={{ fontWeight: 700, color: '#1a2e1e', fontFamily: 'monospace', margin: '2px 0 0' }}>#{String(order.order_id).substring(0, 8).toUpperCase()}</p>
                </div>
                <div>
                  <span style={{ fontSize: '11px', color: '#9aab9e', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Date</span>
                  <p style={{ fontWeight: 700, color: '#1a2e1e', margin: '2px 0 0' }}>{formatDate(order.created_at)}</p>
                </div>
                <div>
                  <span style={{ fontSize: '11px', color: '#9aab9e', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total</span>
                  <p style={{ fontWeight: 700, color: '#c9a84c', fontSize: '18px', margin: '2px 0 0' }}>{formatCurrency(order.total)}</p>
                </div>
              </div>

              {order.items.length > 0 && (
                <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #f5f2ec' }}>
                  <span style={{ fontSize: '11px', color: '#9aab9e', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Items</span>
                  <ul style={{ listStyle: 'none', padding: 0, margin: '8px 0 0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {order.items.map((item, idx) => (
                      <li key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                        <span style={{ color: '#1a2e1e' }}>
                          {item.product_name}
                          {item.size && <span style={{ color: '#9aab9e', marginLeft: '4px' }}>({item.size})</span>}
                        </span>
                        <span style={{ color: '#9aab9e' }}>×{item.quantity}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* AWB tracking box */}
            {(order.status === 'dispatched' || order.status === 'shipped') && order.tracking_number && (
              <div style={{
                background: '#ffffff', borderRadius: '12px', padding: '32px',
                border: '2px solid #c4dccb',
                boxShadow: '0 2px 12px rgba(26,46,30,0.06)',
              }}>
                <h2 style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#2d5a3d', marginBottom: '16px' }}>
                  Shipment Tracking
                </h2>
                <div style={{ textAlign: 'center' }}>
                  <span style={{ fontSize: '11px', color: '#9aab9e', textTransform: 'uppercase', letterSpacing: '0.05em' }}>AWB Number</span>
                  <p style={{ fontFamily: 'monospace', fontSize: '24px', fontWeight: 700, color: '#1a2e1e', marginTop: '4px', letterSpacing: '0.1em' }}>
                    {order.tracking_number}
                  </p>
                  {order.shipping_carrier && (
                    <p style={{ fontSize: '14px', color: '#9aab9e', marginTop: '8px' }}>
                      Carrier: <strong style={{ color: '#1a2e1e' }}>{order.shipping_carrier}</strong>
                    </p>
                  )}
                </div>
                {order.tracking_url && (
                  <div style={{ marginTop: '16px', textAlign: 'center' }}>
                    <a
                      href={order.tracking_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: '8px',
                        padding: '12px 24px', background: '#c9a84c', color: '#1e3d29',
                        fontWeight: 700, fontSize: '14px', borderRadius: '8px',
                        textDecoration: 'none', transition: 'background 150ms',
                      }}
                    >
                      Track on Shiprocket →
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
