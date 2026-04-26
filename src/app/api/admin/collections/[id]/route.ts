import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'
type Ctx = { params: Promise<{ id: string }> }

export async function PUT(req: NextRequest, { params }: Ctx) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createAdminSupabaseClient() as any
  const { id }   = await params
  const body     = await req.json()

  const allowed: Record<string, unknown> = {}
  if ('name'        in body) allowed.name        = body.name
  if ('slug'        in body) allowed.slug        = body.slug
  if ('description' in body) allowed.description = body.description || null
  if ('image_url'   in body) allowed.image_url   = body.image_url   || null
  if ('sort_order'  in body) allowed.sort_order  = Number(body.sort_order)
  if ('visible'     in body) allowed.visible     = body.visible

  const { data, error } = await supabase.from('collections').update(allowed).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createAdminSupabaseClient() as any
  const { id }   = await params
  const { error } = await supabase.from('collections').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
