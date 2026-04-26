import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'

export async function GET() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createAdminSupabaseClient() as any
  const { data, error } = await supabase
    .from('collections')
    .select('*, products:products(count)')
    .order('sort_order', { ascending: true })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(req: NextRequest) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createAdminSupabaseClient() as any
  const body = await req.json()

  const row = {
    name:        body.name,
    slug:        body.slug,
    description: body.description || null,
    image_url:   body.image_url   || null,
    sort_order:  body.sort_order  ?? 0,
    visible:     body.visible     ?? true,
  }

  const { data, error } = await supabase.from('collections').insert([row]).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
