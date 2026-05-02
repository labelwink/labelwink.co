import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const product_ids = req.nextUrl.searchParams.get('product_ids')?.split(',').filter(Boolean)
    if (!product_ids || !product_ids.length) {
      return NextResponse.json({ wishlisted: [] })
    }

    const { data, error } = await supabase
      .from('wishlists')
      .select('product_id')
      .eq('user_id', user.id)
      .in('product_id', product_ids)

    if (error) throw new Error(error.message)

    const wishlisted = data.map(r => r.product_id)
    return NextResponse.json({ wishlisted })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
