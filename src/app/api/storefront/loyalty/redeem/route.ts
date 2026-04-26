import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'

/**
 * POST /api/storefront/loyalty/redeem
 * Body: { points: number }   — points to convert to a discount code (min 100)
 * Creates a single-use coupon for the exact ₹ value and deducts points.
 */
export async function POST(req: NextRequest) {
  const supabase      = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const adminSupabase = createAdminSupabaseClient() as any

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const points = Number(body.points)

  if (!points || points < 100) {
    return NextResponse.json({ error: 'Minimum 100 points required to redeem' }, { status: 400 })
  }

  // Check balance
  const { data: profile } = await supabase
    .from('profiles')
    .select('wink_points')
    .eq('id', user.id)
    .single()

  const balance = profile?.wink_points ?? 0
  if (balance < points) {
    return NextResponse.json({ error: 'Insufficient points' }, { status: 422 })
  }

  // Generate a unique coupon code
  const code = `WINK${Date.now().toString(36).toUpperCase()}`
  const discountRupees = points // 1 point = ₹1

  // Insert coupon (admin client bypasses RLS)
  const { error: couponError } = await adminSupabase
    .from('discount_codes')
    .insert({
      code,
      type:             'fixed',
      value:            discountRupees,
      minimum_order:    0,
      usage_limit:      1,
      usage_count:      0,
      is_active:        true,
      expires_at:       new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
    })

  if (couponError) {
    return NextResponse.json({ error: 'Failed to create coupon' }, { status: 500 })
  }

  // Deduct points
  const newBalance = balance - points
  await adminSupabase
    .from('profiles')
    .update({ wink_points: newBalance })
    .eq('id', user.id)

  // Log the transaction
  await adminSupabase
    .from('wink_points_history')
    .insert({
      user_id:      user.id,
      type:         'spent',
      points:       -points,
      balance_after: newBalance,
      description:  `Redeemed ${points} pts → coupon ${code}`,
    })

  return NextResponse.json({
    success: true,
    code,
    discount_rupees: discountRupees,
    new_balance:     newBalance,
  })
}
