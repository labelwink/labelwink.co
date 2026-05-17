import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/requireAdmin'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'
import { sendTelegramMessage } from '@/lib/telegram'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const guard = await requireAdmin()
  if (guard instanceof NextResponse) return guard

  const sb = createAdminSupabaseClient()
  
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No CSV file uploaded' }, { status: 400 })
    }

    const text = await file.text()
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0)
    
    if (lines.length < 2) {
      return NextResponse.json({ error: 'CSV file is empty or missing headers' }, { status: 400 })
    }

    const headers = lines[0].toLowerCase().split(',').map(h => h.replace(/['"]/g, '').trim())
    const skuIndex = headers.indexOf('sku')
    const qtyIndex = headers.indexOf('stock_qty')
    const reasonIndex = headers.indexOf('reason')

    if (skuIndex === -1 || qtyIndex === -1) {
      return NextResponse.json({ error: 'CSV must contain "sku" and "stock_qty" columns' }, { status: 400 })
    }

    let success_count = 0
    const failed: { sku: string, error: string }[] = []

    for (let i = 1; i < lines.length; i++) {
      // Basic CSV split, ignores commas inside quotes (assuming no complex quoting for now)
      const values = lines[i].split(',').map(v => v.replace(/['"]/g, '').trim())
      const sku = values[skuIndex]
      const stock_qty = parseInt(values[qtyIndex], 10)
      const reason = reasonIndex !== -1 ? values[reasonIndex] : 'CSV Import'

      if (!sku || isNaN(stock_qty) || stock_qty < 0) {
        failed.push({ sku: sku || `Row ${i+1}`, error: 'Invalid SKU or quantity' })
        continue
      }

      try {
        const { data: variant, error: varErr } = await sb
          .from('product_variants')
          .select('id, stock_qty, size, product_id, low_stock_threshold, products(name)')
          .eq('sku', sku)
          .single()

        if (varErr || !variant) throw new Error('SKU not found')

        const previous_qty = variant.stock_qty
        
        if (stock_qty !== previous_qty) {
          const { error: updErr } = await sb
            .from('product_variants')
            .update({ stock_qty })
            .eq('id', variant.id)

          if (updErr) throw new Error(updErr.message)

          const { error: logErr } = await sb
            .from('inventory_adjustments')
            .insert({
              product_id: variant.product_id,
              variant_id: variant.id,
              previous_qty,
              new_qty: stock_qty,
              adjustment: stock_qty - previous_qty,
              reason: reason || 'CSV Import',
              adjusted_by: 'admin'
            })

          if (logErr) console.error('Failed to log inventory adjustment:', logErr)

          const threshold = variant.low_stock_threshold || 5
          const productName = Array.isArray(variant.products) ? variant.products[0]?.name : (variant.products as { name: string } | null)?.name
          const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://shop.hawklab.in'

          if (previous_qty > 0 && stock_qty === 0) {
            const msg = `⚠️ <b>Out of Stock Alert</b>\n📦 ${productName} (Size: ${variant.size}) is now out of stock!\n👉 <a href="${SITE_URL}/admin/inventory">Restock Now</a>`
            await sendTelegramMessage(msg)

            try {
              await sb.from('admin_notifications').insert({
                type: 'out_of_stock',
                title: 'Out of Stock Alert',
                message: `Variant ${variant.size || ''} of product "${productName}" is now out of stock!`,
                metadata: { variant_id: variant.id, product_id: variant.product_id }
              })
            } catch (e) { console.error('Import out of stock notif failed:', e) }
          }
          else if (stock_qty <= threshold && previous_qty > threshold) {
            const msg = `⚠️ <b>Low Stock Alert</b>\n📦 ${productName} (Size: ${variant.size}) is low on stock (${stock_qty} left)!\n👉 <a href="${SITE_URL}/admin/inventory">Restock Now</a>`
            await sendTelegramMessage(msg)

            try {
              await sb.from('admin_notifications').insert({
                type: 'low_stock',
                title: 'Low Stock Alert',
                message: `Variant ${variant.size || ''} of product "${productName}" is low on stock (${stock_qty} left).`,
                metadata: { variant_id: variant.id, product_id: variant.product_id, current_stock: stock_qty }
              })
            } catch (e) { console.error('Import low stock notif failed:', e) }
          }
        }
        success_count++
      } catch (err: any) {
        failed.push({ sku, error: err.message || 'Update failed' })
      }
    }

    return NextResponse.json({ success_count, failed })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    console.error('[inventory/import]', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
