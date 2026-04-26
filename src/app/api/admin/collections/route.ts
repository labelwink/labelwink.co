import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'

export async function GET() {
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
  } catch (err: any) {
    console.error('[GET /api/admin/collections] unexpected:', { error: err })
    return NextResponse.json({ error: err?.message ?? 'Unknown error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
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
      .insert([row])
      .select()
      .single()

    if (error) {
      console.error('[POST /api/admin/collections]', { row, error })
      return NextResponse.json({ error: error.message ?? 'Insert failed' }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (err: any) {
    console.error('[POST /api/admin/collections] unexpected:', { error: err })
    return NextResponse.json({ error: err?.message ?? 'Unknown error' }, { status: 500 })
  }
}
