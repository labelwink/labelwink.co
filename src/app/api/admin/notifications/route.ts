import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/requireAdmin'

// GET — fetch notifications with cursor-based pagination
// Query params:
//   cursor  — ISO 8601 timestamp; return rows created before this timestamp
//   limit   — max rows to return (default 20, max 100)
//   unread  — if 'true', filter to unread only
export async function GET(req: NextRequest) {
  const guard = await requireAdmin()
  if (guard) return guard

  const supabase = createAdminClient()
  const { searchParams } = new URL(req.url)
  const cursor = searchParams.get('cursor')            // ISO timestamp
  const limit  = Math.min(Math.max(1, Number(searchParams.get('limit') || '20')), 100)
  const unread = searchParams.get('unread')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (supabase as any)
    .from('admin_notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit + 1) // fetch one extra to determine if there's a next page

  if (cursor) {
    query = query.lt('created_at', cursor)
  }

  if (unread === 'true') {
    query = query.eq('read', false)
  }

  const { data, error } = await query
  if (error) {
    console.error('[admin/notifications] Query error:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const rows = data || []
  const hasMore = rows.length > limit
  const items = hasMore ? rows.slice(0, limit) : rows
  const nextCursor = hasMore ? items[items.length - 1]?.created_at : null

  return NextResponse.json({
    notifications: items,
    nextCursor,
    hasMore,
  })
}

// PATCH — mark one or all as read
export async function PATCH(req: NextRequest) {
  const guard = await requireAdmin()
  if (guard) return guard
  const supabase = createAdminClient()
  const body = await req.json()

  let query = supabase.from('admin_notifications').update({ read: true } as any)

  if (body.id) {
    query = query.eq('id', body.id)
  } else if (body.mark_all) {
    query = query.eq('read', false)
  } else {
    return NextResponse.json({ error: 'Provide id or mark_all' }, { status: 400 })
  }

  const { error } = await query
  if (error) {
    console.error('[admin/notifications] PATCH error:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ success: true })
}
