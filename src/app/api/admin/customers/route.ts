import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/requireAdmin'

export const runtime = 'nodejs'

const PAGE_SIZE = 20

export async function GET(req: NextRequest) {
  const guard = await requireAdmin()
  if (guard instanceof NextResponse) return guard

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createAdminSupabaseClient() as any
  const sp = new URL(req.url).searchParams
  const search  = sp.get('search') || sp.get('q') || ''
  const segment = sp.get('segment') || ''
  const page    = Math.max(1, parseInt(sp.get('page') || '1', 10))
  const per_page = Math.min(100, parseInt(sp.get('per_page') || String(PAGE_SIZE), 10))

  // Raw SQL for aggregated customer data with auth.users join
  // Using Supabase's rpc or a view — fall back to profile + join approach
  let query = supabase
    .from('profiles')
    .select(
        `id, full_name, email, phone, created_at, wink_points,
         orders ( id, total_amount, status, created_at )`,
        { count: 'exact' }
    )
    .order('created_at', { ascending: false })

  // Search filter
  if (search) {
    query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`)
  }

  // Segment filter (applied client-side after fetch for now, server pre-filter where possible)
  if (segment === 'new') {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    query = query.gte('created_at', thirtyDaysAgo)
  } else if (segment === 'loyal') {
    // customers with balance > 500 — filter via loyalty_points relationship
    query = query.gt('wink_points', 500)
  }

  query = query.range((page - 1) * per_page, page * per_page - 1)

  const { data, count, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

  // Enrich with computed fields
  const customers = (data ?? []).map((c: any) => {
    const activeOrders = (c.orders ?? []).filter((o: any) => o.status !== 'cancelled')
    const orderCount   = activeOrders.length
    const lifetimeValue = activeOrders.reduce((s: number, o: any) => s + Number(o.total_amount || 0), 0)
    const lastOrderDate = activeOrders.length
      ? activeOrders.sort((a: any, b: any) => b.created_at?.localeCompare(a.created_at))[0]?.created_at
      : null
    const loyaltyBalance = c.loyalty_points?.[0]?.balance ?? c.wink_points ?? 0
    const isInactive = !lastOrderDate || lastOrderDate < ninetyDaysAgo
    const isNew = new Date(c.created_at) >= new Date(thirtyDaysAgo)
    const isHighValue = lifetimeValue > 5000

    return {
      id: c.id,
      full_name: c.full_name,
      email: c.email,
      phone: c.phone,
      created_at: c.created_at,
      admin_note: '',
      order_count: orderCount,
      lifetime_value: lifetimeValue,
      last_order_date: lastOrderDate,
      loyalty_points: loyaltyBalance,
      loyalty_tier: 'Bronze',
      is_new: isNew,
      is_high_value: isHighValue,
      is_inactive: isInactive,
      // deactivated status requires auth.users — default active here
      is_deactivated: false,
    }
  })

  // Segment post-filter
  const segmented = customers.filter((c: any) => {
    if (segment === 'high_value') return c.is_high_value
    if (segment === 'inactive')   return c.is_inactive
    return true
  })

  // Stats
  const statsAll = customers
  const stats = {
    total: count ?? 0,
    new_this_month: statsAll.filter((c: any) => c.is_new).length,
    high_value: statsAll.filter((c: any) => c.is_high_value).length,
    inactive: statsAll.filter((c: any) => c.is_inactive).length,
  }

  return NextResponse.json({
    customers: segmented,
    total: count ?? 0,
    page,
    per_page,
    total_pages: Math.ceil((count ?? 0) / per_page),
    stats,
  })
}
