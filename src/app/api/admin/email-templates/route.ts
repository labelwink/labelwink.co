import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/requireAdmin'

export async function GET(req: NextRequest) {
  const guard = await requireAdmin()
  if (guard) return guard

  const supabase = createAdminSupabaseClient()
  const { data, error } = await supabase.from('email_templates').select('*').order('template_key', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function PATCH(req: NextRequest) {
  const guard = await requireAdmin()
  if (guard) return guard

  const supabase = createAdminSupabaseClient()
  try {
    const { template_key, subject, preview_text, is_active } = await req.json()
    if (!template_key || !subject) return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })

    const { data, error } = await supabase
      .from('email_templates')
      .update({ subject, preview_text, is_active, updated_at: new Date().toISOString() })
      .eq('template_key', template_key)
      .select()
      .single()

    if (error) throw error
    return NextResponse.json(data)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
