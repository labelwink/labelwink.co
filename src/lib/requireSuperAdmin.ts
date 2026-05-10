import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { verifyAdminToken } from '@/lib/adminAuth'
import { createAdminClient } from '@/lib/supabase/server'

export const ADMIN_COOKIE_NAME = 'admin_session'

/**
 * Validates the admin_session JWT and verifies that the caller has
 * the 'super_admin' role in the profiles table.
 *
 * Returns null on success.
 * Returns a NextResponse (401 or 403) on failure.
 *
 * Usage:
 *   const err = await requireSuperAdmin(req)
 *   if (err) return err
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function requireSuperAdmin(_req?: Request): Promise<NextResponse | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const payload = await verifyAdminToken(token)
  if (!payload || typeof payload !== 'object') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const jwtPayload = payload as Record<string, unknown>
  const jwtRole = jwtPayload.role as string | undefined

  // Fast-path: role already in JWT
  if (jwtRole === 'super_admin') return null

  // Fallback: verify against the profiles table (covers role updates)
  const adminId = jwtPayload.id as string | undefined
  if (!adminId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, is_active')
    .eq('id', adminId)
    .single()

  if (!profile) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (profile.role !== 'super_admin') {
    return NextResponse.json({ error: 'Forbidden - Super Admin only' }, { status: 403 })
  }
  if (!profile.is_active) {
    return NextResponse.json({ error: 'Account suspended' }, { status: 403 })
  }

  return null
}
