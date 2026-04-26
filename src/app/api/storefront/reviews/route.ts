import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET ?product_id=xxx — fetch approved reviews + stats
export async function GET(req: NextRequest) {
  const supabase = createClient()
  const product_id = new URL(req.url).searchParams.get('product_id')
  if (!product_id) return NextResponse.json({ error: 'product_id required' }, { status: 400 })

  const { data, error } = await supabase
    .from('reviews')
    .select('id, rating, title, body, created_at, user_id, profiles(full_name)')
    .eq('product_id', product_id)
    .eq('status', 'approved')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const reviews = data || []
  const avgRating = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0

  const formatted = reviews.map(r => ({
    ...r,
    reviewer_name: (r.profiles as any)?.full_name || 'Verified Buyer',
  }))

  return NextResponse.json({ reviews: formatted, avgRating, reviewCount: reviews.length })
}

// POST — submit a new review (must be logged in + must have ordered the product)
export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { product_id, rating, title, review_body } = body

  if (!product_id || !rating) return NextResponse.json({ error: 'product_id and rating required' }, { status: 400 })

  // Check if user has ordered this product
  const { data: orderItems } = await supabase
    .from('order_items')
    .select('id, orders!inner(user_id)')
    .eq('product_id', product_id)

  const hasPurchased = orderItems?.some((oi: any) => oi.orders?.user_id === user.id)

  if (!hasPurchased) {
    return NextResponse.json({ error: 'You must purchase this product before reviewing it.' }, { status: 403 })
  }

  const { error } = await supabase.from('reviews').insert({
    product_id,
    user_id: user.id,
    rating: Number(rating),
    title: title || null,
    body: review_body || null,
    status: 'pending',
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Insert admin notification for new review
  await supabase.from('admin_notifications').insert({
    type: 'new_review',
    title: 'New Review Submitted',
    body: `A customer submitted a ${rating}-star review pending approval`,
    data: { product_id },
  })

  return NextResponse.json({ success: true, message: 'Review submitted for approval' })
}
