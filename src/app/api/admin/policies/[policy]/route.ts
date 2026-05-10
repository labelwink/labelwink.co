import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/requireAdmin'

const SLUG_MAP: Record<string, string> = {
  privacy:  'privacy-policy',
  returns:  'return-policy',
  shipping: 'shipping-policy',
  terms:    'terms-of-service',
}

const ALLOWED = Object.keys(SLUG_MAP)

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ policy: string }> }
) {
  try {
    const guard = await requireAdmin()
    if (guard instanceof NextResponse) return guard

    const { policy } = await params
    if (!ALLOWED.includes(policy)) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('site_pages')
      .select('title, content, updated_at')
      .eq('slug', SLUG_MAP[policy])
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      title: data?.title ?? '',
      content: data?.content ?? '',
      last_updated: data?.updated_at
        ? new Date(data.updated_at).toISOString().slice(0, 10)
        : '',
    })
  } catch (err) {
    console.error('[admin/policies GET]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ policy: string }> }
) {
  try {
    const guard = await requireAdmin()
    if (guard instanceof NextResponse) return guard

    const { policy } = await params
    if (!ALLOWED.includes(policy)) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const body = await req.json()
    const { title, content } = body

    const supabase = createAdminClient()
    const { error } = await supabase
      .from('site_pages')
      .update({
        title: title || undefined,
        content: content ?? '',
        updated_at: new Date().toISOString(),
      })
      .eq('slug', SLUG_MAP[policy])

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[admin/policies POST]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
