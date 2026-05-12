import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/requireAdmin'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  try {
    const guard = await requireAdmin()
    if (guard instanceof NextResponse) return guard

    const { searchParams } = new URL(req.url)
    const sku = searchParams.get('sku')
    const productId = searchParams.get('productId') // To ignore itself in case of edit

    if (!sku) {
      return NextResponse.json({ error: 'SKU is required' }, { status: 400 })
    }

    const supabase = createAdminSupabaseClient()
    
    let query = supabase
      .from('product_variants')
      .select('id, product_id')
      .eq('sku', sku.trim().toUpperCase())
      .maybeSingle()

    const { data, error } = await query

    if (error) {
      console.error('[check-sku]', error)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    if (data) {
      // If it exists but belongs to the same product we're editing, it's valid
      if (productId && data.product_id === productId) {
        return NextResponse.json({ available: true })
      }
      return NextResponse.json({ available: false, message: 'SKU already in use' })
    }

    return NextResponse.json({ available: true })
  } catch (error) {
    console.error('[check-sku]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
