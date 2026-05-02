import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const product_id = new URL(req.url).searchParams.get('product_id')
  if (!product_id) return NextResponse.json({ can_review: false, reason: 'missing_product_id' })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ can_review: false, reason: 'login_required' })

  // Check existing review
  const { data: existing } = await supabase
    .from('reviews')
    .select('id')
    .eq('product_id', product_id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (existing) return NextResponse.json({ can_review: false, reason: 'already_reviewed' })

  // Check purchased + delivered
  const { data: orders } = await supabase
    .from('orders')
    .select('id, order_items!inner(product_id)')
    .eq('user_id', user.id)
    .eq('status', 'delivered')
    .eq('order_items.product_id', product_id)
    .limit(1)

  if (!orders || orders.length === 0) {
    return NextResponse.json({ can_review: false, reason: 'purchase_required' })
  }

  return NextResponse.json({ can_review: true })
}
