import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

// GET /api/storefront/discount?code=SAVE10&subtotal=1500
// Validates a discount code and returns the discount amount
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code     = searchParams.get('code')?.toUpperCase()
  const subtotal = Number(searchParams.get('subtotal') || '0')

  if (!code) return NextResponse.json({ error: 'code is required' }, { status: 400 })

  const supabase = createClient()
  const now = new Date().toISOString()

  const { data, error } = await supabase
    .from('discount_codes')
    .select('id, code, type, value, min_order_amount, max_uses, used_count, is_active, starts_at, expires_at')
    .eq('code', code)
    .eq('is_active', true)
    .single()

  if (error || !data) {
    return NextResponse.json({ valid: false, error: 'Invalid or expired coupon code' })
  }

  // Starts-at check (future coupon)
  if (data.starts_at && data.starts_at > now) {
    return NextResponse.json({ valid: false, error: 'This coupon is not yet active' })
  }

  // Expiry check
  if (data.expires_at && data.expires_at < now) {
    return NextResponse.json({ valid: false, error: 'This coupon has expired' })
  }

  // Usage limit check
  if (data.max_uses && data.used_count >= data.max_uses) {
    return NextResponse.json({ valid: false, error: 'This coupon has reached its usage limit' })
  }

  // Minimum order check
  if (data.min_order_amount && subtotal < data.min_order_amount) {
    return NextResponse.json({
      valid: false,
      error: `Minimum order of ₹${Number(data.min_order_amount).toLocaleString('en-IN')} required`,
    })
  }

  // Calculate discount amount
  let discountAmount = 0
  if (data.type === 'percentage') {
    discountAmount = Math.round((subtotal * data.value) / 100)
  } else if (data.type === 'fixed') {
    discountAmount = Math.min(data.value, subtotal) // can't discount more than subtotal
  }

  return NextResponse.json({
    valid: true,
    discount_amount: discountAmount,
    type: data.type,
    value: data.value,
    code: data.code,
  })
}
