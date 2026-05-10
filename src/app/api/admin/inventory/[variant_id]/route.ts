import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/requireAdmin'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'
import { sendTelegramMessage } from '@/lib/telegram'

export const runtime = 'nodejs'

export async function GET(req: NextRequest, { params }: { params: Promise<{ variant_id: string }> }) {
  const guard = await requireAdmin()
  if (guard instanceof NextResponse) return guard

  const sb = createAdminSupabaseClient()
  const { variant_id } = await params
  try {
    const { data, error } = await sb
      .from('inventory_adjustments')
      .select('*')
      .eq('variant_id', variant_id)
      .order('created_at', { ascending: false })
      .limit(5)
    
    if (error) throw new Error(error.message)
    return NextResponse.json(data)
  } catch (err: unknown) {
    return NextResponse.json({ error: 'Failed to load history' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ variant_id: string }> }) {
  const guard = await requireAdmin()
  if (guard instanceof NextResponse) return guard

  const sb = createAdminSupabaseClient()
  const { variant_id: variantId } = await params
  
  try {
    const body = await req.json()

    // 1. Get current variant
    const { data: variant, error: varErr } = await sb
      .from('product_variants')
      .select('stock_qty, size, products(name)')
      .eq('id', variantId)
      .single()

    if (varErr || !variant) throw new Error(varErr?.message || 'Variant not found')

    const previous_qty = variant.stock_qty
    const updates: any = {}

    if (typeof body.stock_qty === 'number' && body.stock_qty >= 0) {
      updates.stock_qty = body.stock_qty
    }
    if (typeof body.low_stock_threshold === 'number' && body.low_stock_threshold >= 0) {
      updates.low_stock_threshold = body.low_stock_threshold
    }
    if (typeof body.warehouse_location === 'string') {
      updates.warehouse_location = body.warehouse_location
    }
    if (typeof body.sku === 'string') {
      updates.sku = body.sku
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields provided' }, { status: 400 })
    }

    // 2. Update variant
    const { data: updatedVariant, error: updErr } = await sb
      .from('product_variants')
      .update(updates)
      .eq('id', variantId)
      .select()
      .single()

    if (updErr) throw new Error(updErr.message)

    // 3. Log adjustment if stock_qty changed
    if (updates.stock_qty !== undefined && updates.stock_qty !== previous_qty) {
      const adjustment_qty = updates.stock_qty - previous_qty

      const { error: logErr } = await sb
        .from('inventory_adjustments')
        .insert({
          product_id: updatedVariant.product_id,
          variant_id: variantId,
          previous_qty,
          new_qty: updates.stock_qty,
          adjustment: adjustment_qty,
          reason: body.reason || 'Manual adjustment',
          adjusted_by: 'admin'
        })

      if (logErr) console.error('Failed to log inventory adjustment:', logErr)

      // 4. Send Telegram alert if out of stock
      if (previous_qty > 0 && updates.stock_qty === 0) {
        const productName = Array.isArray(variant.products) ? variant.products[0]?.name : (variant.products as { name: string } | null)?.name
        const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://shop.hawklab.in'
        const msg = `⚠️ <b>Out of Stock Alert</b>\n📦 ${productName} (Size: ${variant.size}) is now out of stock!\n👉 <a href="${SITE_URL}/admin/inventory">Restock Now</a>`
        await sendTelegramMessage(msg)
      }

      // 4b. Send Telegram alert if low stock
      const threshold = updatedVariant.low_stock_threshold || 5
      if (updates.stock_qty <= threshold && previous_qty > threshold) {
        const productName = Array.isArray(variant.products) ? variant.products[0]?.name : (variant.products as { name: string } | null)?.name
        const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://shop.hawklab.in'
        const msg = `⚠️ <b>Low Stock Alert</b>\n📦 ${productName} (Size: ${variant.size}) is low on stock (${updates.stock_qty} left)!\n👉 <a href="${SITE_URL}/admin/inventory">Restock Now</a>`
        await sendTelegramMessage(msg)
      }

      // 5. Send Back in Stock alerts
      if (previous_qty === 0 && updates.stock_qty > 0) {
        const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
        fetch(`${baseUrl}/api/admin/stock-alerts/notify`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'cookie': req.headers.get('cookie') || ''
          },
          body: JSON.stringify({ variant_id: variantId })
        }).catch(e => console.error('Stock alert trigger failed:', e))
      }
    }

    return NextResponse.json({ success: true, variant: updatedVariant })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    console.error('[inventory/patch]', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
