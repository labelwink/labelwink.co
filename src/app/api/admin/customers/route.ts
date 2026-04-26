import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createAdminSupabaseClient() as any
  const { searchParams } = new URL(req.url)

  const q        = searchParams.get('q')    || ''
  const page     = Math.max(0, Number(searchParams.get('page') || '0'))
  const PAGE_SIZE = 25

  let query = supabase
    .from('profiles')
    .select(
      `id, full_name, email, phone, wink_points, loyalty_tier, created_at,
       orders ( id, total, payment_status )`,
      { count: 'exact' }
    )
    .order('created_at', { ascending: false })

  if (q) {
    query = query.or(
      `full_name.ilike.%${q}%,email.ilike.%${q}%,phone.ilike.%${q}%`
    )
  }

  query = query.range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

  const { data, count, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({
    customers: data ?? [],
    total:     count ?? 0,
    page,
    pageSize:  PAGE_SIZE,
    totalPages: Math.ceil((count ?? 0) / PAGE_SIZE),
  })
}
