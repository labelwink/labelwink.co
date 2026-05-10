import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/requireAdmin'

export async function GET() {
  const guard = await requireAdmin()
  if (guard instanceof NextResponse) return guard

  const supabaseAdmin = createAdminClient()
  const { data: banners, error } = await supabaseAdmin
    .from('banners')
    .select('*')
    .order('sort_order', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(banners)
}

export async function POST(req: Request) {
  const guard = await requireAdmin()
  if (guard instanceof NextResponse) return guard

  try {
    const body = await req.json()
    // Map incoming fields to actual DB column names:
    //   cta_url  → target_url  (DB has target_url, not cta_url)
    //   subtitle → not in DB, ignored
    const {
      title,
      image_url,
      mobile_image_url,
      target_url,
      cta_url,       // legacy alias — maps to target_url
      position,
      sort_order,
      is_active,
      starts_at,     // not in DB but harmless to exclude
      ends_at,       // not in DB but harmless to exclude
    } = body

    const supabaseAdmin = createAdminClient()
    const { data: banner, error } = await supabaseAdmin
      .from('banners')
      .insert({
        title,
        image_url,
        mobile_image_url: mobile_image_url ?? null,
        target_url: target_url ?? cta_url ?? null,
        position: position ?? 'hero',
        sort_order: sort_order ?? 0,
        is_active: is_active ?? true,
      })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json(banner)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
