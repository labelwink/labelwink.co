import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { verifyAdminToken } from '@/lib/adminAuth'

// ── Consistent cookie name — must match auth/route.ts ─────────────────────
export const ADMIN_COOKIE_NAME = 'admin_session'

export interface AdminPayload {
  id: string
  email: string
  role: 'admin' | 'super_admin'
  iat?: number
  exp?: number
}

/**
 * Call at the top of every admin API route handler.
 *
 * Returns an AdminPayload object if the session is valid.
 * Returns a 401 NextResponse if not authenticated.
 *
 * Usage:
 *   const authResult = await requireAdmin()
 *   if (authResult instanceof NextResponse) return authResult
 *   const { id, role } = authResult
 */
export async function requireAdmin(): Promise<NextResponse | AdminPayload> {
  const cookieStore = await cookies()
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const payload = await verifyAdminToken(token)
  if (!payload || typeof payload !== 'object') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return payload as AdminPayload
}
