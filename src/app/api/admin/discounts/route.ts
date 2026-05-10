import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/requireAdmin'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const guard = await requireAdmin()
  if (guard instanceof NextResponse) return guard

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = createAdminSupabaseClient() as any
  const sp = new URL(req.url).searchParams
  const search = (sp.get('search') || '').toLowerCase()
  const status = sp.get('status') || 'all'

  try {
    const { data: discounts, error } = await sb.from('discount_codes')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw new Error(error.message)

    const now = new Date()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mapped = (discounts || []).map((d: any) => {
      let total_uses = Number(d.usage_count || 0)
      let total_discount_given = 0 // Not tracked at discount code level currently

      let dStatus = 'active'
      if (!d.is_active) {
        dStatus = 'inactive'
      } else if (d.starts_at && new Date(d.starts_at) > now) {
        dStatus = 'scheduled'
      } else if (d.expires_at && new Date(d.expires_at) < now) {
        dStatus = 'expired'
      } else if (d.usage_limit && d.usage_count >= d.usage_limit) {
        dStatus = 'expired' // Max uses reached
      }

      return {
        ...d,
        total_uses,
        total_discount_given,
        status: dStatus
      }
    })

    const filtered = mapped.filter((d: any) => {
      if (status !== 'all' && d.status !== status) return false
      if (search && !d.code.toLowerCase().includes(search)) return false
      return true
    })

    return NextResponse.json(filtered)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const guard = await requireAdmin()
  if (guard instanceof NextResponse) return guard

  const sb = createAdminSupabaseClient()
  
  try {
    const body = await req.json()
    const { code, type, value, min_order_amount, max_uses, single_use_per_customer, is_active, starts_at, expires_at, description } = body

    if (!code || typeof code !== 'string') return NextResponse.json({ error: 'Code is required' }, { status: 400 })
    
    const upperCode = code.toUpperCase().trim()
    if (!/^[A-Z0-9-]{3,20}$/.test(upperCode)) {
      return NextResponse.json({ error: 'Code must be 3-20 uppercase alphanumeric characters or hyphens' }, { status: 400 })
    }

    if (!['percentage', 'flat', 'free_shipping'].includes(type)) {
      return NextResponse.json({ error: 'Invalid discount type' }, { status: 400 })
    }

    const val = Number(value)
    if (type !== 'free_shipping') {
      if (isNaN(val) || val <= 0) return NextResponse.json({ error: 'Value must be > 0' }, { status: 400 })
      if (type === 'percentage' && val > 100) return NextResponse.json({ error: 'Percentage cannot exceed 100' }, { status: 400 })
    }

    // Check if code exists
    const { data: existing } = await sb.from('discount_codes').select('id').eq('code', upperCode).single()
    if (existing) {
      return NextResponse.json({ error: 'Discount code already exists' }, { status: 400 })
    }

    const insertData: any = {
      code: upperCode,
      type,
      value: type === 'free_shipping' ? 0 : val,
      min_order_amount: min_order_amount ? Number(min_order_amount) : 0,
      usage_limit: max_uses ? Number(max_uses) : null,
      single_use_per_customer: !!single_use_per_customer,
      is_active: is_active ?? true,
      description: description || null
    }

    if (starts_at) insertData.starts_at = new Date(starts_at).toISOString()
    if (expires_at) insertData.expires_at = new Date(expires_at).toISOString()

    const { data, error } = await sb.from('discount_codes').insert(insertData).select().single()
    if (error) throw new Error(error.message)

    return NextResponse.json(data)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
