import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  _req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('site_pages')
      .select('title, content, updated_at')
      .eq('slug', params.slug)
      .eq('is_published', true)
      .limit(1)
      .single()

    if (error && error.code === 'PGRST116') {
      // Not found
      return NextResponse.json(
        { title: '', content: '' },
        { headers: { 'Cache-Control': 'public, s-maxage=300' } }
      )
    }

    if (error) {
      console.error('[storefront/pages]', error)
      return NextResponse.json(
        { title: '', content: '' },
        { status: 500, headers: { 'Cache-Control': 'public, s-maxage=300' } }
      )
    }

    return NextResponse.json(data || { title: '', content: '' }, {
      headers: { 'Cache-Control': 'public, s-maxage=300' },
    })
  } catch (err) {
    console.error('[storefront/pages]', err)
    return NextResponse.json({ title: '', content: '' }, { status: 500 })
  }
}
