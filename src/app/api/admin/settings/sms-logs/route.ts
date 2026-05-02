import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/requireAdmin'
import { createAdminClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

export async function GET() {
  const guard = await requireAdmin()
  if (guard) return guard

  const supabase = createAdminClient()
  try {
    const { data, error } = await supabase
      .from('sms_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20)

    if (error) throw new Error(error.message)
    return NextResponse.json(data)
  } catch (err: unknown) {
    return NextResponse.json({ error: 'Failed to fetch logs' }, { status: 500 })
  }
}
