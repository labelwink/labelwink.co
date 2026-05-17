import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  // Auth check using anon client (reads session cookie)
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Admin client bypasses RLS — user_id filter enforces security
  const db = createAdminClient()

  // Detect if id is a UUID or an order_number like "LBWK0010"
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)

  let query = db
    .from('orders')
    .select(`
      id,
      order_number,
      invoice_number,
      status,
      payment_status,
      payment_method,
      razorpay_payment_id,
      total_amount,
      subtotal,
      shipping_amount,
      discount_amount,
      points_redeemed,
      coupon_code,
      customer_name,
      customer_email,
      customer_phone,
      shipping_name,
      shipping_phone,
      shipping_address,
      shipping_city,
      shipping_state,
      shipping_pincode,
      shiprocket_order_id,
      shiprocket_shipment_id,
      shiprocket_awb_code,
      shiprocket_courier_name,
      invoice_pdf_url,
      created_at,
      updated_at,
      items,
      order_items (
        id,
        quantity,
        unit_price,
        mrp_at_purchase,
        size,
        color,
        sku,
        product_id,
        variant_id,
        product_name,
        image_url,
        products (
          slug
        )
      )
    `)
    .eq('user_id', user.id)

  if (isUUID) {
    query = query.eq('id', id)
  } else {
    query = query.eq('order_number', id)
  }

  const { data, error } = await query.single()

  if (error) {
    console.error('[storefront/orders/[id]] query error:', JSON.stringify(error))
    if (error.code === 'PGRST116') {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Normalise order_items: prefer the order_items table rows,
  // but fall back to the JSONB `items` column if order_items is empty
  // (older orders were stored only in items JSONB, not the relational table)
  const rawItems: any[] = (data as any).order_items ?? []
  const jsonbItems: any[] = (data as any).items ?? []

  const normalisedItems = rawItems.length > 0
    ? rawItems.map((item: any) => ({
        id: item.id,
        product_name: item.product_name,
        size: item.size,
        color: item.color,
        sku: item.sku,
        quantity: item.quantity,
        unit_price: item.unit_price ?? 0,
        price: item.unit_price ?? 0,
        total_price: (item.unit_price ?? 0) * (item.quantity ?? 1),
        image_url: item.image_url,
        product_id: item.product_id,
        variant_id: item.variant_id,
        slug: item.products?.slug ?? null,
      }))
    : jsonbItems.map((item: any) => ({
        id: item.id,
        product_name: item.name,
        size: item.size,
        color: item.color,
        sku: item.sku ?? null,
        quantity: item.quantity ?? 1,
        unit_price: item.price ?? 0,
        price: item.price ?? 0,
        total_price: (item.price ?? 0) * (item.quantity ?? 1),
        image_url: item.image ?? item.image_url ?? null,
        product_id: item.productId ?? null,
        variant_id: item.variantId ?? null,
        slug: item.slug ?? null,
      }))

  let invoiceSignedUrl = null;
  if ((data as any).invoice_pdf_url) {
    const { data: signedData } = await db.storage.from('order-documents').createSignedUrl((data as any).invoice_pdf_url, 3600);
    invoiceSignedUrl = signedData?.signedUrl;
  }

  const order = {
    ...(data as any),
    order_items: normalisedItems,
    invoice_signed_url: invoiceSignedUrl
  }

  return NextResponse.json(order)
}
