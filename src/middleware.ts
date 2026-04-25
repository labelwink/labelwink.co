import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  // 1. Quick check: Is this a route that actually needs protection?
  const isAuthRoute = request.nextUrl.pathname.startsWith('/account/login') || request.nextUrl.pathname.startsWith('/admin/login')
  const isAccountRoute = request.nextUrl.pathname.startsWith('/account') && !isAuthRoute
  const isAdminRoute = request.nextUrl.pathname.startsWith('/admin') && !isAuthRoute
  
  // 2. If it's a public page (Homepage, Collections, Products, About, Policies), skip the heavy auth logic!
  if (!isAccountRoute && !isAdminRoute && !isAuthRoute) {
    return await updateSession(request)
  }

  // 3. For protected routes, do the heavy check
  const response = await updateSession(request)
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return request.cookies.get(name)?.value },
        set(name: string, value: string, options: CookieOptions) { request.cookies.set({ name, value, ...options }) },
        remove(name: string, options: CookieOptions) { request.cookies.set({ name, value: '', ...options }) },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  if (isAccountRoute && !user) {
    return NextResponse.redirect(new URL('/account/login', request.url))
  }

  if (isAdminRoute && !user) {
    return NextResponse.redirect(new URL('/admin/login', request.url))
  }

  // Redirect from login if already authenticated
  if (isAuthRoute && user) {
    const redirectUrl = request.nextUrl.pathname.startsWith('/admin') ? '/admin' : '/account'
    return NextResponse.redirect(new URL(redirectUrl, request.url))
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
