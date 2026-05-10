import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/requireAdmin'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const guard = await requireAdmin()
  if (guard instanceof NextResponse) return guard

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = createAdminSupabaseClient() as any
  const { data, error } = await sb
    .from('gst_invoices')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ invoices: data ?? [] })
}

export async function POST(req: NextRequest) {
  const guard = await requireAdmin()
  if (guard instanceof NextResponse) return guard

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = createAdminSupabaseClient() as any
  const body = await req.json()

  const { data, error } = await sb
    .from('gst_invoices')
    .insert({
      invoice_number: body.invoice_number,
      order_id:       body.order_id,
      order_number:   body.order_number,
      customer_name:  body.customer_name,
      customer_email: body.customer_email,
      invoice_date:   new Date().toISOString(),
      subtotal:       body.subtotal,
      gst_rate:       body.gst_rate,
      gst_type:       body.gst_type,
      cgst:           body.cgst ?? 0,
      sgst:           body.sgst ?? 0,
      igst:           body.igst ?? 0,
      total:          body.total,
      notes:          body.notes ?? '',
      template:       body.template ?? 'standard',
      status:         body.status ?? 'draft',
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
