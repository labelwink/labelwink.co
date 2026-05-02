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

    // 1. Fetch pending alerts
    const { data: alerts, error: alertErr } = await sb
      .from('stock_alerts')
      .select('*, products(name, slug, images)')
      .eq('variant_id', variant_id)
      .eq('is_notified', false)

    if (alertErr) throw new Error(alertErr.message)
    if (!alerts || alerts.length === 0) {
      return NextResponse.json({ notified_count: 0 })
    }

    // 2. Process each alert
    let notified_count = 0
    for (const alert of alerts) {
      const p = Array.isArray(alert.products) ? alert.products[0] : alert.products
      if (!p) continue

      const image = p.images && p.images.length > 0 ? p.images[0] : ''
      
      await sendBackInStockEmail(alert, p.name, alert.size, image, p.slug)
      
      // Update as notified
      await sb
        .from('stock_alerts')
        .update({ is_notified: true, notified_at: new Date().toISOString() })
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
