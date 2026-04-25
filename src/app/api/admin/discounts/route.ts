import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = createAdminClient()
  const { data, error } = await supabase.from('coupons').select('*').order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const supabase = createAdminClient()
  const body = await req.json()

  // Normalize type: form sends 'percent'|'flat', DB CHECK allows 'percentage'|'flat'|'percent'
  const typeMap: Record<string, string> = {
    'Percentage (%)': 'percentage',
    'Flat Amount (₹)': 'flat',
    percentage: 'percentage',
    percent: 'percent',
    flat: 'flat',
  }

  // Convert any date string to ISO — handles YYYY-MM-DD (native <input type="date">)
  const toISO = (dateStr: string | undefined | null): string | null => {
    if (!dateStr) return null
    // DD-MM-YYYY → ISO
    if (/^\d{2}-\d{2}-\d{4}$/.test(dateStr)) {
      const [d, m, y] = dateStr.split('-')
      return new Date(`${y}-${m}-${d}T23:59:59Z`).toISOString()
    }
    // Already YYYY-MM-DD (from <input type="date">)
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return new Date(`${dateStr}T23:59:59Z`).toISOString()
    }
    return new Date(dateStr).toISOString()
  }

  const row = {
    code: (body.code as string)?.toUpperCase().trim(),
    // Accept both field name conventions
    type: typeMap[body.type ?? body.discount_type] ?? body.type ?? body.discount_type ?? 'flat',
    value: Number(body.value ?? body.discount_value ?? 0),
    min_order: Number(body.min_order ?? body.min_order_amount ?? 0),
    max_uses: body.max_uses ? Number(body.max_uses) : null,
    expires_at: toISO(body.expires_at),
    is_active: body.is_active ?? true,
    used_count: 0,
  }

  const { data, error } = await supabase.from('coupons').insert([row]).select().single()
  if (error) {
    console.error('Coupon insert error:', JSON.stringify(error, null, 2))
    return NextResponse.json({ error: error.message, hint: error.hint, details: error.details, code: error.code }, { status: 500 })
  }
  return NextResponse.json(data, { status: 201 })
}

export async function DELETE(req: NextRequest) {
  const supabase = createAdminClient()
  const { id } = await req.json()
  const { error } = await supabase.from('coupons').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
