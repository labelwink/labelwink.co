import { requireSuperAdmin } from '@/lib/requireSuperAdmin'
import { createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const error = await requireSuperAdmin(req)
  if (error) return error

  const { id } = await params
  const supabase = createAdminClient()

  const { error: dbError } = await supabase
    .from('system_logs')
    .delete()
    .eq('id', id)

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const error = await requireSuperAdmin(req)
  if (error) return error

  const { id } = await params
  const body = await req.json()

  const supabase = createAdminClient()

  // Only update valid DB columns (resolved doesn't exist — ignore it)
  const updatePayload: Record<string, unknown> = {}
  if (body.level) updatePayload.level = body.level
  if (body.message !== undefined) updatePayload.message = body.message
  if (body.details !== undefined) updatePayload.details = body.details

  if (Object.keys(updatePayload).length === 0) {
    return NextResponse.json({ success: true }) // Nothing to update
  }

  const { data, error: dbError } = await supabase
    .from('system_logs')
    .update(updatePayload)
    .eq('id', id)
    .select()

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 })
  }

  return NextResponse.json(data?.[0] ?? { success: true })
}
