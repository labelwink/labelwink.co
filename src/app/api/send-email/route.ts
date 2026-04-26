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

const DARK_GREEN = '#1a3a34'
const TEAL       = '#016a6e'
const CREAM      = '#faf7f2'

function btn(href: string, label: string) {
  return `<a href="${href}" style="display:inline-block;background:${DARK_GREEN};color:#fff;padding:12px 30px;border-radius:6px;text-decoration:none;font-weight:600;font-size:14px;margin-top:20px;">${label}</a>`
}

function wrap(inner: string): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;padding:40px 0;background:${CREAM};font-family:'Helvetica Neue',Arial,sans-serif;">
<div style="max-width:560px;margin:0 auto;">
  <div style="background:${DARK_GREEN};padding:24px 32px;border-radius:12px 12px 0 0;text-align:center;">
    <img src="${SITE_URL}/logo.png" alt="Label Wink" height="36" style="height:36px;width:auto;" />
  </div>
  <div style="background:#fff;padding:36px 32px;">${inner}</div>
  <div style="background:${CREAM};border:1px solid #ece8e0;border-top:0;border-radius:0 0 12px 12px;padding:20px 32px;text-align:center;">
    <p style="font-size:11px;color:#999;margin:0;">© ${new Date().getFullYear()} Label Wink · <a href="${SITE_URL}" style="color:${TEAL};">labelwink.co</a></p>
  </div>
</div></body></html>`
}

interface Payload { to: string; type: string; title: string; body: string; data?: Record<string, string> }

function buildHtml(p: Payload): string {
  const shortId   = p.data?.order_id ? p.data.order_id.slice(0, 8).toUpperCase() : ''
  const orderLink = p.data?.order_id ? `${SITE_URL}/account/orders/${p.data.order_id}` : `${SITE_URL}/account/orders`
  const awb       = p.data?.awb ?? ''

  const T = p.type
  let body = ''

  if (T === 'order_confirmed') {
    body = `<h1 style="font-size:22px;color:${DARK_GREEN};margin:0 0 12px;">Order Confirmed! 🎉</h1>
      <p style="color:#555;line-height:1.6;">Your order <strong style="color:${DARK_GREEN};">#${shortId}</strong> has been confirmed and is being prepared for dispatch.</p>
      <p style="color:#888;font-size:13px;">We'll notify you once it's shipped.</p>
      ${btn(orderLink, 'Track Order')}`
  } else if (T === 'order_shipped') {
    body = `<h1 style="font-size:22px;color:${DARK_GREEN};margin:0 0 12px;">Your Order Is On Its Way! 📦</h1>
      <p style="color:#555;line-height:1.6;">Your order <strong style="color:${DARK_GREEN};">#${shortId}</strong> has been shipped.${awb ? ` AWB: <strong>${awb}</strong>` : ''}</p>
      ${btn(orderLink, 'Track Shipment')}`
  } else if (T === 'order_delivered') {
    body = `<h1 style="font-size:22px;color:${DARK_GREEN};margin:0 0 12px;">Order Delivered! ✨</h1>
      <p style="color:#555;line-height:1.6;">Your Label Wink order <strong>#${shortId}</strong> has been delivered. We hope you love it!</p>
      <p style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:12px 16px;font-size:13px;color:#92400e;margin:16px 0 0;">🌟 Wink Points have been credited to your account!</p>
      ${btn(`${SITE_URL}/products`, 'Shop Again')}`
  } else if (T === 'return_approved') {
    body = `<h1 style="font-size:22px;color:${DARK_GREEN};margin:0 0 12px;">Return Approved ✅</h1>
      <p style="color:#555;line-height:1.6;">Your return has been approved. Store credit has been added to your account as Wink Points.</p>
      ${btn(`${SITE_URL}/account`, 'View Account')}`
  } else if (T === 'return_rejected') {
    body = `<h1 style="font-size:22px;color:${DARK_GREEN};margin:0 0 12px;">Return Update</h1>
      <p style="color:#555;line-height:1.6;">Unfortunately we could not approve your return. Please contact our support team.</p>
      ${btn('mailto:support@labelwink.co', 'Contact Support')}`
  } else if (T === 'back_in_stock') {
    const productUrl = p.data?.product_url ?? SITE_URL
    const prodName   = p.data?.product_name ?? 'The item'
    body = `<h1 style="font-size:22px;color:${DARK_GREEN};margin:0 0 12px;">Back In Stock! 🎉</h1>
      <p style="color:#555;line-height:1.6;">Good news! <strong>${prodName}</strong> is back in stock. Limited quantities — don't miss out!</p>
      ${btn(productUrl, 'Shop Now')}`
  } else {
    body = `<h1 style="font-size:22px;color:${DARK_GREEN};margin:0 0 12px;">${p.title}</h1>
      <p style="color:#555;line-height:1.6;">${p.body}</p>${btn(SITE_URL, 'Visit Label Wink')}`
  }

  return wrap(body)
}

const SUBJECTS: Record<string, string> = {
  order_confirmed: 'Your Label Wink order is confirmed ✅',
  order_shipped:   'Your order has been shipped 📦',
  order_delivered: 'Order delivered — enjoy your pieces! ✨',
  return_approved: 'Your return request has been approved',
  return_rejected: 'Update on your return request',
  back_in_stock:   "Back in stock — grab it before it's gone! 🎉",
}

export async function POST(req: NextRequest) {
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
