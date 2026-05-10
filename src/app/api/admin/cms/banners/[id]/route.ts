import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/requireAdmin'

const BANNER_SAFE_FIELDS = [
  'title', 'image_url', 'mobile_image_url', 'target_url',
  'position', 'sort_order', 'is_active',
] as const

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin()
  if (guard instanceof NextResponse) return guard

  try {
    const { id } = await params
    const body = await req.json()

    // Only allow safe DB columns (filter out non-existent cols like subtitle, cta_url)
    const updates: Record<string, unknown> = {}
    for (const field of BANNER_SAFE_FIELDS) {
      if (field in body) updates[field] = body[field]
    }
    // Handle legacy alias
    if ('cta_url' in body && !('target_url' in body)) {
      updates.target_url = body.cta_url
    }
    updates.updated_at = new Date().toISOString()

    const supabaseAdmin = createAdminClient()
    const { data: banner, error } = await supabaseAdmin
      .from('banners')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return NextResponse.json(banner)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin()
  if (guard instanceof NextResponse) return guard

  try {
    const { id } = await params
    const supabaseAdmin = createAdminClient()
    const { error } = await supabaseAdmin
      .from('banners')
      .delete()
      .eq('id', id)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  const guard = await requireAdmin()
  if (guard instanceof NextResponse) return guard

  try {
    const { ids } = await req.json()
    if (!Array.isArray(ids)) return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })

    const supabaseAdmin = createAdminClient()

    for (let i = 0; i < ids.length; i++) {
      await supabaseAdmin
        .from('banners')
        .update({ sort_order: i })
        .eq('id', ids[i])
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
