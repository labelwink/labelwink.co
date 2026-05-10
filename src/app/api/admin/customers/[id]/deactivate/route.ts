import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/requireAdmin'

export const runtime = 'nodejs'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireAdmin()
  if (guard instanceof NextResponse) return guard

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createAdminSupabaseClient() as any
  const { id } = await params
  const { deactivate } = await req.json()

  if (typeof deactivate !== 'boolean') {
    return NextResponse.json({ error: '"deactivate" must be a boolean' }, { status: 400 })
  }

  const { error } = await supabase.auth.admin.updateUserById(id, {
    ban_duration: deactivate ? '87600h' : 'none', // 87600h ≈ 10 years
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({
    success: true,
    status: deactivate ? 'deactivated' : 'active',
    message: deactivate
      ? 'Account deactivated — user cannot log in. Data preserved.'
      : 'Account reactivated.',
  })
}
