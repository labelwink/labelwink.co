import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

/**
 * GET /api/storefront/stock-alerts
 * Returns active stock alerts for the logged-in user.
 */
export async function GET() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    // Return empty array (not 401) — unauthenticated users just have no alerts
    return NextResponse.json({ alerts: [] })
  }

  const { data, error } = await supabase
    .from('stock_alerts')
    .select(`
      id, is_active, notified, created_at,
      product_variants (
        id, size, color, sku, stock_qty,
        products (
          id, name, slug,
          product_images (url, alt, is_cover)
        )
      )
    `)
    .eq('user_id', user.id)
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[stock-alerts GET] query error:', error)
    return NextResponse.json({ error: 'Failed to fetch alerts' }, { status: 500 })
  }

  return NextResponse.json({ alerts: data || [] })
}

/**
 * POST /api/storefront/stock-alerts
 * Creates or reactivates a stock alert for a variant.
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { variant_id?: string; product_id?: string; size?: string; email?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { variant_id } = body
  if (!variant_id) {
    return NextResponse.json({ error: 'variant_id is required' }, { status: 400 })
  }

  // Check variant exists and is actually out of stock
  const sbAdmin = createAdminClient()
  const { data: variant, error: varErr } = await sbAdmin
    .from('product_variants')
    .select('stock_qty')
    .eq('id', variant_id)
    .single()

  if (varErr || !variant) {
    return NextResponse.json({ error: 'Variant not found' }, { status: 404 })
  }

  if (variant.stock_qty > 0) {
    return NextResponse.json(
      { error: 'This size is currently in stock — no alert needed' },
      { status: 400 }
    )
  }

  // Upsert alert (reactivates if previously deactivated)
  const { data, error } = await supabase
    .from('stock_alerts')
    .upsert(
      { user_id: user.id, variant_id, is_active: true, notified: false },
      { onConflict: 'user_id,variant_id' }
    )
    .select()
    .single()

  if (error) {
    console.error('[stock-alerts POST]', error)
    return NextResponse.json({ error: 'Failed to create alert' }, { status: 500 })
  }

  return NextResponse.json(data)
}

/**
 * DELETE /api/storefront/stock-alerts?variant_id=xxx
 * Soft-deletes (deactivates) a stock alert.
 */
export async function DELETE(req: NextRequest) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const variant_id = req.nextUrl.searchParams.get('variant_id')
  if (!variant_id) {
    return NextResponse.json({ error: 'Missing variant_id' }, { status: 400 })
  }

  const { error } = await supabase
    .from('stock_alerts')
    .update({ is_active: false })
    .eq('user_id', user.id)
    .eq('variant_id', variant_id)

  if (error) {
    console.error('[stock-alerts DELETE]', error)
    return NextResponse.json({ error: 'Failed to remove alert' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
