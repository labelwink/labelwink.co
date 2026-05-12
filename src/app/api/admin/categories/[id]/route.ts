import { requireAdmin } from '@/lib/requireAdmin'
import { createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

function slugify(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin()
  if (guard instanceof NextResponse) return guard

  try {
    const { id } = await params
    const body = await req.json()

    // Auto-generate slug if name changed but no slug provided
    if (body.name && !body.slug) {
      body.slug = slugify(body.name)
    }

    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('categories')
      .update({ ...body, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin()
  if (guard instanceof NextResponse) return guard

  try {
    const { id } = await params
    const supabase = createAdminClient()

    // Check if any products reference this category
    const { count } = await supabase
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('category_id', id)

    if (count && count > 0) {
      // Soft delete — deactivate
      const { error } = await supabase
        .from('categories')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('id', id)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ message: 'Category deactivated (products exist)' })
    }

    // Hard delete if no products
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ message: 'Category deleted' })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
