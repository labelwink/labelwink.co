import { requireSuperAdmin } from '@/lib/requireSuperAdmin'
import { createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const error = await requireSuperAdmin(req)
  if (error) return error

  const { searchParams } = new URL(req.url)
  const category = searchParams.get('category') // maps to 'module' in DB
  const level    = searchParams.get('level')

  const supabase = createAdminClient()

  let query = supabase
    .from('system_logs')
    .select('id, level, module, message, details, created_at')

  if (category && category !== 'all') {
    query = query.eq('module', category)
  }

  if (level && level !== 'all') {
    query = query.eq('level', level)
  }

  const { data, error: dbError } = await query
    .order('created_at', { ascending: false })
    .limit(500)

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 })
  }

  // Convert to CSV (use 'module' as 'Category')
  const logs = data || []
  let csv = 'ID,Level,Category,Message,Created At\n'
  logs.forEach(log => {
    const msg = (log.message || '').replace(/"/g, '""')
    csv += `"${log.id}","${log.level}","${log.module ?? 'system'}","${msg}","${log.created_at}"\n`
  })

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="logs-${new Date().toISOString().split('T')[0]}.csv"`,
    },
  })
}
