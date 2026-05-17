import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/requireAdmin'

export const runtime = 'nodejs'

type RouteContext = { params: Promise<{ id: string }> }

// ─── Allowed fields for PATCH ────────────────────────────────────────────────
const PATCHABLE_FIELDS = [
  'admin_note',
  'tracking_number',
  'shipping_carrier',
  'tracking_url',
  'shipping_method',
  'status',
]

export async function GET(_: NextRequest, { params }: RouteContext) {
  const guard = await requireAdmin()
  if (guard instanceof NextResponse) return guard

  const { id } = await params

  try {
    const supabase = createAdminSupabaseClient()

    const [orderRes, itemsRes, invoiceRes, historyRes] = await Promise.all([
      // ── Order + profile ──────────────────────────────────────────────────
      supabase
        .from('orders')
        .select('*, profiles(*)')
        .eq('id', id)
        .single(),

      // ── Order items ──────────────────────────────────────────────────────
      // FIX: removed duplicate column aliases that caused PostgREST to error
      // (selecting same column twice e.g. `price:unit_price, price_at_purchase:unit_price`
      //  and `size, variant_size:size` is not supported — silently returns null)
      supabase
        .from('order_items')
        .select(`
          id,
          order_id,
          product_id,
          variant_id,
          product_name,
          size,
          color,
          quantity,
          unit_price,
          mrp_at_purchase,
          image_url,
          slug
        `)
        .eq('order_id', id)
        .order('created_at', { ascending: true }),

      // ── Invoice (via VIEW over gst_invoices) ─────────────────────────────
      supabase
        .from('invoices')
        .select('id, invoice_number, issued_at, cgst, sgst, igst, total, subtotal, discount, shipping, customer_name')
        .eq('order_id', id)
        .maybeSingle(),

      // ── Status history ───────────────────────────────────────────────────
      supabase
        .from('order_status_history')
        .select('status, note, changed_by, created_at')
        .eq('order_id', id)
        .order('created_at', { ascending: true }),
    ])

    if (orderRes.error || !orderRes.data) {
      console.error('[GET /api/admin/orders/[id]]', orderRes.error)
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    const orderData = orderRes.data

    // ── Normalise items ──────────────────────────────────────────────────────
    // Primary source: order_items table rows (backfilled + trigger-synced)
    // Fallback: orders.items JSONB (legacy / if order_items somehow empty)
    const rawItems: any[] = itemsRes.data ?? []
    const jsonbItems: any[] = Array.isArray(orderData.items) ? orderData.items : []

    let normalisedItems: any[]

    if (rawItems.length > 0) {
      // ── From order_items table ───────────────────────────────────────────
      normalisedItems = rawItems.map((item: any) => ({
        id: item.id,
        quantity: item.quantity ?? 1,
        // Expose as both 'price' and 'price_at_purchase' so page renders either
        price: Number(item.unit_price ?? 0),
        price_at_purchase: Number(item.unit_price ?? 0),
        mrp_at_purchase: item.mrp_at_purchase ? Number(item.mrp_at_purchase) : null,
        size: item.size ?? null,
        variant_size: item.size ?? null,
        color: item.color ?? null,
        variant_color: item.color ?? null,
        product_name: item.product_name ?? '—',
        product_id: item.product_id ?? null,
        image_url: item.image_url ?? null,
        slug: item.slug ?? null,
        // products shape expected by the page renderer
        products: {
          id: item.product_id ?? '',
          name: item.product_name ?? '—',
          slug: item.slug ?? null,
        },
      }))
    } else {
      // ── Fallback: parse JSONB items stored on the order row ──────────────
      if (itemsRes.error) {
        console.warn('[GET /api/admin/orders/[id]] order_items query error:', itemsRes.error.message)
      }
      normalisedItems = jsonbItems.map((item: any) => ({
        id: item.id ?? item.productId ?? crypto.randomUUID(),
        quantity: item.quantity ?? 1,
        price: Number(item.price ?? 0),
        price_at_purchase: Number(item.price ?? 0),
        mrp_at_purchase: item.compareAtPrice ? Number(item.compareAtPrice) : null,
        size: item.size ?? null,
        variant_size: item.size ?? null,
        color: item.color ?? null,
        variant_color: item.color ?? null,
        product_name: item.name ?? item.product_name ?? '—',
        product_id: item.productId ?? item.product_id ?? null,
        image_url: item.image ?? item.image_url ?? null,
        slug: item.slug ?? null,
        products: {
          id: item.productId ?? item.product_id ?? '',
          name: item.name ?? item.product_name ?? '—',
          slug: item.slug ?? null,
        },
      }))
    }

    // ── Signed URLs for stored PDFs ──────────────────────────────────────────
    let invoiceSignedUrl: string | null = null
    let labelSignedUrl: string | null = null

    if (orderData.invoice_pdf_url) {
      const { data } = await supabase.storage
        .from('order-documents')
        .createSignedUrl(orderData.invoice_pdf_url, 3600)
      invoiceSignedUrl = data?.signedUrl ?? null
    }
    if (orderData.label_pdf_url) {
      const { data } = await supabase.storage
        .from('order-documents')
        .createSignedUrl(orderData.label_pdf_url, 3600)
      labelSignedUrl = data?.signedUrl ?? null
    }

    return NextResponse.json({
      ...orderData,
      // Expose total_amount as 'total' for the page interface
      total: Number(orderData.total_amount ?? orderData.total ?? 0),
      subtotal: Number(orderData.subtotal ?? 0),
      shipping_amount: Number(orderData.shipping_amount ?? 0),
      discount_amount: Number(orderData.discount_amount ?? 0),
      // Resolved items
      order_items: normalisedItems,
      // Invoice from gst_invoices VIEW
      invoice: invoiceRes.data ?? null,
      // Status timeline
      status_history: historyRes.data ?? [],
      // Signed PDF URLs
      invoice_signed_url: invoiceSignedUrl,
      label_signed_url: labelSignedUrl,
    })

  } catch (err: any) {
    console.error('[GET /api/admin/orders/[id]] unexpected:', { id, error: err })
    return NextResponse.json({ error: err?.message ?? 'Unknown error' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  const guard = await requireAdmin()
  if (guard instanceof NextResponse) return guard

  const { id } = await params
  const supabase = createAdminSupabaseClient()

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  // ── Build update payload from allowed fields only ────────────────────────
  // FIX: was rejecting anything except admin_note — tracking saves always 400
  const updatePayload: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  }

  let hasField = false
  for (const field of PATCHABLE_FIELDS) {
    if (field in body) {
      updatePayload[field] = body[field]
      hasField = true
    }
  }

  if (!hasField) {
    return NextResponse.json(
      { error: `No patchable fields found. Allowed: ${PATCHABLE_FIELDS.join(', ')}` },
      { status: 400 }
    )
  }

  const { error } = await supabase
    .from('orders')
    .update(updatePayload as any)
    .eq('id', id)

  if (error) {
    console.error('[PATCH /api/admin/orders/[id]]', { id, error })
    return NextResponse.json({ error: error.message ?? 'DB update failed' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}