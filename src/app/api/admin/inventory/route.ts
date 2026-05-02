import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/requireAdmin'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const guard = await requireAdmin()
  if (guard) return guard

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = createAdminSupabaseClient() as any
  const sp = new URL(req.url).searchParams
  const search = (sp.get('search') || '').toLowerCase()
  const status = sp.get('status') ?? 'all'
  const page = parseInt(sp.get('page') || '1', 10)
  const limit = 20

  try {
    const { data: variantsData, error } = await sb.from('product_variants')
      .select(`
        id, size, color, sku, stock_qty, low_stock_threshold, warehouse_location,
        products!inner (
          id, name, price, is_active, images,
          product_sales_summary ( units_sold )
        )
      `)
      .eq('products.is_active', true)

    if (error) throw new Error(error.message)

    let total_skus = 0, out_of_stock = 0, low_stock = 0, healthy_stock = 0, total_stock_value = 0

    const allVariants = (variantsData || []).map((v: any) => {
      const p = Array.isArray(v.products) ? v.products[0] : v.products
      const pss = Array.isArray(p?.product_sales_summary) ? p?.product_sales_summary[0] : p?.product_sales_summary
      const price = Number(p?.price || 0)
      const qty = Number(v.stock_qty || 0)
      const thresh = Number(v.low_stock_threshold || 5)
      const units_sold = Number(pss?.units_sold || 0)

      total_skus++
      total_stock_value += (qty * price)

      let itemStatus = 'healthy'
      if (qty === 0) {
        out_of_stock++
        itemStatus = 'out'
      } else if (qty <= thresh) {
        low_stock++
        itemStatus = 'low'
      } else {
        healthy_stock++
      }

      return {
        product_name: p?.name || '',
        product_id: p?.id,
        variant_id: v.id,
        size: v.size || '',
        color: v.color || '',
        sku: v.sku || '',
        stock_qty: qty,
        low_stock_threshold: thresh,
        warehouse_location: v.warehouse_location || '',
        units_sold_total: units_sold,
        price,
        stock_value: qty * price,
        status: itemStatus,
        image_url: Array.isArray(p?.images) && p.images.length > 0 ? p.images[0] : null
      }
    })

    // Filter by search & status
    const filtered = allVariants.filter(v => {
      if (status !== 'all' && v.status !== status) return false
      if (search && !v.product_name.toLowerCase().includes(search) && !v.sku.toLowerCase().includes(search)) return false
      return true
    })

    // Sort: lowest stock first
    filtered.sort((a, b) => {
      if (a.stock_qty !== b.stock_qty) return a.stock_qty - b.stock_qty
      return a.product_name.localeCompare(b.product_name)
    })

    // Paginate
    const total = filtered.length
    const offset = (page - 1) * limit
    const paginatedVariants = filtered.slice(offset, offset + limit)

    const summary = {
      total_skus, out_of_stock, low_stock, healthy_stock, total_stock_value
    }

    return NextResponse.json({ variants: paginatedVariants, total, summary })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    console.error('[inventory/get]', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
