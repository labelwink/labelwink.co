// ─────────────────────────────────────────────────────────────────────────────
// LabelWink — Razorpay Server-Side Utilities
// NEVER import this file in client components.
// ─────────────────────────────────────────────────────────────────────────────

import crypto from 'crypto'

const RAZORPAY_KEY_ID = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET!

function getRazorpayAuth(): string {
  return Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString('base64')
}

export interface RazorpayOrderParams {
  amount: number     // in paise (rupees × 100)
  currency?: string
  receipt?: string
  notes?: Record<string, string>
}

export interface RazorpayOrder {
  id: string
  entity: string
  amount: number
  amount_paid: number
  amount_due: number
  currency: string
  receipt: string
  status: string
  created_at: number
}

/**
 * Create a Razorpay order (server-side only)
 */
export async function createRazorpayOrder(params: RazorpayOrderParams): Promise<RazorpayOrder> {
  const res = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${getRazorpayAuth()}`,
    },
    body: JSON.stringify({
      amount: Math.round(params.amount * 100),  // convert rupees to paise
      currency: params.currency ?? 'INR',
      receipt: params.receipt ?? `rcpt_${Date.now()}`,
      notes: params.notes ?? {},
    }),
  })

  if (!res.ok) {
    const error = await res.json().catch(() => ({}))
    throw new Error(`Razorpay order creation failed: ${JSON.stringify(error)}`)
  }

  return res.json() as Promise<RazorpayOrder>
}

/**
 * Verify a Razorpay payment signature (server-side only)
 * Returns true if signature is valid.
 */
export function verifyRazorpaySignature(params: {
  razorpay_order_id: string
  razorpay_payment_id: string
  razorpay_signature: string
}): boolean {
  const body = `${params.razorpay_order_id}|${params.razorpay_payment_id}`
  const expectedSignature = crypto
    .createHmac('sha256', RAZORPAY_KEY_SECRET)
    .update(body)
    .digest('hex')
  return expectedSignature === params.razorpay_signature
}

export interface RazorpayRefundParams {
  paymentId: string
  amount: number    // in rupees — will be converted to paise
  notes?: Record<string, string>
}

export interface RazorpayRefund {
  id: string
  entity: string
  amount: number
  currency: string
  payment_id: string
  status: string
  created_at: number
}

/**
 * Create a Razorpay refund (server-side only)
 */
export async function createRazorpayRefund(params: RazorpayRefundParams): Promise<RazorpayRefund> {
  const res = await fetch(`https://api.razorpay.com/v1/payments/${params.paymentId}/refund`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${getRazorpayAuth()}`,
    },
    body: JSON.stringify({
      amount: Math.round(params.amount * 100),  // convert rupees to paise
      notes: params.notes ?? {},
    }),
  })

  if (!res.ok) {
    const error = await res.json().catch(() => ({}))
    throw new Error(`Razorpay refund failed: ${JSON.stringify(error)}`)
  }

  return res.json() as Promise<RazorpayRefund>
}

/**
 * Fetch a Razorpay payment (server-side only)
 */
export async function fetchRazorpayPayment(paymentId: string): Promise<Record<string, unknown>> {
  const res = await fetch(`https://api.razorpay.com/v1/payments/${paymentId}`, {
    headers: {
      Authorization: `Basic ${getRazorpayAuth()}`,
    },
  })

  if (!res.ok) {
    throw new Error(`Failed to fetch Razorpay payment ${paymentId}`)
  }

  return res.json()
}
