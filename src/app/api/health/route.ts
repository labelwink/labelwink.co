import { NextResponse } from 'next/server'
import { requireSuperAdmin } from '@/lib/requireSuperAdmin'

/**
 * GET /api/health
 * Lightweight DB connectivity check — super admin only.
 */
export async function GET(req: Request) {
  const authError = await requireSuperAdmin(req)
  if (authError) return authError

  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  })
}