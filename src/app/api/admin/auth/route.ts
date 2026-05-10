import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { signAdminToken } from '@/lib/adminAuth'
import { adminAuthLimiter } from '@/lib/ratelimit'
import { ADMIN_COOKIE_NAME } from '@/lib/requireAdmin'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  // ── Rate limit: 5 attempts per 15 min per IP ──────────────────────────────
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    req.headers.get('x-real-ip') ??
    'unknown'

  let rateLimitOk = true
  try {
    const { success } = await adminAuthLimiter.limit(ip)
    rateLimitOk = success
  } catch (e) {
    console.error('[Admin Auth] Rate limiter error (non-fatal):', e)
    // fail open — do not block login if Redis is unavailable
  }
  if (!rateLimitOk) {
    return NextResponse.json(
      { error: 'Too many attempts. Try again in 15 minutes.' },
      { status: 429 }
    )
  }

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

  // ── Use anon client for signInWithPassword (auth API requires anon key) ───
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { data: { user }, error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (signInError || !user) {
    console.error('[Admin Auth] 401: invalid_credentials')
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
  }

  // ── Fetch role from profiles using admin client (bypasses RLS) ────────────
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('role, is_active')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    console.error('[Admin Auth] 403: profile_not_found', profileError?.message)
    return NextResponse.json({ error: 'Profile not found' }, { status: 403 })
  }

  // ── Check role — allow both 'admin' AND 'super_admin' ─────────────────────
  if (profile.role !== 'admin' && profile.role !== 'super_admin') {
    console.error('[Admin Auth] 403: role_not_admin')
    return NextResponse.json({ error: 'Unauthorized — admin access required' }, { status: 403 })
  }

  if (!profile.is_active) {
    console.error('[Admin Auth] 403: account_disabled')
    return NextResponse.json({ error: 'Account disabled' }, { status: 403 })
  }

  // ── Sign JWT and set session cookie ───────────────────────────────────────
  const JWT_SECRET = process.env.JWT_SECRET
  if (!JWT_SECRET) {
    console.warn('[Admin Auth] JWT_SECRET not set — using dev fallback')
  }

  let token: string
  try {
    token = await signAdminToken({ id: user.id, email: user.email, role: profile.role })
  } catch (jwtErr) {
    console.error('[Admin Auth] 500: jwt_error')
    return NextResponse.json({ error: 'Authentication error' }, { status: 500 })
  }

  const response = NextResponse.json({ success: true, role: profile.role })
  response.cookies.set(ADMIN_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 86400, // 24h
    secure: process.env.NODE_ENV === 'production',
  })

  return response
}
