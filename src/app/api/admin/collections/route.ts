import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/requireAdmin'

export const runtime = 'nodejs'

export async function GET() {
  const guard = await requireAdmin()
  if (guard instanceof NextResponse) return guard
  try {
    const supabase = createAdminSupabaseClient()
    const { data, error } = await supabase
      .from('collections')
      .select('*')
      .order('sort_order', { ascending: true })

    if (error) {
      console.error('[GET /api/admin/collections]', { error })
      return NextResponse.json({ error: error.message ?? 'Fetch failed' }, { status: 500 })
    }

    return NextResponse.json(data ?? [])
  } catch (error) {
    console.error('[admin/collections]', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const guard = await requireAdmin()
  if (guard instanceof NextResponse) return guard
  try {
    const supabase = createAdminSupabaseClient()
    const body = await req.json()

    if (!body.name || !body.slug) {
      return NextResponse.json({ error: 'name and slug are required' }, { status: 400 })
    }

    const row = {
      name:        body.name,
      slug:        body.slug,
      description: body.description || null,
      image_url:   body.image_url   || null,
      sort_order:  body.sort_order  ?? 0,
      visible:     body.visible     ?? true,
    }

    const { data, error } = await supabase
      .from('collections')
      .insert([row] as any)
      .select()
      .single()

    if (error) {
      console.error('[POST /api/admin/collections]', { row, error })
      return NextResponse.json({ error: error.message ?? 'Insert failed' }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('[admin/collections]', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
