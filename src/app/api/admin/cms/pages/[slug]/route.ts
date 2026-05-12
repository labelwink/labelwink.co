import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from('pages')
      .select('*')
      .eq('slug', slug)
      .limit(1)
      .single()

    if (error && error.code === 'PGRST116') {
      return NextResponse.json({ title: '', content: '' }, { status: 404 })
    }

    if (error) {
      console.error('[admin/cms/pages]', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data || { title: '', content: '' })
  } catch (err) {
    console.error('[admin/cms/pages]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const supabase = createAdminClient()
    const { title, content } = await req.json()

    const { data, error } = await supabase
      .from('pages')
      .upsert({
        slug,
        title,
        content,
        is_published: true,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'slug' })
      .select('*')
      .single()

    if (error) {
      console.error('[admin/cms/pages PATCH]', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (err) {
    console.error('[admin/cms/pages PATCH]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
