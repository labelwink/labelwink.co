import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'

export async function GET() {
  const supabase = await createClient()
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data, error } = await supabase
      .from('stock_alerts')
      .select('*, products(name), product_variants(size)')
      .eq('user_id', user.id)
      .eq('is_notified', false)

    if (error) throw new Error(error.message)

    return NextResponse.json(data)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const sbAdmin = createAdminSupabaseClient()
  
  try {
    const body = await req.json()
    const { product_id, variant_id, size, email } = body
    if (!product_id || !variant_id || !size) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const { data: { user } } = await supabase.auth.getUser()
    let alertEmail = email

    if (user) {
      const { data: profile } = await supabase.from('profiles').select('email').eq('id', user.id).single()
      if (profile?.email) alertEmail = profile.email
    }

    if (!alertEmail) {
      return NextResponse.json({ error: 'Email is required for guests' }, { status: 400 })
    }

    // Check if product and variant exist
    const { data: variant, error: varErr } = await sbAdmin
      .from('product_variants')
      .select('stock_qty')
      .eq('id', variant_id)
      .single()

    if (varErr || !variant) {
      return NextResponse.json({ error: 'Variant not found' }, { status: 404 })
    }

    if (variant.stock_qty > 0) {
      return NextResponse.json({ error: 'This size is currently in stock!' }, { status: 400 })
    }

    // Upsert alert
    const { error } = await sbAdmin
      .from('stock_alerts')
      .upsert({
        user_id: user?.id || null,
        email: alertEmail,
        product_id,
        variant_id,
        size,
        is_notified: false
      }, { onConflict: 'email,variant_id' })

    if (error) throw new Error(error.message)

    return NextResponse.json({ success: true, message: 'You will be notified when available' })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient()
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const variant_id = req.nextUrl.searchParams.get('variant_id')
    if (!variant_id) return NextResponse.json({ error: 'Missing variant_id' }, { status: 400 })

    const { error } = await supabase
      .from('stock_alerts')
      .delete()
      .eq('user_id', user.id)
      .eq('variant_id', variant_id)

    if (error) throw new Error(error.message)

    return NextResponse.json({ removed: true })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
