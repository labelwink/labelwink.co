import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

// GET ?product_id=xxx&page=1&per_page=5&rating= — fetch approved reviews + stats
export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const sp = new URL(req.url).searchParams
  const product_id = sp.get('product_id')
  const page = Math.max(parseInt(sp.get('page') ?? '1', 10), 1)
  const per_page = Math.min(parseInt(sp.get('per_page') ?? '5', 10), 20)
  const rating_filter = sp.get('rating')

  if (!product_id) return NextResponse.json({ error: 'product_id required' }, { status: 400 })

  let query = supabase
    .from('reviews')
    .select('id, rating, review_text, photos, is_verified_purchase, admin_reply, admin_replied_at, helpful_count, created_at, profiles(id, full_name, avatar_url)')
    .eq('product_id', product_id)
    .eq('status', 'approved')

  if (rating_filter) query = query.eq('rating', parseInt(rating_filter, 10))

  const [{ data, error }, { data: allRatings }] = await Promise.all([
    query
      .order('helpful_count', { ascending: false })
      .order('created_at', { ascending: false })
      .range((page - 1) * per_page, page * per_page - 1),
    supabase.from('reviews').select('rating').eq('product_id', product_id).eq('status', 'approved'),
  ])

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const ratings = (allRatings ?? []).map(r => r.rating)
  const total = ratings.length
  const avg_rating = total ? Math.round((ratings.reduce((s, r) => s + r, 0) / total) * 10) / 10 : 0
  const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } as Record<number, number>
  ratings.forEach(r => { if (r >= 1 && r <= 5) distribution[r]++ })

  // Map to frontend-expected fields (title, body) from review_text
  const reviews = (data ?? []).map((r: any) => {
    let t = 'Review'
    let b = r.review_text || ''
    if (r.review_text && r.review_text.includes(' - ')) {
      const parts = r.review_text.split(' - ')
      t = parts[0]
      b = parts.slice(1).join(' - ')
    } else if (r.review_text) {
      t = r.review_text.slice(0, 50)
    }
    return {
      ...r,
      comment: r.review_text,
      title: t,
      body: b,
    }
  })

  return NextResponse.json({
    reviews,
    total, avg_rating, distribution,
    page, per_page, total_pages: Math.ceil(total / per_page),
  })
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
  // Since the relational order_items table is empty, we must query the orders table and check the JSONB items column fallback.
  let isVerified = false
  const adminDb = createAdminClient()
  if (order_id) {
    const { data: orderCheck } = await adminDb
      .from('orders')
      .select('id, items, order_items(product_id)')
      .eq('id', order_id)
      .eq('user_id', user.id)
      .maybeSingle()
      
    if (orderCheck) {
      const tableItems = orderCheck.order_items || []
      const jsonbItems = orderCheck.items || []
      
      const hasInTable = tableItems.some((item: any) => item.product_id === product_id)
      const hasInJsonb = jsonbItems.some((item: any) => (item.product_id === product_id || item.productId === product_id))
      isVerified = hasInTable || hasInJsonb
    }
  } else {
    const { data: orders } = await adminDb
      .from('orders')
      .select('id, items, order_items(product_id)')
      .eq('user_id', user.id)
      
    isVerified = orders?.some(order => {
      const tableItems = order.order_items || []
      const jsonbItems = order.items || []
      
      const hasInTable = tableItems.some((item: any) => item.product_id === product_id)
      const hasInJsonb = jsonbItems.some((item: any) => (item.product_id === product_id || item.productId === product_id))
      return hasInTable || hasInJsonb
    }) ?? false
  }

  if (!isVerified) {
    return NextResponse.json({ error: 'You must purchase this product to review.' }, { status: 403 });
  }

  const fullComment = title ? `${title} - ${body}` : body

  const { error } = await supabase.from('reviews').insert({
    product_id,
    user_id: user.id,
    rating: Number(rating),
    review_text: fullComment,
    status: 'pending',
    is_verified_purchase: isVerified,
  } as any)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Admin notification (non-fatal)
  try {
    await adminDb.from('admin_notifications').insert({
      type: 'new_review',
      title: 'New Review Submitted',
      message: `A customer submitted a ${rating}-star review pending approval`,
      metadata: { product_id },
    } as any)
  } catch (notifErr) {
    console.error('Failed to insert admin notification:', notifErr)
  }

  return NextResponse.json({ success: true, message: 'Review submitted for approval' })
}
