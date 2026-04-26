import { NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'
export const revalidate = 0

export async function GET() {
  try {
    const supabase = createAdminSupabaseClient()

    const [ordersRes, stockRes, reviewsRes, returnsRes] = await Promise.all([
      // Pending orders
      supabase
        .from('orders')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending'),

      // Low stock variants (stock_qty ≤ 5, stock > 0)
      supabase
        .from('product_variants')
        .select('id', { count: 'exact', head: true })
        .lte('stock_qty', 5)
        .gt('stock_qty', 0),

      // Pending reviews awaiting moderation
      supabase
        .from('reviews')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending'),

      // Pending return requests
      supabase
        .from('return_requests')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending'),
    ])

    return NextResponse.json({
      pending_orders:  ordersRes.count ?? 0,
      low_stock:       stockRes.count ?? 0,
      pending_reviews: reviewsRes.count ?? 0,
      pending_returns: returnsRes.count ?? 0,
    })
  } catch {
    return NextResponse.json({
      pending_orders: 0,
      low_stock: 0,
      pending_reviews: 0,
      pending_returns: 0,
    })
  }
}
