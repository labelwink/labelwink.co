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
  const status   = sp.get('status') || ''
  const page     = Math.max(1, Number(sp.get('page') || '1'))

  let query = supabase
    .from('reviews')
    .select(
      `id, rating, comment, status, created_at, updated_at, user_id,
       products ( id, name, slug ),
       profiles ( id, full_name, email )`,
      { count: 'exact' }
    )
    .order('created_at', { ascending: false })

  if (status && status !== 'all') query = query.eq('status', status)
  query = query.range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1)

  const { data, count, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Map: expose a 'title' field for UI compatibility (derived from comment)
  const reviews = (data ?? []).map((r: any) => ({
    ...r,
    title: r.comment?.slice(0, 50) || 'No comment',
  }))

  // Pending count for badge (cheap query)
  const { count: pendingCount } = await supabase
    .from('reviews')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'pending')

  return NextResponse.json({
    reviews,
    total: count ?? 0,
    pending_count: pendingCount ?? 0,
    page,
    per_page: PAGE_SIZE,
    total_pages: Math.ceil((count ?? 0) / PAGE_SIZE),
  })
}
