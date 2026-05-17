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
  // AdminPayload is a plain object (truthy) — must check instanceof, not truthiness
  if (guard instanceof NextResponse) return guard

  const supabase = createAdminClient()
  const { searchParams } = new URL(req.url)
  const cursor = searchParams.get('cursor')            // ISO timestamp
  const limit  = Math.min(Math.max(1, Number(searchParams.get('limit') || '20')), 100)
  const unread = searchParams.get('unread')

  try {
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
      query = query.eq('is_read', false)
    }

    const { data, error } = await query
    if (error) {
      console.error('[admin/notifications] Query error:', error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const rows = data || []
    const hasMore = rows.length > limit
    const itemsRaw = hasMore ? rows.slice(0, limit) : rows

    // Map database columns to fields the frontend expects (is_read, data, body)
    const items = itemsRaw.map((n: any) => ({
      ...n,
      is_read: !!n.is_read,
      data: n.metadata || null,
      body: n.body || n.message || '',
    }))

    const nextCursor = hasMore ? items[items.length - 1]?.created_at : null

    return NextResponse.json({
      notifications: items,
      nextCursor,
      hasMore,
    })
  } catch (err) {
    console.error('[admin/notifications] Unexpected error:', err)
    return NextResponse.json({ notifications: [], nextCursor: null, hasMore: false })
  }
}

// PATCH — mark one or all as read
export async function PATCH(req: NextRequest) {
  const guard = await requireAdmin()
  if (guard instanceof NextResponse) return guard

  const supabase = createAdminClient()
  const body = await req.json()

  let query = supabase.from('admin_notifications').update({ is_read: true } as any)

  if (body.id) {
    query = query.eq('id', body.id)
  } else if (body.mark_all) {
    query = query.eq('is_read', false)
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

// DELETE — clear read or clear all notifications
export async function DELETE(req: NextRequest) {
  const guard = await requireAdmin()
  if (guard instanceof NextResponse) return guard

  const supabase = createAdminClient()
  const { searchParams } = new URL(req.url)
  const mode = searchParams.get('mode') // 'read' or 'all'

  if (mode !== 'read' && mode !== 'all') {
    return NextResponse.json({ error: 'Provide mode=read or mode=all' }, { status: 400 })
  }

  let query = supabase.from('admin_notifications').delete()
  if (mode === 'read') {
    query = query.eq('is_read', true)
  } else {
    // Mode is all, delete all (using a dummy check that is always true, since supabase .delete() requires a filter unless it's a specific pattern, but eq('is_read', true/false) or eq(1,1) is safer)
    // Actually, .neq('id', '00000000-0000-0000-0000-000000000000') matches all valid UUID ids
    query = query.neq('id', '00000000-0000-0000-0000-000000000000')
  }

  const { error } = await query
  if (error) {
    console.error('[admin/notifications] DELETE error:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
