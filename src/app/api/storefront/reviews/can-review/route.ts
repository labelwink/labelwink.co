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
    .select('id, items, order_items(product_id)')
    .eq('user_id', user.id)
    .eq('status', 'delivered')

  const hasPurchased = orders?.some(order => {
    const tableItems = order.order_items || []
    const jsonbItems = order.items || []
    
    const hasInTable = tableItems.some((item: any) => item.product_id === product_id)
    const hasInJsonb = jsonbItems.some((item: any) => (item.product_id === product_id || item.productId === product_id))
    
    return hasInTable || hasInJsonb
  })

  if (!hasPurchased) {
    return NextResponse.json({ can_review: false, reason: 'purchase_required' })
  }

  return NextResponse.json({ can_review: true })
}
