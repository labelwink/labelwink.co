import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

// GET — fetch last 20 notifications
export async function GET() {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('admin_notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data || [])
}

// PATCH — mark one or all as read
export async function PATCH(req: NextRequest) {
  const supabase = createAdminClient()
  const body = await req.json()

  let query = supabase.from('admin_notifications').update({ read: true })

  if (body.id) {
    query = query.eq('id', body.id)
  } else if (body.mark_all) {
    query = query.eq('read', false)
  } else {
    return NextResponse.json({ error: 'Provide id or mark_all' }, { status: 400 })
  }

  const { error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
