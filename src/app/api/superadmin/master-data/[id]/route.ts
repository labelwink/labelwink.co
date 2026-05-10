import { requireSuperAdmin } from '@/lib/requireSuperAdmin'
import { createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const error = await requireSuperAdmin(req)
  if (error) return error

  const { id } = await params
  const body = await req.json()

  const supabase = createAdminClient()

  const { data, error: dbError } = await supabase
    .from('product_attributes')
    .update(body)
    .eq('id', id)
    .select()

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 })
  }

  return NextResponse.json(data?.[0])
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const error = await requireSuperAdmin(req)
  if (error) return error

  const { id } = await params
  const supabase = createAdminClient()

  const { error: dbError } = await supabase
    .from('product_attributes')
    .delete()
    .eq('id', id)

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
