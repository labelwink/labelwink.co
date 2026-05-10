import { requireSuperAdmin } from '@/lib/requireSuperAdmin'
import { createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

const VALID_ROLES = ['customer', 'employee', 'admin', 'super_admin'] as const

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const error = await requireSuperAdmin(req)
  if (error) return error

  const { id } = await params
  const body = await req.json()

  // Only allow safe fields to be updated to prevent mass assignment
  const updates: Record<string, unknown> = {}

  if (body.role !== undefined) {
    if (!VALID_ROLES.includes(body.role)) {
      return NextResponse.json(
        { error: `Invalid role. Must be one of: ${VALID_ROLES.join(', ')}` },
        { status: 400 }
      )
    }
    updates.role = body.role
  }

  if (body.is_active !== undefined) {
    updates.is_active = Boolean(body.is_active)
  }

  if (body.full_name !== undefined) {
    updates.full_name = body.full_name
  }

  if (body.phone !== undefined) {
    updates.phone = body.phone || null
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
  }

  const supabase = createAdminClient()

  const { data, error: dbError } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
