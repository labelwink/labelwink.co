import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { verifyAdminToken } from '@/lib/adminAuth'

/**
 * Call at the top of every admin API route handler.
 * Returns a 401 NextResponse if the request is not authenticated,
 * or null if the session is valid (caller should proceed normally).
 *
 * Usage:
 *   const guard = await requireAdmin()
 *   if (guard) return guard
 */
export async function requireAdmin(): Promise<NextResponse | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get('admin_session')?.value
  // T4 – debug: confirm whether the cookie reached the server
  console.log('Token from cookie:', token ? 'present' : 'missing')

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const payload = await verifyAdminToken(token)
  if (!payload) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return null
}
