import { requireAdmin } from '@/lib/requireAdmin'
import { createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

function slugify(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

export async function GET(_req: NextRequest) {
  const guard = await requireAdmin()
  if (guard instanceof NextResponse) return guard

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ categories: data ?? [] })
}

export async function POST(req: NextRequest) {
  const guard = await requireAdmin()
  if (guard instanceof NextResponse) return guard

  try {
    const body = await req.json()
    const { name, slug, description, image_url, parent_id, sort_order, is_active } = body

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    const finalSlug = slug?.trim() || slugify(name)
    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from('categories')
      .insert([{
        name: name.trim(),
        slug: finalSlug,
        description: description ?? null,
        image_url: image_url ?? null,
        parent_id: parent_id ?? null,
        sort_order: sort_order ?? 0,
        is_active: is_active ?? true,
      }])
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
