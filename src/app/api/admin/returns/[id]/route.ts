import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'
type Ctx = { params: Promise<{ id: string }> }

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const { id } = await params
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createAdminSupabaseClient() as any
  const body = await req.json()

  const allowed: Record<string, unknown> = {}
  if ('status'        in body) allowed.status        = body.status
  if ('admin_note'    in body) allowed.admin_note     = body.admin_note
  if ('refund_amount' in body) allowed.refund_amount  = body.refund_amount

  const { data, error } = await supabase
    .from('return_requests')
    .update(allowed)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
