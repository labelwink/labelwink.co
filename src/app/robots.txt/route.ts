import { NextResponse } from 'next/server'

export const runtime = 'edge'

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://labelwink.co'

export function GET() {
  const content = `User-agent: *
Allow: /

# Private / admin areas — no crawling
Disallow: /admin/
Disallow: /api/
Disallow: /account/
Disallow: /checkout/
Disallow: /checkout
Disallow: /order-success/
Disallow: /order-success

# Sitemap
Sitemap: ${SITE}/sitemap.xml
`
  return new NextResponse(content, {
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'public, max-age=86400',
    },
  })
}
