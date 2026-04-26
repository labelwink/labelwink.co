import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

// GET ?product_id=xxx — fetch approved reviews + stats
export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const product_id = new URL(req.url).searchParams.get('product_id')
  if (!product_id) return NextResponse.json({ error: 'product_id required' }, { status: 400 })

  const { data, error } = await supabase
    .from('reviews')
    .select('id, rating, title, body, is_verified_purchase, admin_reply, created_at, profiles(full_name)')
    .eq('product_id', product_id)
    .eq('status', 'approved')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const reviews = data || []
  const avgRating = reviews.length
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    : 0

  const formatted = reviews.map(r => ({
    ...r,
    reviewer_name: (r.profiles as { full_name?: string } | null)?.full_name || 'Verified Buyer',
  }))

  return NextResponse.json({ reviews: formatted, avgRating, reviewCount: reviews.length })
}

// POST — submit a new review (must be logged in + must have ordered the product)
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const payload = await req.json()
  // Accept both `body` and legacy `review_body` field names
  const { product_id, order_id, rating, title } = payload
  const body = payload.body || payload.review_body

  if (!product_id || !rating || !body) {
    return NextResponse.json({ error: 'product_id, rating, and body are required' }, { status: 400 })
  }

  // Prevent duplicate reviews for same product
  const { data: existing } = await supabase
    .from('reviews')
    .select('id')
    .eq('product_id', product_id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ error: 'You have already reviewed this product.' }, { status: 409 })
  }

  // Check if user has purchased this product (for verified badge)
  // If order_id is provided, use it directly; otherwise query all orders
  let isVerified = false
  if (order_id) {
    const { data: orderCheck } = await supabase
      .from('orders')
      .select('id, order_items!inner(products!inner(id))')
      .eq('id', order_id)
      .eq('user_id', user.id)
      .eq('order_items.products.id', product_id)
      .maybeSingle()
    isVerified = !!orderCheck
  } else {
    const { data: orderItems } = await supabase
      .from('order_items')
      .select('id, orders!inner(user_id)')
      .eq('product_id', product_id)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    isVerified = orderItems?.some((oi: any) => oi.orders?.user_id === user.id) ?? false
  }

  const { error } = await supabase.from('reviews').insert({
    product_id,
    user_id: user.id,
    rating: Number(rating),
    title: title || null,
    body,
    status: 'pending',
    is_verified_purchase: isVerified,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Admin notification (non-fatal)
  try {
    await supabase.from('admin_notifications').insert({
      type: 'new_review',
      title: 'New Review Submitted',
      body: `A customer submitted a ${rating}-star review pending approval`,
      data: { product_id },
    })
  } catch { /* ignore */ }

  return NextResponse.json({ success: true, message: 'Review submitted for approval' })
}
