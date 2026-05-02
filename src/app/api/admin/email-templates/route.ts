import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/requireAdmin'

export async function GET(req: NextRequest) {
  try {
    const guard = await requireAdmin()
    if (guard) return guard

    const supabase = createAdminSupabaseClient()
    const { data, error } = await supabase
      .from('email_templates')
      .select('*')
      .order('template_key', { ascending: true })

    if (error) {
      console.error('Error fetching email templates:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json(data)
  } catch (err: any) {
    console.error('Fatal error in GET /api/admin/email-templates:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const guard = await requireAdmin()
    if (guard) return guard

    const supabase = createAdminSupabaseClient()
    const { template_key, subject, preview_text, is_active } = await req.json()
    if (!template_key || !subject) return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })

    const { data, error } = await supabase
      .from('email_templates')
      .update({ 
        subject, 
        preview_text, 
        is_active, 
        updated_at: new Date().toISOString() 
      })
      .eq('template_key', template_key)
      .select()
      .single()

    if (error) {
      console.error('Error updating email template:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json(data)
  } catch (err: any) {
    console.error('Fatal error in PATCH /api/admin/email-templates:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

