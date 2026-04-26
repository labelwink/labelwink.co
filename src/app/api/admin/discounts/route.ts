import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/requireAdmin'

export const runtime = 'nodejs'

const toISO = (dateStr: string | undefined | null): string | null => {
  if (!dateStr) return null
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return new Date(`${dateStr}T23:59:59Z`).toISOString()
  if (/^\d{2}-\d{2}-\d{4}$/.test(dateStr)) {
    const [d, m, y] = dateStr.split('-')
    return new Date(`${y}-${m}-${d}T23:59:59Z`).toISOString()
  }
  return new Date(dateStr).toISOString()
}

// ── GET — list discount codes ───────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const guard = await requireAdmin()
  if (guard) return guard
  const supabase = createAdminClient()
  const { searchParams } = new URL(req.url)
  const active = searchParams.get('active')
  const page   = Number(searchParams.get('page') ?? '0')
  const limit  = 25
  const from   = page * limit
  const to     = from + limit - 1

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (supabase as any)
    .from('discount_codes')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (active === 'true')  query = query.eq('is_active', true)
  if (active === 'false') query = query.eq('is_active', false)

  const { data, count, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const totalPages = Math.ceil((count ?? 0) / limit)
  // Normalise column differences: discount_codes uses "type" values like
  // "percentage", "fixed_amount", "free_shipping"  but the UI shows them as
  // "percent" / "flat" — keep raw so the UI can adapt
  return NextResponse.json({ coupons: data ?? [], total: count ?? 0, totalPages })
}

// ── POST — create discount code ─────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const guard = await requireAdmin()
  if (guard) return guard
  const supabase = createAdminClient()
  const body = await req.json()

  // Normalise type: UI sends 'percent'/'flat', discount_codes uses 'percentage'/'fixed_amount'
  const typeMap: Record<string, string> = {
    percent:    'percentage',
    percentage: 'percentage',
    flat:       'fixed_amount',
    fixed:      'fixed_amount',
    fixed_amount: 'fixed_amount',
    free_shipping: 'free_shipping',
  }

  const row = {
    code:             (body.code as string)?.toUpperCase().trim(),
    type:             typeMap[body.type ?? 'flat'] ?? 'fixed_amount',
    value:            Number(body.value ?? 0),
    min_order_amount: body.min_order ? Number(body.min_order) : null,
    max_uses:         body.max_uses  ? Number(body.max_uses)  : null,
    starts_at:        toISO(body.starts_at) ?? new Date().toISOString(),
    expires_at:       toISO(body.expires_at),
    is_active:        body.is_active ?? true,
    used_count:       0,
    description:      body.description ?? null,
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('discount_codes')
    .insert([row])
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message, hint: error.hint }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}

// ── PATCH — update discount code ────────────────────────────────────────────────
export async function PATCH(req: NextRequest) {
  const guard = await requireAdmin()
  if (guard) return guard
  const supabase = createAdminClient()
  const { id, ...updates } = await req.json()
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const allowed: Record<string, unknown> = {}
  if ('is_active'  in updates) allowed.is_active        = updates.is_active
  if ('expires_at' in updates) allowed.expires_at       = toISO(updates.expires_at)
  if ('max_uses'   in updates) allowed.max_uses         = updates.max_uses ? Number(updates.max_uses) : null
  if ('value'      in updates) allowed.value            = Number(updates.value)
  if ('description' in updates) allowed.description     = updates.description

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('discount_codes')
    .update(allowed)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// ── DELETE — remove discount code ───────────────────────────────────────────────
export async function DELETE(req: NextRequest) {
  const guard = await requireAdmin()
  if (guard) return guard
  const supabase = createAdminClient()
  const { id } = await req.json()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from('discount_codes').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
