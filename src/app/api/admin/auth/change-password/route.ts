import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireAdmin } from '@/lib/requireAdmin'

export const runtime = 'nodejs'

/**
 * POST /api/admin/auth/change-password
 *
 * Changes the Supabase Auth password for the currently logged-in admin user.
 * The admin must supply their current password so Supabase can re-authenticate,
 * then we call supabase.auth.updateUser() to set the new one.
 *
 * Body: { newPassword: string; confirmPassword: string }
 */
export async function POST(req: NextRequest) {
  const guard = await requireAdmin()
  if (guard) return guard

  let body: { newPassword?: string; confirmPassword?: string; email?: string; currentPassword?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { newPassword, confirmPassword, email, currentPassword } = body

  if (!newPassword || newPassword.length < 8) {
    return NextResponse.json({ error: 'New password must be at least 8 characters' }, { status: 400 })
  }

  if (newPassword !== confirmPassword) {
    return NextResponse.json({ error: 'Passwords do not match' }, { status: 400 })
  }

  // Re-authenticate with current credentials to get a session, then update password
  if (!email || !currentPassword) {
    return NextResponse.json({ error: 'email and currentPassword required' }, { status: 400 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Sign in to verify current credentials
  const { data: { user }, error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password: currentPassword,
  })

  if (signInError || !user) {
    return NextResponse.json({ error: 'Current credentials are incorrect' }, { status: 401 })
  }

  // Update password via Admin API (service role can update any user)
  const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
    password: newPassword,
  })

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, message: 'Password updated successfully.' })
}
