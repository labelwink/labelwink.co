import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('faq_items')
      .select('id, question, answer, category, sort_order')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })

    if (error) {
      console.error('[storefront/faq]', error)
      return NextResponse.json({ items: [] }, { status: 500 })
    }

    return NextResponse.json({ items: data || [] }, {
      headers: { 'Cache-Control': 'public, s-maxage=300' },
    })
  } catch (err) {
    console.error('[storefront/faq]', err)
    return NextResponse.json({ items: [] }, { status: 500 })
  }
}
