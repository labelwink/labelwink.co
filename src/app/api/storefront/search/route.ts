import { NextRequest, NextResponse } from 'next/server'

/**
 * @deprecated Use /api/storefront/products/search instead.
 * This route forwards all params for backward compatibility.
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const target = new URL('/api/storefront/products/search', url.origin)
  // Forward all search params
  url.searchParams.forEach((value, key) => target.searchParams.set(key, value))
  return NextResponse.redirect(target, { status: 308 })
}
