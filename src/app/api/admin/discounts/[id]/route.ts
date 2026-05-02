import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/requireAdmin'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin()
  if (guard) return guard

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = createAdminSupabaseClient() as any
  const { id } = await params

  try {
    const { data: discount, error } = await sb.from('discount_codes')
      .select(`
        *,
        discount_code_uses (
          id, used_at,
          orders ( id, total, discount_amount, customer_name, customer_email, created_at, order_number )
        )
      `)
      .eq('id', id)
      .single()

    if (error) throw new Error(error.message)
    if (!discount) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    let total_discount_given = 0
    let total_order_value = 0
    
    // Format uses
    const uses = (Array.isArray(discount.discount_code_uses) ? discount.discount_code_uses : []).map((use: any) => {
      const order = Array.isArray(use.orders) ? use.orders[0] : use.orders
      if (order) {
        total_discount_given += Number(order.discount_amount || 0)
        total_order_value += Number(order.total || 0)
      }
      return {
        id: use.id,
        used_at: use.used_at,
        order_id: order?.id,
        order_number: order?.order_number,
        customer_name: order?.customer_name,
        customer_email: order?.customer_email,
        cart_total: order?.total,
        discount_applied: order?.discount_amount
      }
    })

    // Sort recent uses first
    uses.sort((a: any, b: any) => new Date(b.used_at).getTime() - new Date(a.used_at).getTime())

    const avg_cart_size = uses.length > 0 ? total_order_value / uses.length : 0

    return NextResponse.json({
      ...discount,
      uses: uses.slice(0, 10), // return top 10 recent
      stats: {
        total_uses: uses.length,
        total_discount_given,
        avg_cart_size
      }
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin()
  if (guard) return guard

  const sb = createAdminSupabaseClient()
  const { id } = await params
  
  try {
    const body = await req.json()
    const allowedFields = ['is_active', 'description', 'min_order_amount', 'max_uses', 'starts_at', 'expires_at']
    const updates: any = {}
    
    for (const key of allowedFields) {
      if (body[key] !== undefined) updates[key] = body[key]
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields provided' }, { status: 400 })
    }

    const { data, error } = await sb.from('discount_codes').update(updates).eq('id', id).select().single()
    if (error) throw new Error(error.message)

    return NextResponse.json(data)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin()
  if (guard) return guard

  const sb = createAdminSupabaseClient()
  const { id } = await params
  
  try {
    const { data: discount, error: fetchErr } = await sb.from('discount_codes').select('used_count').eq('id', id).single()
    if (fetchErr || !discount) throw new Error('Discount not found')

    if (discount.used_count > 0) {
      return NextResponse.json({ error: 'Cannot delete used coupon — deactivate instead' }, { status: 400 })
    }

    const { error } = await sb.from('discount_codes').delete().eq('id', id)
    if (error) throw new Error(error.message)

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
