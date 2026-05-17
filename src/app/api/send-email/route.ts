import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

/**
 * POST /api/send-email
 *
 * Sends transactional email via Brevo API v3.
 * Used by server-side code (webhooks, admin actions).
 *
 * Body: { to, type, title, body, data? }
 */

const BREVO_API_KEY  = process.env.BREVO_API_KEY  || ''
const FROM_EMAIL     = process.env.BREVO_FROM_EMAIL || 'orders@labelwink.co'
const FROM_NAME      = process.env.BREVO_FROM_NAME  || 'Label Wink'
const SITE_URL       = process.env.NEXT_PUBLIC_SITE_URL || 'https://labelwink.co'

import {
  templateWelcomeEmail,
  templateOrderConfirmed,
  templateOrderShipped,
  templateOrderDelivered,
  templateReturnAccepted,
  templateOffersEmail,
  wrapEmailLayout
} from '@/lib/email-templates'

interface Payload { to: string; type: string; title: string; body: string; data?: any }

function buildHtml(p: Payload): string {
  const T = p.type

  if (T === 'welcome_email') {
    return templateWelcomeEmail(p.data?.customerName)
  } else if (T === 'order_confirmed') {
    return templateOrderConfirmed({
      orderId: p.data?.order_id,
      orderNumber: p.data?.order_number || p.data?.order_id?.slice(0, 8).toUpperCase(),
      totalAmount: p.data?.totalAmount || '0.00',
      items: p.data?.items || [],
      customerName: p.data?.customerName || p.to
    })
  } else if (T === 'order_shipped') {
    return templateOrderShipped({
      orderId: p.data?.order_id,
      orderNumber: p.data?.order_number || p.data?.order_id?.slice(0, 8).toUpperCase(),
      awb: p.data?.awb,
      courier: p.data?.courier,
      customerName: p.data?.customerName || p.to
    })
  } else if (T === 'order_delivered') {
    return templateOrderDelivered({
      orderId: p.data?.order_id,
      orderNumber: p.data?.order_number || p.data?.order_id?.slice(0, 8).toUpperCase(),
      customerName: p.data?.customerName || p.to
    })
  } else if (T === 'return_approved') {
    return templateReturnAccepted({
      orderId: p.data?.order_id,
      orderNumber: p.data?.order_number || p.data?.order_id?.slice(0, 8).toUpperCase(),
      customerName: p.data?.customerName || p.to
    })
  } else if (T === 'return_rejected') {
    const content = `
      <h1 style="font-size:24px;color:#1B3A2D;margin:0 0 12px;">Return Update</h1>
      <p style="color:#5a7060;line-height:1.6;">Unfortunately we could not approve your return for order #${p.data?.order_number || ''}. Please contact our support team.</p>
      <div style="text-align: center;">
        <a href="mailto:Support@labelwink.co" style="display:inline-block;background:#1B3A2D;color:#fff;padding:12px 30px;border-radius:6px;text-decoration:none;font-weight:600;font-size:14px;margin-top:20px;">Contact Support</a>
      </div>
    `
    return wrapEmailLayout(content, 'Update on your return request')
  } else if (T === 'offers_email') {
    return templateOffersEmail({
      offerTitle: p.data?.offerTitle,
      offerDescription: p.data?.offerDescription,
      couponCode: p.data?.couponCode
    })
  } else {
    const content = `
      <h1 style="font-size:22px;color:#1B3A2D;margin:0 0 12px;">${p.title}</h1>
      <p style="color:#5a7060;line-height:1.6;">${p.body}</p>
      <div style="text-align: center;">
        <a href="${process.env.NEXT_PUBLIC_SITE_URL}" style="display:inline-block;background:#1B3A2D;color:#fff;padding:12px 30px;border-radius:6px;text-decoration:none;font-weight:600;font-size:14px;margin-top:20px;">Visit Label Wink</a>
      </div>
    `
    return wrapEmailLayout(content, p.title)
  }
}

const SUBJECTS: Record<string, string> = {
  welcome_email:   'Welcome to LabelWink! 🎉',
  order_confirmed: 'Your LabelWink order is confirmed ✅',
  order_shipped:   'Your order has been shipped 📦',
  order_delivered: 'Order delivered — enjoy your pieces! ✨',
  return_approved: 'Your return request has been approved ✅',
  return_rejected: 'Update on your return request',
  back_in_stock:   "Back in stock — grab it before it's gone! 🎉",
  offers_email:    'Exclusive offer just for you! 🛍️',
}

export async function POST(req: NextRequest) {
  // ── Internal-only guard ──────────────────────────────────────────────────────
  const internalSecret = process.env.INTERNAL_SECRET
  if (!internalSecret || req.headers.get('x-internal-secret') !== internalSecret) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const payload: Payload = await req.json()

  if (!payload.to || !payload.type) {
    return NextResponse.json({ error: 'missing to/type' }, { status: 400 })
  }

  if (!BREVO_API_KEY) {
    console.warn('[send-email] BREVO_API_KEY not configured — email skipped')
    return NextResponse.json({ ok: false, reason: 'no_api_key' })
  }

  const subject = SUBJECTS[payload.type] ?? payload.title
  const html    = buildHtml(payload)

  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'accept':       'application/json',
      'content-type': 'application/json',
      'api-key':      BREVO_API_KEY,
    },
    body: JSON.stringify({
      sender:      { name: FROM_NAME, email: FROM_EMAIL },
      to:          [{ email: payload.to }],
      subject,
      htmlContent: html,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    console.error('[send-email] Brevo error:', err)
    return NextResponse.json({ ok: false, error: err }, { status: 500 })
  }

  const result = await res.json()
  return NextResponse.json({ ok: true, messageId: result.messageId })
}
