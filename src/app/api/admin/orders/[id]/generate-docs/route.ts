import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/requireAdmin'
import { generateOrderDocuments } from '@/lib/pdf/generator'

export async function POST(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin()
  if (guard instanceof NextResponse) return guard

  const { id } = await params
  const supabase = createAdminSupabaseClient()

  try {
    const { data: order, error: fetchError } = await supabase
      .from('orders')
      .select('*, invoices(*)')
      .eq('id', id)
      .single()

    if (fetchError || !order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })

    const { data: settings } = await supabase.from('site_legal_settings').select('*').single()
    if (!settings) return NextResponse.json({ error: 'Legal settings not found' }, { status: 400 })

    const docs = await generateOrderDocuments(supabase, order, settings)

    const { error: updateError } = await supabase
      .from('orders')
      .update({
        invoice_pdf_url: docs.invoice_pdf_url,
        label_pdf_url: docs.label_pdf_url,
        documents_generated_at: docs.documents_generated_at
      })
      .eq('id', id)

    if (updateError) throw updateError;

    return NextResponse.json({ success: true, ...docs })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
