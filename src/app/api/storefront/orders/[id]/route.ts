import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('orders')
    .select(`
      id, status, total, subtotal,
      shipping_amount, shipping_fee, discount_amount,
      customer_name, customer_email, customer_phone,
      payment_status, payment_method, razorpay_payment_id,
      shipping_carrier, tracking_number, tracking_url,
      shipping_address, shipping_method, coupon_code,
      created_at,
      order_items (
        id, quantity,
        price_at_purchase,
        variant_size, variant_color,
        product_name,
        size, color,
        products ( id, name, slug )
      )
    `)
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
