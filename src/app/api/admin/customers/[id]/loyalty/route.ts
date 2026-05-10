import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/requireAdmin'

export const runtime = 'nodejs'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireAdmin()
  if (guard instanceof NextResponse) return guard

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createAdminSupabaseClient() as any
  const { id } = await params

  const { action, points, reason } = await req.json()

  if (!action || !['add', 'deduct'].includes(action)) {
    return NextResponse.json({ error: 'action must be "add" or "deduct"' }, { status: 400 })
  }
  if (!points || Number(points) <= 0) {
    return NextResponse.json({ error: 'points must be a positive number' }, { status: 400 })
  }
  if (!reason?.trim()) {
    return NextResponse.json({ error: 'reason is required' }, { status: 400 })
  }

  const pts = Number(points)

  // Get current balance
  const { data: current } = await supabase
    .from('loyalty_points')
    .select('id, balance')
    .eq('user_id', id)
    .maybeSingle()

  const currentBalance = current?.balance ?? 0

  if (action === 'deduct' && currentBalance < pts) {
    return NextResponse.json(
      { error: `Insufficient balance. Current: ${currentBalance}, Requested: ${pts}` },
      { status: 422 }
    )
  }

  const newBalance = action === 'add' ? currentBalance + pts : currentBalance - pts

  // UPSERT loyalty_points
  const { error: upsertErr } = await supabase
    .from('loyalty_points')
    .upsert(
      { user_id: id, balance: newBalance, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    )

  if (upsertErr) return NextResponse.json({ error: upsertErr.message }, { status: 500 })

  // Also sync wink_points on profiles
  await supabase.from('profiles').update({ wink_points: newBalance }).eq('id', id)

  // Insert transaction record
  const { error: txErr } = await supabase.from('loyalty_transactions').insert({
    user_id: id,
    type: action,
    points: action === 'add' ? pts : -pts,
    reason: reason.trim(),
    created_at: new Date().toISOString(),
  })

  if (txErr) console.error('[loyalty/POST] txn insert error:', txErr.message)

  return NextResponse.json({ new_balance: newBalance, action, points: pts })
}
