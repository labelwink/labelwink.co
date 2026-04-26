import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { signAdminToken } from '@/lib/adminAuth'
import { adminAuthLimiter } from '@/lib/ratelimit'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  // ── Persistent rate limit: 5 attempts per 15 min per IP ─────────────────────
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    req.headers.get('x-real-ip') ??
    'unknown'

  let rateLimitOk = true
  try {
    const { success } = await adminAuthLimiter.limit(ip)
    rateLimitOk = success
  } catch (e) {
    console.error('Rate limiter error (non-fatal):', e)
    // fail open — do not block login if Redis is unavailable
  }
  if (!rateLimitOk) return NextResponse.json(
    { error: 'Too many attempts. Try again in 15 minutes.' },
    { status: 429 }
  )

  let body: { email?: string; password?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { email, password } = body
  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: { user }, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error || !user) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
  }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const token = await signAdminToken({ role: 'admin' })

  const response = NextResponse.json({ success: true })
  response.cookies.set('admin_session', token, {
    httpOnly: true,
    sameSite: 'lax',   // T1: 'strict' blocks the cookie on cross-site top-level navigations (e.g. OAuth redirects). 'lax' is still safe: it blocks third-party AJAX/image requests but allows the cookie on safe same-site navigations initiated by the user.
    path: '/',
    maxAge: 86400,
    secure: process.env.NODE_ENV === 'production',
  })
  // T4 – debug: confirm the cookie was attached to the response
  console.log('Cookie set:', response.cookies.getAll())

  return response
}

