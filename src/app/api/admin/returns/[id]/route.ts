import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
type Ctx = { params: Promise<{ id: string }> }

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const { id }    = await params
  const supabase  = createAdminClient()
  const body      = await req.json()

  const allowed: Record<string, unknown> = {}
  if ('status'        in body) allowed.status        = body.status
  if ('admin_note'    in body) allowed.admin_note     = body.admin_note
  if ('refund_amount' in body) allowed.refund_amount  = body.refund_amount
  allowed.updated_at = new Date().toISOString()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('return_requests')
    .update(allowed)
    .eq('id', id)
    .select(`
      id, status, admin_note, refund_amount,
      order_id,
      orders ( id, customer_name, customer_email, user_id )
    `)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // ── Send email notification on status change ────────────────────────────────
  const newStatus   = body.status as string | undefined
  const order       = data?.orders as { customer_email?: string; customer_name?: string } | null
  const customerEmail = order?.customer_email
  const customerName  = order?.customer_name || 'Customer'

  if (
    customerEmail &&
    (newStatus === 'approved' || newStatus === 'refunded' || newStatus === 'rejected')
  ) {
    const typeMap: Record<string, string> = {
      approved: 'return_approved',
      refunded: 'return_approved',
      rejected: 'return_rejected',
    }
    const emailType = typeMap[newStatus] ?? 'return_approved'

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://labelwink.co'

    try {
      await fetch(`${siteUrl}/api/send-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to:   customerEmail,
          type: emailType,
          title: newStatus === 'rejected' ? 'Update on your return request' : 'Your return request has been approved',
          body: newStatus === 'rejected'
            ? `Hi ${customerName}, we could not process your return request.`
            : `Hi ${customerName}, your return has been approved. Store credit will be added to your account.`,
          data: { order_id: data.order_id },
        }),
      })
    } catch { /* non-fatal */ }
  }

  return NextResponse.json(data)
}
