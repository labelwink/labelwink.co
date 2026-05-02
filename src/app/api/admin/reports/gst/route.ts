import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/requireAdmin'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'
 
type GSTInvoice = {
  invoice_number: string;
  date: string;
  customer_name: string;
  customer_state: string;
  pincode: string;
  txn_id: string;
  taxable_value: number;
  cgst: number;
  sgst: number;
  igst: number;
  total_gst: number;
  invoice_total: number;
  [key: string]: any;
}

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const guard = await requireAdmin()
  if (guard) return guard

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = createAdminSupabaseClient() as any
  const sp = new URL(req.url).searchParams
  const format = sp.get('format') ?? 'json'
  
  const now = new Date()
  const month = parseInt(sp.get('month') || String(now.getMonth() + 1), 10)
  const year = parseInt(sp.get('year') || String(now.getFullYear()), 10)

  const start = new Date(year, month - 1, 1).toISOString()
  const end = new Date(year, month, 0, 23, 59, 59, 999).toISOString()

  try {
    const { data: invoicesData, error } = await sb.from('invoices')
      .select(`
        invoice_number,
        issued_at,
        subtotal,
        cgst,
        sgst,
        igst,
        total,
        orders!inner (
          customer_name,
          shipping_address,
          razorpay_payment_id,
          payment_status,
          status
        )
      `)
      .gte('issued_at', start)
      .lte('issued_at', end)
      .eq('orders.payment_status', 'paid')
      .neq('orders.status', 'cancelled')
      .order('issued_at', { ascending: true })

    if (error) throw new Error(error.message)

    let total_taxable = 0, total_cgst = 0, total_sgst = 0, total_igst = 0, exempt_count = 0

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const invoices: GSTInvoice[] = (invoicesData || []).map((row: any) => {
      const order = Array.isArray(row.orders) ? row.orders[0] : row.orders
      const cgst = Number(row.cgst || 0)
      const sgst = Number(row.sgst || 0)
      const igst = Number(row.igst || 0)
      const sub = Number(row.subtotal || 0)
      
      total_taxable += sub
      total_cgst += cgst
      total_sgst += sgst
      total_igst += igst
      if (cgst === 0 && igst === 0) exempt_count++
 
      return {
        invoice_number: row.invoice_number,
        date: row.issued_at,
        customer_name: order?.customer_name || '',
        customer_state: order?.shipping_address?.state || '',
        pincode: order?.shipping_address?.pincode || '',
        txn_id: order?.razorpay_payment_id || '',
        taxable_value: sub,
        cgst,
        sgst,
        igst,
        total_gst: cgst + sgst + igst,
        invoice_total: Number(row.total || 0)
      }
    })

    const summary = {
      total_taxable,
      total_cgst,
      total_sgst,
      total_igst,
      total_gst: total_cgst + total_sgst + total_igst,
      total_invoices: invoices.length,
      exempt_count
    }

    if (format === 'csv') {
      const headers = [
        'Invoice Number', 'Date', 'Customer Name', 'State', 'Pincode',
        'Taxable Value (₹)', 'CGST (₹)', 'SGST (₹)', 'IGST (₹)', 'Total GST (₹)', 'Invoice Total (₹)', 'TXN ID'
      ]
      const rows = invoices.map((i: GSTInvoice) => [
        `"${i.invoice_number}"`,
        `"${new Date(i.date).toLocaleDateString('en-IN')}"`,
        `"${i.customer_name}"`,
        `"${i.customer_state}"`,
        `"${i.pincode}"`,
        i.taxable_value.toFixed(2),
        i.cgst.toFixed(2),
        i.sgst.toFixed(2),
        i.igst.toFixed(2),
        i.total_gst.toFixed(2),
        i.invoice_total.toFixed(2),
        `"${i.txn_id}"`
      ].join(','))
      
      const csvContent = [headers.join(','), ...rows].join('\n')
      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="gst-report-${month}-${year}.csv"`
        }
      })
    }

    return NextResponse.json({ invoices, summary, month, year })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    console.error('[reports/gst]', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
