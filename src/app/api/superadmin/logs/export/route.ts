import { requireSuperAdmin } from '@/lib/requireSuperAdmin'
import { createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const error = await requireSuperAdmin(req)
  if (error) return error

  const { searchParams } = new URL(req.url)
  const category = searchParams.get('category')
  const level = searchParams.get('level')

  const supabase = createAdminClient()

  let query = supabase.from('system_logs').select('*')

  if (category) {
    query = query.eq('category', category)
  }

  if (level) {
    query = query.eq('level', level)
  }

  const { data, error: dbError } = await query.order('created_at', { ascending: false }).limit(500)

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 })
  }

  // Convert to CSV
  const logs = data || []
  let csv = 'ID,Level,Category,Message,Created At,Resolved\n'
  logs.forEach(log => {
    csv += `"${log.id}","${log.level}","${log.category}","${log.message.replace(/"/g, '""')}","${log.created_at}","${log.resolved}"\n`
  })

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="logs-${new Date().toISOString().split('T')[0]}.csv"`,
    },
  })
}
