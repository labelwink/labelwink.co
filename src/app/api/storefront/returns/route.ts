import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

// GET — fetch current user's return requests
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('return_requests')
    .select(`
      id, reason, status, admin_note, refund_amount, created_at,
      orders ( id, total, created_at )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data || [])
}

// POST — submit a new return request
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { order_id, reason, description } = body

  if (!order_id || !reason) {
    return NextResponse.json({ error: 'order_id and reason are required' }, { status: 400 })
  }

  // Verify the order belongs to the user and is delivered
  const { data: order } = await supabase
    .from('orders')
    .select('id, status, user_id')
    .eq('id', order_id)
    .eq('user_id', user.id)
    .single()

  if (!order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  }
  if (order.status !== 'delivered') {
    return NextResponse.json({ error: 'Only delivered orders can be returned' }, { status: 422 })
  }

  // Check if return already exists for this order
  const { data: existing } = await supabase
    .from('return_requests')
    .select('id')
    .eq('order_id', order_id)
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ error: 'A return request already exists for this order' }, { status: 409 })
  }

  const { data: returnReq, error } = await supabase
    .from('return_requests')
    .insert({
      order_id,
      user_id: user.id,
      reason,
      description: description || null,
      status: 'pending',
    } as any)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Admin notification (non-fatal)
  try {
    await supabase.from('admin_notifications').insert({
      type: 'return_request',
      title: 'New Return Request',
      body: `A customer has requested a return for order #${order_id.slice(0, 8).toUpperCase()}`,
      data: { order_id, return_id: returnReq.id },
    } as any)
  } catch { /* ignore */ }

  return NextResponse.json({ success: true, return_request: returnReq }, { status: 201 })
}
