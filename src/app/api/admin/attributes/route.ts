import { requireAdmin } from '@/lib/requireAdmin'
import { createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const guard = await requireAdmin()
  if (guard instanceof NextResponse) return guard

  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type')

  const supabase = createAdminClient()

  if (type) {
    // Single type fetch
    const { data, error } = await supabase
      .from('product_attributes')
      .select('id, label, value, type, sort_order, is_active, created_at')
      .eq('type', type)
      .eq('is_active', true)
      .order('sort_order', { ascending: true })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ attributes: data ?? [] })
  }

  // All types — grouped
  const { data, error } = await supabase
    .from('product_attributes')
    .select('id, label, value, type, sort_order, is_active, created_at')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const grouped: Record<string, any[]> = {
    sizes: [],
    sleeve_types: [],
    fits: [],
    occasions: [],
    fabrics: [],
    patterns: [],
    customs: [],
    colors: [],
  }

  const typeMap: Record<string, string> = {
    size: 'sizes',
    sleeve_type: 'sleeve_types',
    fit: 'fits',
    occasion: 'occasions',
    fabric: 'fabrics',
    pattern: 'patterns',
    custom: 'customs',
    color: 'colors',
  }

  for (const attr of data ?? []) {
    const key = typeMap[attr.type]
    if (key) grouped[key].push(attr)
  }

  return NextResponse.json(grouped)
}

export async function POST(req: NextRequest) {
  const guard = await requireAdmin()
  if (guard instanceof NextResponse) return guard

  try {
    const body = await req.json()
    const { label, type, sort_order } = body

    if (!label?.trim() || !type?.trim()) {
      return NextResponse.json({ error: 'label and type are required' }, { status: 400 })
    }

    const value = label.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from('product_attributes')
      .insert([{
        label: label.trim(),
        type: type.trim(),
        value,
        sort_order: sort_order ?? 0,
        display_order: sort_order ?? 0,
        is_active: true,
      }])
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
