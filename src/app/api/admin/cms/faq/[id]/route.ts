import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createAdminClient()
    const { question, answer, category, sort_order, is_active } = await req.json()

    const { data, error } = await supabase
      .from('faq_items')
      .update({
        question,
        answer,
        category,
        sort_order,
        is_active,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id)
      .select('*')
      .single()

    if (error) {
      console.error('[admin/cms/faq PATCH]', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (err) {
    console.error('[admin/cms/faq PATCH]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createAdminClient()

    const { error } = await supabase
      .from('faq_items')
      .delete()
      .eq('id', params.id)

    if (error) {
      console.error('[admin/cms/faq DELETE]', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[admin/cms/faq DELETE]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
