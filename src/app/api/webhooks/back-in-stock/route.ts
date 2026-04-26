import { NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'

/**
 * POST /api/webhooks/back-in-stock
 * Internal or n8n webhook trigger to send back-in-stock emails
 * to users who wishlisted a product.
 *
 * Headers: x-webhook-secret = process.env.WEBHOOK_SECRET
 * Body: { product_id, product_name, product_url? }
 */
export async function POST(req: Request) {
  // Authenticate webhook
  const secret = req.headers instanceof Headers
    ? req.headers.get('x-webhook-secret')
    : (req.headers as Record<string, string>)['x-webhook-secret']

  if (!secret || secret !== process.env.WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { product_id: string; product_name: string; product_url?: string }
  try {
    body = await (req as Request).json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { product_id, product_name, product_url } = body
  if (!product_id || !product_name) {
    return NextResponse.json({ error: 'product_id and product_name required' }, { status: 400 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createAdminSupabaseClient() as any
  const siteUrl  = process.env.NEXT_PUBLIC_SITE_URL || 'https://labelwink.co'
  const shopUrl  = product_url || `${siteUrl}/products/${product_id}`

  // Find distinct users who wishlisted this product
  const { data: wishlistRows } = await supabase
    .from('wishlists')
    .select('user_id')
    .eq('product_id', product_id)

  if (!wishlistRows || wishlistRows.length === 0) {
    return NextResponse.json({ sent: 0, message: 'No wishlist users for this product' })
  }

  const userIds: string[] = [...new Set<string>(wishlistRows.map((r: { user_id: string }) => r.user_id))]

  // Fetch emails in batches of 50
  let sent = 0
  const BATCH = 50

  for (let i = 0; i < userIds.length; i += BATCH) {
    const batch = userIds.slice(i, i + BATCH)
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, email, full_name')
      .in('id', batch)

    for (const profile of (profiles ?? [])) {
      if (!profile.email) continue
      try {
        await fetch(`${siteUrl}/api/send-email`, {
          method:  'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-internal-secret': process.env.INTERNAL_SECRET ?? '',
          },
          body: JSON.stringify({
            to:    profile.email,
            type:  'back_in_stock',
            title: `${product_name} is back in stock!`,
            body:  `Hi ${profile.full_name || 'there'}, "${product_name}" is back in stock. Grab it before it sells out again!`,
            data:  { product_url: shopUrl, product_name },
          }),
        })
        sent++
      } catch { /* non-fatal */ }
    }
  }

  return NextResponse.json({ sent, total_wishlisted: userIds.length })
}
