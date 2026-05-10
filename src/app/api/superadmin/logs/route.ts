import { requireSuperAdmin } from '@/lib/requireSuperAdmin'
import { createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const error = await requireSuperAdmin(req)
  if (error) return error

  const { searchParams } = new URL(req.url)
  const category = searchParams.get('category')
  const level = searchParams.get('level')
  const limit = parseInt(searchParams.get('limit') || '100')

  const supabase = createAdminClient()

  let query = supabase.from('system_logs').select('*')

  if (category) {
    query = query.eq('category', category)
  }

  if (level) {
    query = query.eq('level', level)
  }

  const { data, error: dbError } = await query
    .order('created_at', { ascending: false })
    .limit(limit)

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 })
  }

  return NextResponse.json({ logs: data || [] })
}
