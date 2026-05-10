import { requireSuperAdmin } from '@/lib/requireSuperAdmin'
import { createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const error = await requireSuperAdmin(req)
  if (error) return error

  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type')

  if (!type) {
    return NextResponse.json({ error: 'Type required' }, { status: 400 })
  }

  const supabase = createAdminClient()

  const { data, error: dbError } = await supabase
    .from('product_attributes')
    .select('*')
    .eq('type', type)
    .order('display_order', { ascending: true })

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 })
  }

  return NextResponse.json({ attributes: data || [] })
}

export async function POST(req: NextRequest) {
  const error = await requireSuperAdmin(req)
  if (error) return error

  const body = await req.json()
  const { type, value, label, display_order, is_active } = body

  if (!type || !value || !label) {
    return NextResponse.json(
      { error: 'type, value, and label required' },
      { status: 400 }
    )
  }

  const supabase = createAdminClient()

  const { data, error: dbError } = await supabase
    .from('product_attributes')
    .insert([
      {
        type,
        value,
        label,
        display_order: display_order || 0,
        is_active: is_active ?? true,
      },
    ])
    .select()

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 })
  }

  return NextResponse.json(data?.[0], { status: 201 })
}
