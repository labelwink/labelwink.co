import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from('faq_items')
      .select('*')
      .order('sort_order', { ascending: true })

    if (error) {
      console.error('[admin/cms/faq]', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ items: data || [] })
  } catch (err) {
    console.error('[admin/cms/faq]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createAdminClient()
    const { question, answer, category, sort_order, is_active } = await req.json()

    if (!question || !answer) {
      return NextResponse.json(
        { error: 'Question and answer required' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('faq_items')
      .insert([
        {
          question,
          answer,
          category: category || 'general',
          sort_order: sort_order ?? 0,
          is_active: is_active ?? true,
        },
      ])
      .select('*')
      .single()

    if (error) {
      console.error('[admin/cms/faq POST]', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (err) {
    console.error('[admin/cms/faq POST]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
