import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/requireAdmin'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'
import { sendTelegramMessage } from '@/lib/telegram'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const guard = await requireAdmin()
  if (guard) return guard

  const sb = createAdminSupabaseClient()
  
  try {
    const { updates } = await req.json()
    
    if (!Array.isArray(updates) || updates.length > 100) {
      return NextResponse.json({ error: 'Invalid updates array or exceeds 100 items limit' }, { status: 400 })
    }

    let success_count = 0
    const failed: { variant_id: string, error: string }[] = []

    for (const update of updates) {
      const { variant_id, stock_qty, reason } = update
      if (!variant_id || typeof stock_qty !== 'number' || stock_qty < 0) {
        failed.push({ variant_id: variant_id || 'unknown', error: 'Invalid data' })
        continue
      }

      try {
        const { data: variant, error: varErr } = await sb
          .from('product_variants')
          .select('stock_qty, size, product_id, products(name)')
          .eq('id', variant_id)
          .single()

        if (varErr || !variant) throw new Error('Variant not found')

        const previous_qty = variant.stock_qty
        
        if (stock_qty !== previous_qty) {
          const { error: updErr } = await sb
            .from('product_variants')
            .update({ stock_qty })
            .eq('id', variant_id)

          if (updErr) throw new Error(updErr.message)

          const { error: logErr } = await sb
            .from('inventory_adjustments')
            .insert({
              product_id: variant.product_id,
              variant_id,
              previous_qty,
              new_qty: stock_qty,
              adjustment: stock_qty - previous_qty,
              reason: reason || 'Bulk manual adjustment',
              adjusted_by: 'admin'
            })

          if (logErr) console.error('Failed to log inventory adjustment:', logErr)

          if (previous_qty > 0 && stock_qty === 0) {
            const productName = Array.isArray(variant.products) ? variant.products[0]?.name : (variant.products as { name: string } | null)?.name
            const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://shop.hawklab.in'
            const msg = `⚠️ <b>Out of Stock Alert</b>\n📦 ${productName} (Size: ${variant.size}) is now out of stock!\n👉 <a href="${SITE_URL}/admin/inventory">Restock Now</a>`
            await sendTelegramMessage(msg)
          }
        }
        success_count++
      } catch (err: any) {
        failed.push({ variant_id, error: err.message || 'Update failed' })
      }
    }

    return NextResponse.json({ success_count, failed })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    console.error('[inventory/bulk]', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
