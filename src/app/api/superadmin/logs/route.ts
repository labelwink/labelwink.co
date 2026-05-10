import { requireSuperAdmin } from '@/lib/requireSuperAdmin'
import { createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const error = await requireSuperAdmin(req)
  if (error) return error

  const { searchParams } = new URL(req.url)
  const category = searchParams.get('category') // maps to 'module' in DB
  const level    = searchParams.get('level')
  const limit    = parseInt(searchParams.get('limit') || '100')

  const supabase = createAdminClient()

  let query = supabase
    .from('system_logs')
    .select('id, level, module, message, details, created_at')

  // DB uses 'module' — the frontend sends 'category'
  if (category && category !== 'all') {
    query = query.eq('module', category)
  }

  if (level && level !== 'all') {
    query = query.eq('level', level)
  }

  const { data, error: dbError } = await query
    .order('created_at', { ascending: false })
    .limit(limit)

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 })
  }

  // Normalise to frontend shape: category = module, metadata = details, resolved = false
  const logs = (data || []).map(row => ({
    ...row,
    category: row.module ?? 'system',
    metadata: row.details ?? {},
    resolved: false,
  }))

  return NextResponse.json({ logs })
}
