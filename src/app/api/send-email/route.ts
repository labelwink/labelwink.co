import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

/**
 * POST /api/send-email
 *
 * Thin Next.js proxy that calls the Supabase Edge Function
 * `send-transactional-email` with the service-role key.
 *
 * This avoids exposing the Supabase service-role key to the browser,
 * and allows server-side code to call this endpoint without importing
 * Supabase client in non-server contexts.
 */
export async function POST(req: NextRequest) {
  const body = await req.json()

  const SUPABASE_URL     = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const SUPABASE_SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY!

  if (!SUPABASE_URL || !SUPABASE_SERVICE) {
    console.warn('[send-email] Supabase config missing — email skipped')
    return NextResponse.json({ ok: false, reason: 'no_config' })
  }

  try {
    const res = await fetch(
      `${SUPABASE_URL}/functions/v1/send-transactional-email`,
      {
        method:  'POST',
        headers: {
          'Content-Type':  'application/json',
          Authorization:   `Bearer ${SUPABASE_SERVICE}`,
        },
        body: JSON.stringify(body),
      }
    )
    const data = await res.json()
    return NextResponse.json(data)
  } catch (err) {
    console.error('[send-email] Edge Function call failed:', err)
    return NextResponse.json({ ok: false })
  }
}
