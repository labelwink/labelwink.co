import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'
import { sendBackInStockEmail } from '@/lib/brevo'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  // Can be called via internal fetch from the inventory route (which passes admin cookies) 
  // or via cron job. For safety, we use the admin client.
  const sb = createAdminSupabaseClient()
  
  try {
    const { variant_id } = await req.json()
    if (!variant_id) return NextResponse.json({ error: 'Missing variant_id' }, { status: 400 })

    // 1. Fetch pending alerts — use 'notified' column (actual DB column)
    const { data: alerts, error: alertErr } = await sb
      .from('stock_alerts')
      .select(`
        *,
        profiles (email, full_name),
        product_variants (
          id,
          size,
          products (
            id,
            name,
            slug,
            product_images (url, is_cover, sort_order)
          )
        )
      `)
      .eq('variant_id', variant_id)
      .eq('notified', false)

    if (alertErr) throw new Error(alertErr.message)
    if (!alerts || alerts.length === 0) {
      return NextResponse.json({ notified_count: 0 })
    }

    // 2. Process each alert
    let notified_count = 0
    for (const alert of alerts) {
      const variant = alert.product_variants
      if (!variant) continue
      
      const p = variant.products
      if (!p) continue

      const profile = alert.profiles
      const recipientEmail = alert.email || profile?.email
      if (!recipientEmail) continue

      const targetSize = alert.size || variant.size || ''

      // Get cover image from product_images join
      const images: any[] = Array.isArray(p.product_images) ? p.product_images : []
      const coverImg = images.find((i: any) => i.is_cover) || images[0]
      const image = coverImg?.url || ''
      
      await sendBackInStockEmail(
        { ...alert, email: recipientEmail },
        p.name,
        targetSize,
        image,
        p.slug
      )
      
      // Update as notified using correct column name
      await sb
        .from('stock_alerts')
        .update({ 
          notified: true, 
          is_active: false, 
          notified_at: new Date().toISOString() 
        })
        .eq('id', alert.id)
        
      notified_count++
    }

    return NextResponse.json({ notified_count })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    console.error('[notify] error:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
