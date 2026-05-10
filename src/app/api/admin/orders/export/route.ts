import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/requireAdmin'

export async function GET(req: NextRequest) {
  const guard = await requireAdmin()
  if (guard instanceof NextResponse) return guard

  const supabase = createAdminClient()
  const url = new URL(req.url)
  const status = url.searchParams.get('status')
  const from = url.searchParams.get('from')
  const to = url.searchParams.get('to')
  const idsParam = url.searchParams.get('ids')

  let query = supabase.from('orders').select(`
    *,
    invoices(invoice_number, cgst, sgst, igst),
    profiles(first_name, last_name, phone),
    order_items(product_name, quantity)
  `)

  if (status) query = query.eq('status', status)
  if (from) query = query.gte('created_at', from)
  if (to) query = query.lte('created_at', to)
  if (idsParam) {
    const ids = idsParam.split(',').filter(Boolean)
    if (ids.length > 0) query = query.in('id', ids)
  }

  const { data, error } = await query
  
  if (error || !data) {
    return new NextResponse('Failed to fetch orders', { status: 500 })
  }

  let csvContent = 'Invoice Number,Order ID,Date,Customer Name,Phone,City,State,Pincode,Items,Subtotal,Discount,Shipping,GST,Total,Payment ID,Status,AWB,Carrier\n'

  for (const order of data) {
    const invoiceNum = order.invoices?.[0]?.invoice_number || ''
    const date = new Date(order.created_at).toISOString().split('T')[0]
    const customer = order.customer_name || `${order.profiles?.first_name || ''} ${order.profiles?.last_name || ''}`.trim()
    const phone = order.customer_phone || order.profiles?.phone || ''
    const addr = order.shipping_address || {}
    const items = order.order_items?.map((i: any) => `${i.product_name} x${i.quantity}`).join(' | ') || ''
    
    const escapeCsv = (str: any) => {
      if (str === null || str === undefined) return '""';
      const s = String(str).replace(/"/g, '""');
      return `"${s}"`;
    }

    const cgst = order.invoices?.[0]?.cgst || 0
    const sgst = order.invoices?.[0]?.sgst || 0
    const igst = order.invoices?.[0]?.igst || 0
    const gstTotal = cgst + sgst + igst

    const row = [
      invoiceNum,
      order.id,
      date,
      customer,
      phone,
      addr.city || '',
      addr.state || '',
      addr.pincode || '',
      items,
      order.subtotal || 0,
      order.discount_amount || 0,
      order.shipping_amount || 0,
      gstTotal,
      order.total || 0,
      order.razorpay_payment_id || '',
      order.status || '',
      order.tracking_number || '',
      order.shipping_carrier || ''
    ].map(escapeCsv).join(',')

    csvContent += row + '\n'
  }

  const res = new NextResponse(csvContent)
  res.headers.set('Content-Type', 'text/csv')
  res.headers.set('Content-Disposition', `attachment; filename="orders-${new Date().toISOString().slice(0,10)}.csv"`)
  return res
}
