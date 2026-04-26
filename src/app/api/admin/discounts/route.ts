import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'

const toISO = (dateStr: string | undefined | null): string | null => {
  if (!dateStr) return null
  if (/^\d{2}-\d{2}-\d{4}$/.test(dateStr)) {
    const [d, m, y] = dateStr.split('-')
    return new Date(`${y}-${m}-${d}T23:59:59Z`).toISOString()
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return new Date(`${dateStr}T23:59:59Z`).toISOString()
  }
  return new Date(dateStr).toISOString()
}

export async function GET(req: NextRequest) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createAdminSupabaseClient() as any
  const { searchParams } = new URL(req.url)
  const active = searchParams.get('active')

  let query = supabase
    .from('coupons')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })

  if (active === 'true')  query = query.eq('is_active', true)
  if (active === 'false') query = query.eq('is_active', false)

  const { data, count, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ coupons: data ?? [], total: count ?? 0 })
}

export async function POST(req: NextRequest) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createAdminSupabaseClient() as any
  const body = await req.json()

  const typeMap: Record<string, string> = {
    'Percentage (%)': 'percentage',
    'Flat Amount (₹)': 'flat',
    percentage: 'percentage',
    percent: 'percent',
    flat: 'flat',
  }

  const row = {
    code:       (body.code as string)?.toUpperCase().trim(),
    type:       typeMap[body.type ?? body.discount_type] ?? body.type ?? body.discount_type ?? 'flat',
    value:      Number(body.value ?? body.discount_value ?? 0),
    min_order:  Number(body.min_order ?? body.min_order_amount ?? 0) || null,
    max_uses:   body.max_uses ? Number(body.max_uses) : null,
    expires_at: toISO(body.expires_at),
    is_active:  body.is_active ?? true,
    used_count: 0,
  }

  const { data, error } = await supabase.from('coupons').insert([row]).select().single()
  if (error) {
    return NextResponse.json({ error: error.message, hint: error.hint }, { status: 500 })
  }
  return NextResponse.json(data, { status: 201 })
}

export async function PATCH(req: NextRequest) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createAdminSupabaseClient() as any
  const { id, ...updates } = await req.json()
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const allowed: Record<string, unknown> = {}
  if ('is_active'  in updates) allowed.is_active  = updates.is_active
  if ('expires_at' in updates) allowed.expires_at = toISO(updates.expires_at)
  if ('max_uses'   in updates) allowed.max_uses   = updates.max_uses ? Number(updates.max_uses) : null

  const { data, error } = await supabase.from('coupons').update(allowed).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(req: NextRequest) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createAdminSupabaseClient() as any
  const { id } = await req.json()
  const { error } = await supabase.from('coupons').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
