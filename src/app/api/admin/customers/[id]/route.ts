import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/requireAdmin'

export const runtime = 'nodejs'

const ALLOWED_UPDATE_FIELDS = ['full_name', 'phone', 'admin_note'] as const

// ── GET: Full customer profile ────────────────────────────────────────────────
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireAdmin()
  if (guard) return guard

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createAdminSupabaseClient() as any
  const { id } = await params

  const [
    { data: profile, error: pErr },
    { data: addresses },
    { data: loyaltyPoints },
    { data: loyaltyTxns },
    { data: orders },
    { data: reviews },
    { data: returns },
  ] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', id).single(),
    supabase.from('addresses').select('*').eq('user_id', id).order('created_at', { ascending: false }),
    supabase.from('loyalty_points').select('*').eq('user_id', id).maybeSingle(),
    supabase.from('loyalty_transactions').select('*').eq('user_id', id).order('created_at', { ascending: false }).limit(10),
    supabase.from('orders').select('id, invoice_number, total, status, payment_status, created_at, order_items(id, product_id, quantity, unit_price, product_name, size)').eq('user_id', id).order('created_at', { ascending: false }).limit(10),
    supabase.from('reviews').select('id, product_id, rating, title, status, created_at, products(name)').eq('user_id', id).order('created_at', { ascending: false }).limit(5),
    supabase.from('returns').select('id, order_id, status, created_at, reason').eq('user_id', id).order('created_at', { ascending: false }).limit(5),
  ])

  if (pErr || !profile) return NextResponse.json({ error: 'Customer not found' }, { status: 404 })

  // Try fetching auth.users info via admin API
  let authUser: { last_sign_in_at?: string; email_confirmed_at?: string; banned_until?: string } = {}
  try {
    const { data: { user } } = await supabase.auth.admin.getUserById(id)
    if (user) {
      authUser = {
        last_sign_in_at: user.last_sign_in_at,
        email_confirmed_at: user.email_confirmed_at,
        banned_until: user.banned_until,
      }
    }
  } catch { /* auth.admin not available in all environments */ }

  return NextResponse.json({
    profile: { ...profile, ...authUser },
    addresses: addresses ?? [],
    loyalty_points: loyaltyPoints ?? null,
    loyalty_transactions: loyaltyTxns ?? [],
    orders: orders ?? [],
    reviews: reviews ?? [],
    returns: returns ?? [],
  })
}

// ── PATCH: Update allowed profile fields ──────────────────────────────────────
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireAdmin()
  if (guard) return guard

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createAdminSupabaseClient() as any
  const { id } = await params
  const body = await req.json()

  // Whitelist only allowed fields
  const updates: Record<string, string> = {}
  for (const field of ALLOWED_UPDATE_FIELDS) {
    if (field in body) updates[field] = body[field]
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No updatable fields provided' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
