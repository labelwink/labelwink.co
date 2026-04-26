import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { rateLimit, getIp } from '@/lib/utils/rate-limit'

export const runtime = 'nodejs'

// GET /api/storefront/discount?code=SAVE10&subtotal=1500
// Validates a discount code and returns the discount amount
export async function GET(req: NextRequest) {
  // Rate limit: 10 req/min per IP
  const ip = getIp(req)
  if (!rateLimit(`discount:${ip}`, 10, 60_000)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  const { searchParams } = new URL(req.url)
  // Sanitize: uppercase + strip non-alphanumeric
  const rawCode  = searchParams.get('code') ?? ''
  const code     = rawCode.toUpperCase().replace(/[^A-Z0-9]/g, '')
  const subtotal = Math.max(0, Number(searchParams.get('subtotal') || '0'))

  if (!code || code.length < 3) {
    return NextResponse.json({ error: 'Invalid coupon code' }, { status: 400 })
  }

  const supabase = createClient()
  const now = new Date().toISOString()

  const { data, error } = await supabase
    .from('discount_codes')
    .select('id, code, type, value, min_order_amount, max_uses, used_count, usage_count, is_active, starts_at, expires_at')
    .eq('code', code)
    .eq('is_active', true)
    .single()

  if (error || !data) {
    return NextResponse.json({ valid: false, error: 'Invalid coupon code' })
  }

  // Starts-at check (future coupon)
  if (data.starts_at && data.starts_at > now) {
    return NextResponse.json({ valid: false, error: 'This coupon is not yet active' })
  }

  // Expiry check
  if (data.expires_at && data.expires_at < now) {
    return NextResponse.json({ valid: false, error: 'This coupon has expired' })
  }

  // Usage limit check (support both used_count and usage_count columns)
  const usedCount = data.used_count ?? data.usage_count ?? 0
  if (data.max_uses && usedCount >= data.max_uses) {
    return NextResponse.json({ valid: false, error: 'This coupon is no longer available' })
  }

  // Minimum order check
  if (data.min_order_amount && subtotal < Number(data.min_order_amount)) {
    return NextResponse.json({
      valid: false,
      error: `Minimum order of ₹${Number(data.min_order_amount).toLocaleString('en-IN')} required`,
    })
  }

  // Calculate discount amount
  let discountAmount = 0
  if (data.type === 'percentage') {
    discountAmount = Math.round((subtotal * Number(data.value)) / 100)
  } else if (data.type === 'fixed' || data.type === 'fixed_amount') {
    discountAmount = Math.min(Number(data.value), subtotal)
  } else if (data.type === 'free_shipping') {
    discountAmount = 0 // handled at order level
  }

  return NextResponse.json({
    valid:           true,
    discount_amount: discountAmount,
    type:            data.type,
    value:           data.value,
    code:            data.code, // canonical DB value
    is_free_shipping: data.type === 'free_shipping',
  })
}
