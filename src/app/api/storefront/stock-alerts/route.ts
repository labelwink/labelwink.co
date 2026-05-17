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
 * Creates or reactivates a stock alert for a variant (for guests or logged-in users).
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const sbAdmin = createAdminClient()

  let body: { variant_id?: string; email?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { variant_id, email } = body
  if (!variant_id) {
    return NextResponse.json({ error: 'variant_id is required' }, { status: 400 })
  }

  // Check user authentication
  const { data: { user } } = await supabase.auth.getUser()
  
  let targetEmail = email?.trim() || ''
  const targetUserId = user?.id || null

  if (user) {
    if (!targetEmail) {
      targetEmail = user.email || ''
    }
  } else {
    // If not logged in, we MUST have an email
    if (!targetEmail || !targetEmail.includes('@')) {
      return NextResponse.json({ error: 'A valid email is required to subscribe' }, { status: 400 })
    }
  }

  // Check variant exists, is actually out of stock, and retrieve product_id and size
  const { data: variant, error: varErr } = await sbAdmin
    .from('product_variants')
    .select('id, stock_qty, size, product_id')
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

  // Find if an alert already exists for this variant/user or variant/email
  let existingAlert: any = null

  if (targetUserId) {
    const { data } = await sbAdmin
      .from('stock_alerts')
      .select('*')
      .eq('user_id', targetUserId)
      .eq('variant_id', variant_id)
      .maybeSingle()
    existingAlert = data
  } else {
    const { data } = await sbAdmin
      .from('stock_alerts')
      .select('*')
      .eq('email', targetEmail)
      .eq('variant_id', variant_id)
      .maybeSingle()
    existingAlert = data
  }

  let resultData: any

  if (existingAlert) {
    // Reactivate and update details
    const { data, error } = await sbAdmin
      .from('stock_alerts')
      .update({
        is_active: true,
        notified: false,
        email: targetEmail || existingAlert.email,
        size: variant.size,
        product_id: variant.product_id,
        updated_at: new Date().toISOString()
      })
      .eq('id', existingAlert.id)
      .select()
      .single()

    if (error) {
      console.error('[stock-alerts POST update] error:', error)
      return NextResponse.json({ error: 'Failed to update subscription' }, { status: 500 })
    }
    resultData = data
  } else {
    // Insert new alert
    const { data, error } = await sbAdmin
      .from('stock_alerts')
      .insert({
        user_id: targetUserId,
        variant_id,
        email: targetEmail,
        size: variant.size,
        product_id: variant.product_id,
        is_active: true,
        notified: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('[stock-alerts POST insert] error:', error)
      return NextResponse.json({ error: 'Failed to create subscription' }, { status: 500 })
    }
    resultData = data
  }

  return NextResponse.json(resultData)
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
