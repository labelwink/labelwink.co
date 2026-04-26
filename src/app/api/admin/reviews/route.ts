import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/requireAdmin'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const guard = await requireAdmin()
  if (guard) return guard
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createAdminSupabaseClient() as any
  const { searchParams } = new URL(req.url)
  const status   = searchParams.get('status')   || ''
  const page     = Math.max(0, Number(searchParams.get('page') || '0'))
  const PAGE_SIZE = 25

  let query = supabase
    .from('reviews')
    .select(
      `id, rating, title, body, status, is_verified_purchase, admin_reply, created_at, user_id,
       products ( id, name, slug ),
       profiles!reviews_user_id_profiles_fkey ( id, full_name, email )`,
      { count: 'exact' }
    )
    .order('created_at', { ascending: false })

  if (status) query = query.eq('status', status)
  query = query.range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

  const { data, count, error } = await query

  if (error) {
    console.error('[Reviews API] Supabase error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    reviews: data ?? [],
    total: count ?? 0,
    page,
    totalPages: Math.ceil((count ?? 0) / PAGE_SIZE),
  })
}
