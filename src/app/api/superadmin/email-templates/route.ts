import { requireSuperAdmin } from '@/lib/requireSuperAdmin'
import { createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const error = await requireSuperAdmin(req)
  if (error) return error

  const supabase = createAdminClient()

  const { data, error: dbError } = await supabase
    .from('email_templates')
    .select('*')
    .order('type', { ascending: true })

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 })
  }

  return NextResponse.json({ templates: data || [] })
}
