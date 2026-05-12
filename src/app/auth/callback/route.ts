import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code  = searchParams.get('code')
  const error = searchParams.get('error')
  let next    = searchParams.get('next') ?? '/'

  // Ensure 'next' is a relative path to prevent open redirects
  if (!next.startsWith('/')) {
    next = '/'
  }

  // Supabase returned an auth error (e.g. "Database error saving new user")
  if (error) {
    const errorCode = searchParams.get('error_code') ?? ''
    const desc      = searchParams.get('error_description') ?? ''
    console.error('[Auth Callback] Error from Supabase:', errorCode, desc)
    return NextResponse.redirect(
      `${origin}/account/login?error=auth_callback_failed`
    )
  }

  if (code) {
    const supabase    = await createClient()
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    if (!exchangeError) {
      // Application-side profile upsert as safety net in case the DB trigger fails
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const adminClient = createServiceClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
          )
          const fullName =
            user.user_metadata?.full_name ??
            user.user_metadata?.name ??
            user.email?.split('@')[0] ??
            ''
          const avatarUrl =
            user.user_metadata?.avatar_url ??
            user.user_metadata?.picture ??
            null

          await adminClient
            .from('profiles')
            .upsert(
              {
                id:         user.id,
                email:      user.email ?? null,
                full_name:  fullName,
                avatar_url: avatarUrl,
                role:       'customer',
                updated_at: new Date().toISOString(),
              },
              { onConflict: 'id' }
            )
        }
      } catch (profileErr) {
        // Non-fatal: user can still log in even if profile upsert fails
        console.warn('[Auth Callback] Profile upsert warning:', profileErr)
      }

      // Redirect to destination
      const forwardedHost = request.headers.get('x-forwarded-host')
      const isLocalEnv    = process.env.NODE_ENV === 'development'

      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${next}`)
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`)
      } else {
        return NextResponse.redirect(`${origin}${next}`)
      }
    }
  }

  // Code exchange failed — redirect to login with error
  return NextResponse.redirect(`${origin}/account/login?error=auth_callback_failed`)
}
