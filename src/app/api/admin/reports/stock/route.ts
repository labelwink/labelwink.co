import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/requireAdmin'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'
 
type StockVariant = {
  product_name: string;
  stock_qty: number;
  low_stock_threshold: number;
  price: number;
  stock_value: number;
  status: string;
  [key: string]: any;
}

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const guard = await requireAdmin()
  if (guard) return guard

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = createAdminSupabaseClient() as any
  const sp = new URL(req.url).searchParams
  const status = sp.get('status') ?? 'all'
  const format = sp.get('format') ?? 'json'

  try {
    const { data: variantsData, error } = await sb.from('product_variants')
      .select(`
        id, size, color, sku, stock_qty, low_stock_threshold, warehouse_location,
        products!inner (
          id, name, price, is_active,
          product_sales_summary ( units_sold )
        )
      `)
      .eq('products.is_active', true)

    if (error) throw new Error(error.message)

    let total_skus = 0, out_of_stock = 0, low_stock = 0, healthy_stock = 0, total_stock_value = 0

    const allVariants: StockVariant[] = (variantsData || []).map((v: any) => {
      const p = Array.isArray(v.products) ? v.products[0] : v.products
      const pss = Array.isArray(p?.product_sales_summary) ? p?.product_sales_summary[0] : p?.product_sales_summary
      const price = Number(p?.price || 0)
      const qty = Number(v.stock_qty || 0)
      const thresh = Number(v.low_stock_threshold || 5)
      const units_sold = Number(pss?.units_sold || 0)
 
      total_skus++
      total_stock_value += (qty * price)
 
      let itemStatus = 'ok'
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
        status: itemStatus
      }
    })

    // Sort: lowest stock first, then alphabetically
    allVariants.sort((a: StockVariant, b: StockVariant) => {
      if (a.stock_qty !== b.stock_qty) return a.stock_qty - b.stock_qty
      return a.product_name.localeCompare(b.product_name)
    })
 
    const filtered = allVariants.filter((v: StockVariant) => status === 'all' || v.status === status)

    const summary = {
      total_skus, out_of_stock, low_stock, healthy_stock, total_stock_value
    }

    if (format === 'csv') {
      const headers = [
        'Product', 'Size', 'Color', 'SKU', 'Stock Qty', 'Threshold',
        'Location', 'Units Sold', 'Unit Price (₹)', 'Stock Value (₹)'
      ]
      const rows = filtered.map((v: StockVariant) => [
        `"${v.product_name}"`,
        `"${v.size}"`,
        `"${v.color}"`,
        `"${v.sku}"`,
        v.stock_qty,
        v.low_stock_threshold,
        `"${v.warehouse_location}"`,
        v.units_sold_total,
        v.price.toFixed(2),
        v.stock_value.toFixed(2)
      ].join(','))
      
      const csv = [headers.join(','), ...rows].join('\n')
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="stock-report-${new Date().toISOString().split('T')[0]}.csv"`
        }
      })
    }

    return NextResponse.json({ variants: filtered, summary })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    console.error('[reports/stock]', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
