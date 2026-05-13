import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

// GET /api/storefront/orders — fetch current user's orders
export async function GET() {
  try {
    // Use anon client ONLY for auth check (reads session cookie)
    const supabase = await createClient()
    const { data: { user }, error: authErr } = await supabase.auth.getUser()

    if (authErr) console.warn('[storefront/orders] authErr', authErr)
    if (!user) return NextResponse.json({ orders: [] }, { status: 200 })

    // Admin client bypasses RLS 403 — security enforced by .eq('user_id', user.id) below.
    // Also fetch 'items' JSONB column as fallback for orders where order_items table is empty.
    const db = createAdminClient()

    const { data, error } = await db
      .from('orders')
      .select(`
        id,
        order_number,
        invoice_number,
        status,
        payment_status,
        total_amount,
        shipping_amount,
        discount_amount,
        created_at,
        items,
        order_items (
          id,
          quantity,
          unit_price,
          size,
          color,
          sku,
          product_id,
          product_name,
          image_url,
          variant_id
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[storefront/orders] Query error:', JSON.stringify(error))
      return NextResponse.json({ orders: [], _error: error.message }, { status: 200 })
    }

    // Normalise: prefer order_items table rows; fall back to JSONB `items` column.
    // Older orders were written only to items JSONB — order_items table may be empty.
    const orders = (data ?? []).map((order: any) => {
      const tableItems: any[] = order.order_items ?? []
      const jsonbItems: any[] = order.items ?? []

      const normalisedItems = tableItems.length > 0
        ? tableItems.map((item: any) => ({
            id: item.id,
            product_name: item.product_name,
            size: item.size,
            color: item.color,
            quantity: item.quantity,
            price: item.unit_price ?? 0,
            image_url: item.image_url,
          }))
        : jsonbItems.map((item: any) => ({
            id: item.id,
            product_name: item.name,
            size: item.size,
            color: item.color,
            quantity: item.quantity ?? 1,
            price: item.price ?? 0,
            image_url: item.image ?? item.image_url ?? null,
          }))

      return {
        ...order,
        order_items: normalisedItems,
      }
    })

    return NextResponse.json({ orders }, { status: 200 })
  } catch (err) {
    console.error('[storefront/orders] Unexpected error:', err)
    return NextResponse.json({ orders: [] }, { status: 200 })
  }
}
